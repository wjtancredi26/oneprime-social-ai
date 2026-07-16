import express from "express";
import prisma from "../prisma/client.js";
import { authenticate } from "../middlewares/auth.js";
import {
  publishFacebookPost,
  publishInstagramPost,
} from "../services/metaService.js";
import {
  getSelectedNetworks,
  publishScheduledPost,
} from "../services/postPublisherService.js";
import { resolveCompanyId } from "../services/socialConnectionService.js";

const router = express.Router();

router.use(authenticate);

function normalizeError(error) {
  return (
    error?.message ||
    error?.response?.data?.error?.message ||
    error?.response?.data?.error ||
    "Erro desconhecido durante a publicação."
  );
}

function buildPostMessage(post) {
  return `${post.caption || ""}

${post.hashtags || ""}

${post.cta || ""}`.trim();
}

function isCompletelyPublished(post) {
  const selected = getSelectedNetworks(post.network);

  const facebookDone =
    !selected.facebook || Boolean(post.facebookPostId);

  const instagramDone =
    !selected.instagram || Boolean(post.instagramPostId);

  return facebookDone && instagramDone;
}

async function publishByNetwork({
  companyId,
  network,
  message,
  imageUrl,
}) {
  const selected = getSelectedNetworks(network);
  const results = {};

  if (!selected.facebook && !selected.instagram) {
    throw new Error(
      "Selecione Facebook, Instagram ou ambas as redes."
    );
  }

  if (selected.facebook) {
    results.facebook = await publishFacebookPost({
      companyId,
      message,
      imageUrl: imageUrl || null,
    });
  }

  if (selected.instagram) {
    if (!imageUrl) {
      throw new Error(
        "O Instagram exige uma imagem pública para publicar."
      );
    }

    results.instagram = await publishInstagramPost({
      companyId,
      caption: message,
      imageUrl,
    });
  }

  return results;
}

/**
 * Publicação avulsa, sem um ScheduledPost salvo.
 */
router.post("/now", async (req, res) => {
  try {
    const {
      message,
      caption,
      imageUrl,
      network = "Facebook",
      companyId,
    } = req.body;

    const finalMessage = message || caption;

    if (!finalMessage?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Mensagem obrigatória.",
      });
    }

    const resolvedCompanyId = await resolveCompanyId({
      user: req.user,
      requestedCompanyId: companyId,
    });

    const results = await publishByNetwork({
      companyId: resolvedCompanyId,
      network,
      message: finalMessage,
      imageUrl,
    });

    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    const message = normalizeError(error);

    console.error("ERRO AO PUBLICAR AGORA:", message);

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

async function publishSavedPost(req, res) {
  const postId = Number(req.params.id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({
      success: false,
      error: "ID da postagem inválido.",
    });
  }

  try {
    let post = await prisma.scheduledPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Postagem não encontrada.",
      });
    }

    const companyId = await resolveCompanyId({
      user: req.user,
      requestedCompanyId: post.companyId,
    });

    if (post.status === "PUBLICANDO") {
      return res.status(409).json({
        success: false,
        error: "Esta postagem já está sendo publicada.",
      });
    }

    if (
      post.status === "PUBLICADO" &&
      isCompletelyPublished(post)
    ) {
      return res.status(409).json({
        success: false,
        error:
          "Esta postagem já foi publicada em todas as redes selecionadas.",
      });
    }

    /*
     * Reserva o post para impedir dois cliques simultâneos.
     */
    const claimed =
      await prisma.scheduledPost.updateMany({
        where: {
          id: post.id,
          status: {
            not: "PUBLICANDO",
          },
        },
        data: {
          status: "PUBLICANDO",
          attempts: {
            increment: 1,
          },
          lastError: null,
        },
      });

    if (claimed.count !== 1) {
      return res.status(409).json({
        success: false,
        error: "A postagem já está sendo processada.",
      });
    }

    post = await prisma.scheduledPost.findUnique({
      where: {
        id: post.id,
      },
    });

    const results = await publishScheduledPost(post, {
      onProgress: async (progress) => {
        post = await prisma.scheduledPost.update({
          where: {
            id: post.id,
          },
          data: progress,
        });
      },
    });

    post = await prisma.scheduledPost.findUnique({
      where: {
        id: post.id,
      },
    });

    if (!post || !isCompletelyPublished(post)) {
      throw new Error(
        "A publicação não foi concluída em todas as redes selecionadas."
      );
    }

    const updatedPost =
      await prisma.scheduledPost.update({
        where: {
          id: post.id,
        },
        data: {
          status: "PUBLICADO",
          publishedAt: new Date(),
          lastError: null,
        },
      });

    return res.json({
      success: true,
      results,
      post: updatedPost,
    });
  } catch (error) {
    const message = normalizeError(error);

    console.error(
      `ERRO AO PUBLICAR POST ${postId}:`,
      message
    );

    await prisma.scheduledPost
      .update({
        where: {
          id: postId,
        },
        data: {
          status: "ERRO",
          lastError: message,
        },
      })
      .catch(() => {});

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}

router.post("/post/:id", publishSavedPost);

/*
 * Rota antiga mantida para compatibilidade.
 */
router.post("/facebook/post/:id", publishSavedPost);

/**
 * Permite tentar novamente um post que ficou com erro.
 *
 * Se o Facebook já tiver sido publicado, por exemplo,
 * ele será ignorado e somente o Instagram será tentado.
 */
router.post("/post/:id/retry", async (req, res) => {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID da postagem inválido.",
      });
    }

    const post = await prisma.scheduledPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Postagem não encontrada.",
      });
    }

    await resolveCompanyId({
      user: req.user,
      requestedCompanyId: post.companyId,
    });

    if (post.status === "PUBLICANDO") {
      return res.status(409).json({
        success: false,
        error: "Esta postagem já está sendo processada.",
      });
    }

    const updatedPost =
      await prisma.scheduledPost.update({
        where: {
          id: post.id,
        },
        data: {
          status: "AGENDADO",
          scheduledAt: new Date(),
          lastError: null,
        },
      });

    return res.json({
      success: true,
      message:
        "Nova tentativa de publicação programada.",
      post: updatedPost,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: normalizeError(error),
    });
  }
});

export default router;