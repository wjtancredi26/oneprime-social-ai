import { generateAIImage } from "../tools/openaiTools.js";

export async function executeImageAgent({
  imagePrompt,
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

  const imageUrl = await generateAIImage({
    prompt: imagePrompt,
    style,
  });

  return {
    agent: "Image Agent",
    success: Boolean(imageUrl),
    imageUrl,
    message: imageUrl ? "Imagem gerada com sucesso." : "Não foi possível gerar a imagem.",
  };
}