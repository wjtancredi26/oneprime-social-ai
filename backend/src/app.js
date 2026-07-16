import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import path from "path";

import mediaRoutes from "./routes/mediaRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import publishRoutes from "./routes/publishRoutes.js";
import metaAuthRoutes from "./routes/metaAuthRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { buildPremiumImagePrompt } from "./services/creativePromptService.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const productionFrontend =
  "https://oneprime-social-ai-frontend-8fqs.vercel.app";

app.use(
  cors({
    origin(origin, callback) {
      // Permite requisições internas, Postman e acesso direto.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin
        .trim()
        .replace(/\/$/, "");

      const isConfiguredOrigin =
        configuredOrigins.includes(normalizedOrigin);

      const isProductionFrontend =
        normalizedOrigin === productionFrontend;

      const isVercelDeployment =
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(
          normalizedOrigin
        );

      const isLocalDevelopment =
        normalizedOrigin === "http://localhost:5173" ||
        normalizedOrigin === "http://127.0.0.1:5173";

      const isAllowed =
        isConfiguredOrigin ||
        isProductionFrontend ||
        isVercelDeployment ||
        isLocalDevelopment;

      if (!isAllowed) {
        console.warn(
          "Origem bloqueada pelo CORS:",
          normalizedOrigin
        );

        return callback(
          new Error("Origem não permitida pelo CORS.")
        );
      }

      return callback(null, true);
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_IMAGE_SIZES = ["1024x1024", "1024x1536", "1536x1024", "auto"];

function normalizeImageSize(format) {
  if (!format) return "1024x1536";

  if (format === "1024x1792") {
    return "1024x1536";
  }

  if (format === "1792x1024") {
    return "1536x1024";
  }

  if (!ALLOWED_IMAGE_SIZES.includes(format)) {
    return "1024x1536";
  }

  return format;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "oneprime-backend" });
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiChatRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/publish", publishRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/meta", metaAuthRoutes);

app.use("/publish", publishRoutes);
app.use("/media", mediaRoutes);

async function getDefaultUser() {
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || "Wilian",
        email: process.env.ADMIN_EMAIL || "wilian@oneprimeseg.com.br",
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || "123456", 10),
        role: "ADMIN",
      },
    });
  }

  return user;
}

app.post("/api/ai/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt é obrigatório.",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em marketing digital para corretoras de seguros. Gere conteúdos profissionais em português do Brasil.",
        },
        {
          role: "user",
          content: `
Crie um conteúdo para redes sociais baseado neste pedido:

${prompt}

Responda EXATAMENTE neste formato:

Legenda:
Hashtags:
Ideia de imagem:
Melhor horário:
CTA:
`,
        },
      ],
    });

    res.json({
      success: true,
      content: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("ERRO CHATGPT:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/ai/image", async (req, res) => {
  try {
    const { prompt, style } = req.body;
    const format = normalizeImageSize(req.body.format);

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt da imagem é obrigatório.",
      });
    }

    const imagePrompt = await buildPremiumImagePrompt({
      prompt,
      style: style || "Publicidade premium realista",
      format,
    });

    console.log("FORMATO NORMALIZADO DA IMAGEM:", format);
    console.log("PROMPT PREMIUM DA IMAGEM:", imagePrompt);

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt,
      size: format,
    });

    const imageBase64 = image?.data?.[0]?.b64_json;
    const imageUrlFromApi = image?.data?.[0]?.url;

    if (imageBase64) {
      const { saveBase64Image } = await import("./services/mediaService.js");
      const savedImage = await saveBase64Image(
    imageBase64,
    "oneprime-ai-image.png");

      return res.json({
        success: true,
        imageUrl: savedImage.imageUrl,
        filename: savedImage.filename,
      });
    }

    if (imageUrlFromApi) {
      return res.json({
        success: true,
        imageUrl: imageUrlFromApi,
      });
    }

    return res.status(500).json({
      success: false,
      error: "A OpenAI respondeu, mas não retornou imagem.",
    });
  } catch (error) {
    console.error("ERRO AO GERAR IMAGEM:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/posts", async (req, res) => {
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
      companyId,
    } = req.body;

    if (!prompt || !caption || !network || !scheduledAt) {
      return res.status(400).json({
        success: false,
        error: "Dados obrigatórios ausentes.",
      });
    }

    const user = await getDefaultUser();

    const post = await prisma.scheduledPost.create({
      data: {
        prompt,
        caption,
        hashtags: hashtags || "",
        imageIdea: imageIdea || "",
        cta: cta || "",
        imageUrl: imageUrl || null,
        network,
        scheduledAt: new Date(scheduledAt),
        status: "AGENDADO",
        userId: user.id,
        companyId: companyId ? Number(companyId) : user.companyId || null,
      },
    });

    res.json({ success: true, post });
  } catch (error) {
    console.error("ERRO AO SALVAR POST:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await prisma.scheduledPost.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { company: true },
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("ERRO AO LISTAR POSTS:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      caption,
      hashtags,
      imageIdea,
      cta,
      imageUrl,
      network,
      scheduledAt,
      status,
      companyId,
    } = req.body;

    const post = await prisma.scheduledPost.update({
      where: { id: Number(id) },
      data: {
        caption,
        hashtags: hashtags || "",
        imageIdea: imageIdea || "",
        cta: cta || "",
        imageUrl: imageUrl || null,
        network,
        scheduledAt: new Date(scheduledAt),
        status: status || "AGENDADO",
        companyId: companyId ? Number(companyId) : null,
      },
    });

    res.json({ success: true, post });
  } catch (error) {
    console.error("ERRO AO EDITAR POST:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.scheduledPost.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: "Postagem excluída com sucesso.",
    });
  } catch (error) {
    console.error("ERRO AO EXCLUIR POST:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
console.log("ONEPRIME BUILD dd61870 - DASHBOARD ATIVO");
export default app; 