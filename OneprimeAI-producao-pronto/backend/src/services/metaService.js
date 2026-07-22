import {
  getMetaConnection,
  setMetaConnectionError,
} from "./socialConnectionService.js";

function isPublicHttpsUrl(value) {
  if (!value || typeof value !== "string") return false;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertMetaConfig(companyId) {
  if (!companyId) {
    throw new Error("Empresa não informada para publicar na Meta.");
  }

  const connection = await getMetaConnection(companyId, { includeSecrets: true });

  if (!connection || connection.status !== "CONNECTED") {
    throw new Error(
      "Facebook e Instagram não estão conectados para esta empresa. Acesse Redes Sociais e conecte a Meta."
    );
  }

  if (!connection.facebookPageId || !connection.pageAccessToken) {
    throw new Error("A conexão Meta desta empresa está incompleta.");
  }

  if (
    connection.tokenExpiresAt &&
    new Date(connection.tokenExpiresAt).getTime() <= Date.now()
  ) {
    throw new Error("A conexão Meta expirou. Reconecte o Facebook e o Instagram.");
  }

  return {
    pageId: connection.facebookPageId,
    pageAccessToken: connection.pageAccessToken,
    igUserId: connection.instagramUserId,
    graphVersion: process.env.META_GRAPH_VERSION || "v25.0",
  };
}

async function graphRequest(endpoint, { method = "GET", body } = {}) {
  const options = { method };

  if (body) {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        form.set(key, String(value));
      }
    }

    options.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    options.body = form.toString();
  }

  let response;

  try {
    response = await fetch(endpoint, {
      ...options,
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    const networkError = new Error(
      error?.name === "TimeoutError"
        ? "Timeout ao comunicar com a API da Meta."
        : `Falha de rede ao comunicar com a Meta: ${error.message}`
    );
    networkError.retryable = true;
    throw networkError;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    const error = new Error(data.error?.message || "Erro na API da Meta.");
    error.httpStatus = response.status;
    error.metaCode = data.error?.code;
    error.metaSubcode = data.error?.error_subcode;
    error.retryable = response.status === 429 || response.status >= 500;
    throw error;
  }

  return data;
}

async function waitInstagramContainerReady({
  containerId,
  accessToken,
  graphVersion,
}) {
  const maxAttempts = 15;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(3000);

    const statusUrl = new URL(
      `https://graph.facebook.com/${graphVersion}/${containerId}`
    );
    statusUrl.searchParams.set("fields", "status_code,status");
    statusUrl.searchParams.set("access_token", accessToken);

    const status = await graphRequest(statusUrl);

    if (status.status_code === "FINISHED") return;

    if (["ERROR", "EXPIRED"].includes(status.status_code)) {
      throw new Error(status.status || "Erro ao processar mídia no Instagram.");
    }

    console.log(
      `Aguardando o Instagram processar a mídia: ${attempt}/${maxAttempts}`
    );
  }

  const error = new Error(
    "O Instagram demorou para processar a imagem. Nova tentativa poderá ser feita automaticamente."
  );
  error.retryable = true;
  throw error;
}

export async function publishFacebookPost({ companyId, message, imageUrl }) {
  try {
    const { pageId, pageAccessToken, graphVersion } =
      await assertMetaConfig(companyId);

    if (!message?.trim()) {
      throw new Error("Mensagem obrigatória para publicar no Facebook.");
    }

    const hasImage = Boolean(imageUrl?.trim());

    if (hasImage && !isPublicHttpsUrl(imageUrl)) {
      throw new Error("A imagem precisa estar em uma URL pública HTTPS.");
    }

    const endpoint = hasImage
      ? `https://graph.facebook.com/${graphVersion}/${pageId}/photos`
      : `https://graph.facebook.com/${graphVersion}/${pageId}/feed`;

    return await graphRequest(endpoint, {
      method: "POST",
      body: hasImage
        ? { url: imageUrl.trim(), caption: message.trim(), access_token: pageAccessToken }
        : { message: message.trim(), access_token: pageAccessToken },
    });
  } catch (error) {
    if (companyId) {
      await setMetaConnectionError(companyId, error.message, {
        reconnectRequired: error.metaCode === 190,
      }).catch(() => {});
    }
    throw error;
  }
}

export async function publishInstagramPost({ companyId, caption, imageUrl }) {
  try {
    const { igUserId, pageAccessToken, graphVersion } =
      await assertMetaConfig(companyId);

    if (!igUserId) {
      throw new Error(
        "Nenhuma conta profissional do Instagram está conectada à Página desta empresa."
      );
    }

    if (!caption?.trim()) {
      throw new Error("Legenda obrigatória para publicar no Instagram.");
    }

    if (!isPublicHttpsUrl(imageUrl)) {
      throw new Error("O Instagram exige uma imagem em URL pública HTTPS.");
    }

    const container = await graphRequest(
      `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
      {
        method: "POST",
        body: {
          image_url: imageUrl.trim(),
          caption: caption.trim(),
          access_token: pageAccessToken,
        },
      }
    );

    if (!container.id) {
      throw new Error("A Meta não retornou o container do Instagram.");
    }

    await waitInstagramContainerReady({
      containerId: container.id,
      accessToken: pageAccessToken,
      graphVersion,
    });

    return await graphRequest(
      `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
      {
        method: "POST",
        body: {
          creation_id: container.id,
          access_token: pageAccessToken,
        },
      }
    );
  } catch (error) {
    if (companyId) {
      await setMetaConnectionError(companyId, error.message, {
        reconnectRequired: error.metaCode === 190,
      }).catch(() => {});
    }
    throw error;
  }
}
