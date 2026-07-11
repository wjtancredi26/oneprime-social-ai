import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const posts = await prisma.scheduledPost.findMany({
      orderBy: {
        scheduledAt: "desc",
      },
    });

    return res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("ERRO AO BUSCAR POSTS:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao buscar posts.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      prompt,
      caption,
      hashtags,
      imageIdea,
      cta,
      imageUrl,
      network,
      scheduledAt,
    } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        error: "Data de agendamento obrigatória.",
      });
    }

    const post = await prisma.scheduledPost.create({
      data: {
        prompt: prompt || "",
        caption: caption || "",
        hashtags: hashtags || "",
        imageIdea: imageIdea || "",
        cta: cta || "",
        imageUrl: imageUrl || null,
        network: network || "Facebook",
        scheduledAt: new Date(scheduledAt),
        status: "PENDENTE",
      },
    });

    return res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("ERRO AO CRIAR POST:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao criar post.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.scheduledPost.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({
      success: true,
      message: "Post excluído com sucesso.",
    });
  } catch (error) {
    console.error("ERRO AO EXCLUIR POST:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao excluir post.",
    });
  }
});

export default router;