import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import metaAuthRoutes from "./routes/metaAuthRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import publishRoutes from "./routes/publishRoutes.js";

import { buildPremiumImagePrompt } from "./services/creativePromptService.js";

dotenv.config();

const app = express();

const configuredOrigins = (
  process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((origin) =>
    origin.trim().replace(/\/$/, "")
  )
  .filter(Boolean);

const productionFrontend =
  "https://oneprime-social-ai-frontend-8fqs.vercel.app";

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Permite requisições sem origem, como:
       * Postman, Railway e chamadas internas.
       */
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin
        .trim()
        .replace(/\/$/, "");

      const isConfiguredOrigin =
        configuredOrigins.includes(
          normalizedOrigin
        );

      const isProductionFrontend =
        normalizedOrigin ===
        productionFrontend;

      const isVercelDeployment =
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(
          normalizedOrigin
        );

      const isLocalDevelopment =
        normalizedOrigin ===
          "http://localhost:5173" ||
        normalizedOrigin ===
          "http://127.0.0.1:5173";

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
          new Error(
            "Origem não permitida pelo CORS."
          )
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

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

app.use(
  "/uploads",
  express.static(path.resolve("uploads"))
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_IMAGE_SIZES = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "auto",
];

function normalizeImageSize(format) {
  if (!format) {
    return "1024x1536";
  }

  if (format === "1024x1792") {
    return "1024x1536";
  }

  if (format === "1792x1024") {
    return "1536x1024";
  }

  if (
    !ALLOWED_IMAGE_SIZES.includes(format)
  ) {
    return "1024x1536";
  }

  return format;
}

/*
 * Health check
 */
app.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    service: "oneprime-backend",
  });
});

/*
 * Rotas principais
 */
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/ai", aiChatRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/publish", publishRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/meta", metaAuthRoutes);

/*
 * Rotas antigas mantidas temporariamente
 * para compatibilidade com o frontend.
 */
app.use("/publish", publishRoutes);
app.use("/media", mediaRoutes);

/*
 * Geração de conteúdo com IA
 */
app.post(
  "/api/ai/generate",
  async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt?.trim()) {
        return res.status(400).json({
          success: false,
          error: "Prompt é obrigatório.",
        });
      }

      const response =
        await openai.chat.completions.create({
          model: "gpt-4.1-mini",

          messages: [
            {
              role: "system",
              content:
                "Você é um especialista em marketing digital para empresas e corretoras de seguros. Gere conteúdos profissionais em português do Brasil.",
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

      const content =
        response?.choices?.[0]?.message
          ?.content;

      if (!content) {
        return res.status(500).json({
          success: false,
          error:
            "A OpenAI não retornou o conteúdo esperado.",
        });
      }

      return res.json({
        success: true,
        content,
      });
    } catch (error) {
      console.error(
        "ERRO CHATGPT:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Erro ao gerar conteúdo.",
      });
    }
  }
);

/*
 * Geração de imagem com IA
 */
app.post(
  "/api/ai/image",
  async (req, res) => {
    try {
      const { prompt, style } = req.body;

      const format = normalizeImageSize(
        req.body.format
      );

      if (!prompt?.trim()) {
        return res.status(400).json({
          success: false,
          error:
            "Prompt da imagem é obrigatório.",
        });
      }

      const imagePrompt =
        await buildPremiumImagePrompt({
          prompt: prompt.trim(),
          style:
            style ||
            "Publicidade premium realista",
          format,
        });

      console.log(
        "FORMATO NORMALIZADO DA IMAGEM:",
        format
      );

      console.log(
        "PROMPT PREMIUM DA IMAGEM:",
        imagePrompt
      );

      const image =
        await openai.images.generate({
          model: "gpt-image-1",
          prompt: imagePrompt,
          size: format,
        });

      const imageBase64 =
        image?.data?.[0]?.b64_json;

      const imageUrlFromApi =
        image?.data?.[0]?.url;

      if (imageBase64) {
        const { saveBase64Image } =
          await import(
            "./services/mediaService.js"
          );

        const savedImage =
          await saveBase64Image(
            imageBase64,
            "oneprime-ai-image.png"
          );

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
        error:
          "A OpenAI respondeu, mas não retornou imagem.",
      });
    } catch (error) {
      console.error(
        "ERRO AO GERAR IMAGEM:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Erro ao gerar imagem.",
      });
    }
  }
);

/*
 * Tratamento de rota inexistente
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "Rota não encontrada.",
    path: req.originalUrl,
  });
});

/*
 * Tratamento geral de erros
 */
app.use((error, req, res, next) => {
  console.error(
    "ERRO NÃO TRATADO NO BACKEND:",
    error
  );

  if (
    error.message ===
    "Origem não permitida pelo CORS."
  ) {
    return res.status(403).json({
      success: false,
      error:
        "Origem não permitida pelo CORS.",
    });
  }

  return res.status(
    error.status || 500
  ).json({
    success: false,
    error:
      error.message ||
      "Erro interno do servidor.",
  });
});

console.log(
  "ONEPRIME BUILD MULTIUSUÁRIOS - ROTAS DE POSTS PROTEGIDAS"
);

export default app;