import express from "express";
import prisma from "../prisma/client.js";
import { authenticate } from "../middlewares/auth.js";
import {
  publishFacebookPost,
  publishInstagramPost,
} from "../services/metaService.js";
import { resolveCompanyId } from "../services/socialConnectionService.js";

const router = express.Router();
router.use(authenticate);

function buildPostMessage(post) {
  return `${post.caption || ""}\n\n${post.hashtags || ""}\n\n${
    post.cta || ""
  }`.trim();
}

function networkIncludes(network = "", target) {
  return network.toLowerCase().includes(target.toLowerCase());
}

async function publishByNetwork({ companyId, network, message, imageUrl }) {
  const results = {};

  if (networkIncludes(network, "Facebook")) {
    results.facebook = await publishFacebookPost({
      companyId,
      message,
      imageUrl,
    });
  }

  if (networkIncludes(network, "Instagram")) {
    results.instagram = await publishInstagramPost({
      companyId,
      caption: message,
      imageUrl,
    });
  }

  if (Object.keys(results).length === 0) {
    throw new Error("Selecione Facebook, Instagram ou ambas as redes.");
  }

  return results;
}

router.post("/now", async (req, res) => {
  try {
    const { message, caption, imageUrl, network = "Facebook", companyId } = req.body;
    const finalMessage = message || caption;

    if (!finalMessage?.trim()) {
      return res.status(400).json({ success: false, error: "Mensagem obrigatória." });
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

    return res.json({ success: true, results });
  } catch (error) {
    console.error("ERRO AO PUBLICAR AGORA:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/post/:id", async (req, res) => {
  try {
    const post = await prisma.scheduledPost.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!post) {
      return res.status(404).json({ success: false, error: "Postagem não encontrada." });
    }

    const companyId = await resolveCompanyId({
      user: req.user,
      requestedCompanyId: post.companyId,
    });
    const message = buildPostMessage(post);

    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "PUBLICANDO", attempts: { increment: 1 } },
    });

    const results = await publishByNetwork({
      companyId,
      network: post.network,
      message,
      imageUrl: post.imageUrl,
    });

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: post.id },
      data: {
        status: "PUBLICADO",
        publishedAt: new Date(),
        facebookPostId:
          results.facebook?.post_id || results.facebook?.id || null,
        instagramPostId: results.instagram?.id || null,
        lastError: null,
      },
    });

    return res.json({ success: true, results, post: updatedPost });
  } catch (error) {
    console.error("ERRO AO PUBLICAR POST:", error);

    const postId = Number(req.params.id);
    if (Number.isInteger(postId)) {
      await prisma.scheduledPost
        .update({
          where: { id: postId },
          data: { status: "ERRO", lastError: error.message },
        })
        .catch(() => {});
    }

    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/facebook/post/:id", async (req, res, next) => {
  req.url = `/post/${req.params.id}`;
  return router.handle(req, res, next);
});

export default router;
