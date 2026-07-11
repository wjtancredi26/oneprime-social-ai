import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  publishFacebookPost,
  publishInstagramPost,
} from "../services/metaService.js";

const router = express.Router();
const prisma = new PrismaClient();

function buildPostMessage(post) {
  return `${post.caption || ""}

${post.hashtags || ""}

${post.cta || ""}`.trim();
}

function networkIncludes(network = "", target) {
  return network.toLowerCase().includes(target.toLowerCase());
}

router.post("/facebook", async (req, res) => {
  try {
    const { message, imageUrl } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Mensagem obrigatória.",
      });
    }

    const result = await publishFacebookPost({ message, imageUrl });

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("ERRO AO PUBLICAR NO FACEBOOK:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/instagram", async (req, res) => {
  try {
    const { caption, message, imageUrl } = req.body;

    const finalCaption = caption || message;

    if (!finalCaption) {
      return res.status(400).json({
        success: false,
        error: "Legenda obrigatória.",
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Imagem obrigatória para Instagram.",
      });
    }

    const result = await publishInstagramPost({
      caption: finalCaption,
      imageUrl,
    });

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("ERRO AO PUBLICAR NO INSTAGRAM:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/now", async (req, res) => {
  try {
    const { message, caption, imageUrl, network = "Facebook" } = req.body;
    const finalMessage = message || caption;

    if (!finalMessage) {
      return res.status(400).json({
        success: false,
        error: "Mensagem obrigatória.",
      });
    }

    const results = {};

    if (networkIncludes(network, "Facebook")) {
      results.facebook = await publishFacebookPost({
        message: finalMessage,
        imageUrl,
      });
    }

    if (networkIncludes(network, "Instagram")) {
      results.instagram = await publishInstagramPost({
        caption: finalMessage,
        imageUrl,
      });
    }

    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("ERRO AO PUBLICAR AGORA:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.scheduledPost.findUnique({
      where: { id: Number(id) },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Postagem não encontrada.",
      });
    }

    const message = buildPostMessage(post);
    const results = {};

    if (networkIncludes(post.network, "Facebook")) {
      results.facebook = await publishFacebookPost({
        message,
        imageUrl: post.imageUrl,
      });
    }

    if (networkIncludes(post.network, "Instagram")) {
      results.instagram = await publishInstagramPost({
        caption: message,
        imageUrl: post.imageUrl,
      });
    }

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: Number(id) },
      data: {
        status: "PUBLICADO",
      },
    });

    return res.json({
      success: true,
      results,
      post: updatedPost,
    });
  } catch (error) {
    console.error("ERRO AO PUBLICAR POST:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/facebook/post/:id", async (req, res) => {
  req.url = `/post/${req.params.id}`;
  return router.handle(req, res);
});

export default router;
