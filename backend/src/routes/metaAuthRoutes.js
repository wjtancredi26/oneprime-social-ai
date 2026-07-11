import express from "express";
import {
  saveMetaConnection,
  getMetaConnection,
  clearMetaConnection,
} from "../services/metaConnectionStore.js";

const router = express.Router();

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";

router.get("/status", (req, res) => {
  const connection = getMetaConnection();

  res.json({
    success: true,
    connected: Boolean(connection),
    connection,
  });
});

router.get("/connect", (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return res.status(500).json({
      success: false,
      error: "META_APP_ID ou META_REDIRECT_URI não configurado.",
    });
  }

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const url =
    `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code`;

  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!code) {
      return res.redirect(`${frontendUrl}?meta=error`);
    }

    const tokenUrl =
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token` +
      `?client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.log("ERRO TOKEN META:", tokenData);
      return res.redirect(`${frontendUrl}?meta=token_error`);
    }

    const pagesResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?access_token=${tokenData.access_token}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      console.log("NENHUMA PÁGINA META:", pagesData);
      return res.redirect(`${frontendUrl}?meta=no_pages`);
    }

    const page =
      pagesData.data.find((p) =>
        p.name.toLowerCase().includes("oneprime")
      ) || pagesData.data[0];

    const igResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igData = await igResponse.json();

    const connection = saveMetaConnection({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      igUserId: igData.instagram_business_account?.id || null,
      connectedAt: new Date().toISOString(),
    });

    console.log("META CONECTADA:", connection);

    return res.redirect(`${frontendUrl}?meta=connected`);
  } catch (error) {
    console.error("ERRO CALLBACK META:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}?meta=error`);
  }
});

router.delete("/disconnect", (req, res) => {
  clearMetaConnection();

  res.json({
    success: true,
    message: "Meta desconectada.",
  });
});

export default router;