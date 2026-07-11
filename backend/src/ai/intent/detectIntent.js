export function detectIntent(message) {
  const text = message.toLowerCase();

  if (
    text.includes("imagem") ||
    text.includes("foto") ||
    text.includes("banner") ||
    text.includes("arte")
  ) {
    return "image";
  }

  if (
    text.includes("campanha") ||
    text.includes("post") ||
    text.includes("seguro") ||
    text.includes("story") ||
    text.includes("feed") ||
    text.includes("reels") ||
    text.includes("carrossel") ||
    text.includes("agv") ||
    text.includes("porto") ||
    text.includes("terno") ||
    text.includes("iptv")
  ) {
    return "marketing";
  }

  if (
    text.includes("agenda") ||
    text.includes("agendar") ||
    text.includes("amanhã") ||
    text.includes("publicar")
  ) {
    return "schedule";
  }

  return "conversation";
}