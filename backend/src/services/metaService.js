function isPublicHttpUrl(value) {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertMetaConfig() {
  const pageId = process.env.META_PAGE_ID;
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION || "v25.0";

  if (!pageId || !pageAccessToken) {
    throw new Error("META_PAGE_ID ou META_PAGE_ACCESS_TOKEN não configurado no .env.");
  }

  return { pageId, pageAccessToken, graphVersion };
}

async function postToGraph(endpoint, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  console.log("RESPOSTA META:", JSON.stringify(data, null, 2));

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Erro ao publicar na Meta.");
  }

  return data;
}

async function getFromGraph(endpoint) {
  const response = await fetch(endpoint);
  const data = await response.json();

  console.log("STATUS INSTAGRAM:", JSON.stringify(data, null, 2));

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Erro ao consultar status do Instagram.");
  }

  return data;
}

async function waitInstagramContainerReady({ containerId, accessToken, graphVersion }) {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(3000);

    const statusEndpoint =
      `https://graph.facebook.com/${graphVersion}/${containerId}` +
      `?fields=status_code,status` +
      `&access_token=${accessToken}`;

    const status = await getFromGraph(statusEndpoint);

    if (status.status_code === "FINISHED") {
      return true;
    }

    if (status.status_code === "ERROR") {
      throw new Error(status.status || "Erro ao processar mídia no Instagram.");
    }

    console.log(`Aguardando Instagram processar mídia... tentativa ${attempt}/${maxAttempts}`);
  }

  throw new Error("Instagram demorou para processar a mídia. Tente novamente.");
}

export async function publishFacebookPost({ message, imageUrl }) {
  const { pageId, pageAccessToken, graphVersion } = assertMetaConfig();

  if (!message || message.trim() === "") {
    throw new Error("Mensagem obrigatória para publicar no Facebook.");
  }

  const hasImage = Boolean(imageUrl && imageUrl.trim() !== "");

  if (hasImage && !isPublicHttpUrl(imageUrl)) {
    throw new Error(
      `imageUrl inválida para a Meta: ${imageUrl.substring(0, 80)}. A imagem precisa estar em uma URL pública http/https.`
    );
  }

  const endpoint = hasImage
    ? `https://graph.facebook.com/${graphVersion}/${pageId}/photos`
    : `https://graph.facebook.com/${graphVersion}/${pageId}/feed`;

  const body = hasImage
    ? { url: imageUrl, caption: message, access_token: pageAccessToken }
    : { message, access_token: pageAccessToken };

  console.log("PUBLICANDO NO FACEBOOK:", { endpoint, hasImage, imageUrl });

  return postToGraph(endpoint, body);
}

export async function publishInstagramPost({ caption, imageUrl }) {
  const igUserId = process.env.META_IG_USER_ID;
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION || "v25.0";

  if (!igUserId || !pageAccessToken) {
    throw new Error("META_IG_USER_ID ou META_PAGE_ACCESS_TOKEN não configurado no .env.");
  }

  if (!caption || caption.trim() === "") {
    throw new Error("Legenda obrigatória para publicar no Instagram.");
  }

  if (!isPublicHttpUrl(imageUrl)) {
    throw new Error("Para publicar no Instagram, imageUrl precisa ser uma URL pública http/https.");
  }

  const createContainerEndpoint = `https://graph.facebook.com/${graphVersion}/${igUserId}/media`;

  const container = await postToGraph(createContainerEndpoint, {
    image_url: imageUrl,
    caption,
    access_token: pageAccessToken,
  });

  if (!container.id) {
    throw new Error("A Meta não retornou o container do Instagram.");
  }

  await waitInstagramContainerReady({
    containerId: container.id,
    accessToken: pageAccessToken,
    graphVersion,
  });

  const publishEndpoint = `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`;

  return postToGraph(publishEndpoint, {
    creation_id: container.id,
    access_token: pageAccessToken,
  });
}