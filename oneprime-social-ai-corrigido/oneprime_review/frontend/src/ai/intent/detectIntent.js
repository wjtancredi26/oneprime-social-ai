export function detectIntent(message) {
  const text = message.toLowerCase();

  if (
    text.includes("campanha") ||
    text.includes("post") ||
    text.includes("seguro") ||
    text.includes("story") ||
    text.includes("feed") ||
    text.includes("reels") ||
    text.includes("carrossel")
  ) {
    return "marketing";
  }

  if (
    text.includes("imagem") ||
    text.includes("foto") ||
    text.includes("banner") ||
    text.includes("arte")
  ) {
    return "image";
  }

  if (
    text.includes("agenda") ||
    text.includes("agendar") ||
    text.includes("amanhã") ||
    text.includes("sexta") ||
    text.includes("segunda") ||
    text.includes("publicar")
  ) {
    return "schedule";
  }

  if (
    text.includes("instagram") ||
    text.includes("facebook") ||
    text.includes("threads")
  ) {
    return "social";
  }

  if (
    text.includes("relatório") ||
    text.includes("analytics") ||
    text.includes("métricas")
  ) {
    return "analytics";
  }

  return "conversation";
}