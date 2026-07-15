import { aiGenerateImage } from "../tools";

export async function executeImageAgent({
  imagePrompt,
  format = "1024x1024",
  style = "Publicidade premium",
}) {
  if (!imagePrompt) {
    return {
      agent: "Image Agent",
      success: false,
      imageUrl: null,
      message: "Nenhuma ideia de imagem foi enviada.",
    };
  }

  const response = await aiGenerateImage(imagePrompt, format, style);

  return {
    agent: "Image Agent",
    success: Boolean(response.imageUrl),
    imageUrl: response.imageUrl || null,
    message: response.error || "Imagem gerada com sucesso.",
  };
}