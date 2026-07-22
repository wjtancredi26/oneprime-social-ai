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
import {
  consumeMetaOAuthSession,
  createMetaOAuthSession,
  getMetaOAuthSession,
} from "../services/metaOAuthService.js";

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
    { purpose: "META_OAUTH", userId, companyId },
    env.jwtSecret,
    { expiresIn: "15m" }
  );
}

function verifyOAuthState(state) {
  const decoded = jwt.verify(state, env.jwtSecret);
  if (decoded.purpose !== "META_OAUTH" || !decoded.companyId || !decoded.userId) {
    throw new Error("Estado OAuth inválido.");
  }
  return decoded;
}

async function graphGet(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Falha na Meta (${response.status}).`);
  }
  return data;
}

async function fetchAllManagedPages(userAccessToken) {
  const fields = "id,name,access_token,tasks,instagram_business_account{id,username}";
  let nextUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`);
  nextUrl.searchParams.set("fields", fields);
  nextUrl.searchParams.set("limit", "100");
  nextUrl.searchParams.set("access_token", userAccessToken);

  const pages = [];
  let safety = 0;

  while (nextUrl && safety < 10) {
    safety += 1;
    const response = await fetch(nextUrl, { signal: AbortSignal.timeout(30000) });
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "Não foi possível buscar as Páginas da Meta.");
    }

    if (Array.isArray(data.data)) pages.push(...data.data);
    nextUrl = data.paging?.next ? new URL(data.paging.next) : null;
  }

  return pages;
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

    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scopes);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("auth_type", "rerequest");
    url.searchParams.set("return_scopes", "true");

    return res.json({ success: true, url: url.toString(), companyId });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/connect", (_req, res) => {
  return res.status(400).json({
    success: false,
    error: "Use o botão Conectar Meta dentro do sistema autenticado.",
  });
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state, error: oauthError, error_description: errorDescription } = req.query;

    if (oauthError) {
      return res.redirect(buildFrontendRedirect("/", {
        meta: "error",
        message: errorDescription || oauthError,
      }));
    }
    if (!code || !state) {
      return res.redirect(buildFrontendRedirect("/", { meta: "invalid_callback" }));
    }

    const { companyId, userId } = verifyOAuthState(state);
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;
    if (!appId || !appSecret || !redirectUri) {
      throw new Error("Configuração OAuth da Meta incompleta no servidor.");
    }

    const tokenData = await graphGet("oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    let userAccessToken = tokenData.access_token;
    let tokenExpiresInSeconds = Number(tokenData.expires_in || 0);

    try {
      const longLivedData = await graphGet("oauth/access_token", {
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: userAccessToken,
      });
      if (longLivedData.access_token) {
        userAccessToken = longLivedData.access_token;
        tokenExpiresInSeconds = Number(longLivedData.expires_in || tokenExpiresInSeconds);
      }
    } catch (exchangeError) {
      console.warn("Token Meta permaneceu de curta duração:", exchangeError.message);
    }

    const permissionsData = await graphGet("me/permissions", {
      access_token: userAccessToken,
    });
    const grantedPermissions = new Set(
      (permissionsData.data || [])
        .filter((item) => item.status === "granted")
        .map((item) => item.permission)
    );

    const requiredPermissions = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ];
    const missingPermissions = requiredPermissions.filter(
      (permission) => !grantedPermissions.has(permission)
    );
    if (missingPermissions.includes("pages_show_list")) {
      throw new Error(
        "A permissão pages_show_list não foi autorizada. Remova o aplicativo nas Integrações Comerciais do Facebook e conecte novamente aceitando todas as Páginas."
      );
    }

    const pages = await fetchAllManagedPages(userAccessToken);
    if (pages.length === 0) {
      throw new Error(
        "Nenhuma Página foi retornada pela Meta. Confirme que seu perfil possui acesso total à Página e que, em modo de desenvolvimento, seu perfil está cadastrado como administrador ou testador do aplicativo."
      );
    }

    const tokenExpiresAt = tokenExpiresInSeconds
      ? new Date(Date.now() + tokenExpiresInSeconds * 1000).toISOString()
      : null;

    const selectionToken = await createMetaOAuthSession({
      userId,
      companyId,
      payload: {
        userAccessToken,
        tokenExpiresAt,
        missingPermissions,
        pages,
      },
    });

    return res.redirect(buildFrontendRedirect("/", {
      meta: "select_page",
      metaSession: selectionToken,
      companyId,
    }));
  } catch (error) {
    console.error("ERRO CALLBACK META:", error);
    return res.redirect(buildFrontendRedirect("/", {
      meta: "error",
      message: error.message,
    }));
  }
});

router.get("/pending-pages", authenticate, async (req, res) => {
  try {
    const session = await getMetaOAuthSession({
      rawToken: req.query.session,
      userId: req.user.id,
    });

    return res.json({
      success: true,
      companyId: session.companyId,
      missingPermissions: session.payload.missingPermissions || [],
      pages: (session.payload.pages || []).map((page) => ({
        id: page.id,
        name: page.name,
        tasks: page.tasks || [],
        instagramUserId: page.instagram_business_account?.id || null,
        instagramUsername: page.instagram_business_account?.username || null,
      })),
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/select-page", authenticate, async (req, res) => {
  try {
    const { session: rawToken, pageId } = req.body;
    const session = await consumeMetaOAuthSession({
      rawToken,
      userId: req.user.id,
    });
    const page = (session.payload.pages || []).find(
      (item) => String(item.id) === String(pageId)
    );
    if (!page) throw new Error("A Página escolhida não pertence a esta autorização.");

    const tasks = Array.isArray(page.tasks) ? page.tasks : [];
    const canPublish = tasks.length === 0 ||
      tasks.includes("CREATE_CONTENT") ||
      tasks.includes("MANAGE");
    if (!canPublish) {
      throw new Error(
        "Seu perfil não possui a tarefa CREATE_CONTENT nesta Página. Conceda acesso total ou permissão para criar conteúdo no Meta Business Suite."
      );
    }

    const connection = await saveMetaConnection({
      companyId: session.companyId,
      facebookPageId: page.id,
      facebookPageName: page.name,
      instagramUserId: page.instagram_business_account?.id || null,
      instagramUsername: page.instagram_business_account?.username || null,
      pageAccessToken: page.access_token,
      userAccessToken: session.payload.userAccessToken,
      tokenExpiresAt: session.payload.tokenExpiresAt
        ? new Date(session.payload.tokenExpiresAt)
        : null,
    });

    return res.json({
      success: true,
      message: page.instagram_business_account
        ? "Facebook e Instagram conectados com sucesso."
        : "Facebook conectado. Esta Página não possui uma conta profissional do Instagram vinculada.",
      connection: await getMetaConnection(connection.companyId),
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
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
