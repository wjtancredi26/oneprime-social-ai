import express from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../middlewares/auth.js";
import { env } from "../config/env.js";
import {
  disconnectMeta,
  getMetaConnection,
  resolveCompanyId,
  saveMetaConnection,
} from "../services/socialConnectionService.js";

const router = express.Router();
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";

function buildFrontendRedirect(path = "/", params = {}) {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
  const url = new URL(path, `${frontendUrl}/`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function createOAuthState({ userId, companyId }) {
  return jwt.sign(
    {
      purpose: "META_OAUTH",
      userId,
      companyId,
    },
    env.jwtSecret,
    { expiresIn: "15m" }
  );
}

function verifyOAuthState(state) {
  const decoded = jwt.verify(state, env.jwtSecret);

  if (decoded.purpose !== "META_OAUTH" || !decoded.companyId) {
    throw new Error("Estado OAuth inválido.");
  }

  return decoded;
}

router.get("/status", authenticate, async (req, res) => {
  try {
    const companyId = await resolveCompanyId({
      user: req.user,
      requestedCompanyId: req.query.companyId,
    });
    const connection = await getMetaConnection(companyId);

    return res.json({
      success: true,
      connected: Boolean(connection && connection.status === "CONNECTED"),
      connection,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/connect-url", authenticate, async (req, res) => {
  try {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;

    if (!appId || !redirectUri) {
      return res.status(500).json({
        success: false,
        error: "META_APP_ID ou META_REDIRECT_URI não configurado.",
      });
    }

    const companyId = await resolveCompanyId({
      user: req.user,
      requestedCompanyId: req.body.companyId,
    });
    const state = createOAuthState({ userId: req.user.id, companyId });
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ].join(",");

    const url =
      `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;

    return res.json({ success: true, url, companyId });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Mantido para compatibilidade. O frontend novo usa POST /connect-url.
router.get("/connect", (req, res) => {
  return res.status(400).json({
    success: false,
    error: "Use o botão Conectar Meta dentro do sistema autenticado.",
  });
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state, error: oauthError, error_description: errorDescription } = req.query;

    if (oauthError) {
      return res.redirect(
        buildFrontendRedirect("/", {
          meta: "error",
          message: errorDescription || oauthError,
        })
      );
    }

    if (!code || !state) {
      return res.redirect(buildFrontendRedirect("/", { meta: "invalid_callback" }));
    }

    const { companyId } = verifyOAuthState(state);
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      throw new Error("Configuração OAuth da Meta incompleta no servidor.");
    }

    const tokenUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
    );
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || "Não foi possível obter o token da Meta.");
    }

    const userAccessToken = tokenData.access_token;
    const pagesUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`
    );
    pagesUrl.searchParams.set(
      "fields",
      "id,name,access_token,instagram_business_account{id,username}"
    );
    pagesUrl.searchParams.set("access_token", userAccessToken);

    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || !Array.isArray(pagesData.data) || pagesData.data.length === 0) {
      throw new Error(
        pagesData.error?.message ||
          "Nenhuma Página do Facebook administrada por esta conta foi encontrada."
      );
    }

    // Primeira versão: conecta a primeira página autorizada pela conta.
    // A seleção visual de página será adicionada no próximo passo.
    const page = pagesData.data[0];
    const expiresInSeconds = Number(tokenData.expires_in || 0);
    const tokenExpiresAt = expiresInSeconds
      ? new Date(Date.now() + expiresInSeconds * 1000)
      : null;

    await saveMetaConnection({
      companyId,
      facebookPageId: page.id,
      facebookPageName: page.name,
      instagramUserId: page.instagram_business_account?.id || null,
      instagramUsername: page.instagram_business_account?.username || null,
      pageAccessToken: page.access_token,
      userAccessToken,
      tokenExpiresAt,
    });

    return res.redirect(
      buildFrontendRedirect("/", {
        meta: "connected",
        companyId,
      })
    );
  } catch (error) {
    console.error("ERRO CALLBACK META:", error);
    return res.redirect(
      buildFrontendRedirect("/", {
        meta: "error",
        message: error.message,
      })
    );
  }
});

router.delete("/disconnect", authenticate, async (req, res) => {
  try {
    const companyId = await resolveCompanyId({
      user: req.user,
      requestedCompanyId: req.body.companyId || req.query.companyId,
    });

    await disconnectMeta(companyId);

    return res.json({
      success: true,
      message: "Facebook e Instagram desconectados desta empresa.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
