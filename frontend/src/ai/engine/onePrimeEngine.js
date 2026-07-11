import { detectIntent } from "../intent/detectIntent";
import { executeMarketingAgent } from "../agents/marketingAgent";
import { executeImageAgent } from "../agents/imageAgent";

export async function runOnePrimeEngine(message) {
  const intent = detectIntent(message);

  if (intent === "marketing") {
    const marketing = await executeMarketingAgent(message);

    return {
      type: "marketing",
      intent,
      company: marketing.company,
      parsed: marketing.content,
      nextActions: [
        {
          label: "Gerar imagem",
          action: "generate_image",
        },
        {
          label: "Agendar postagem",
          action: "schedule_post",
        },
      ],
    };
  }

  if (intent === "image") {
    const image = await executeImageAgent({
      imagePrompt: message,
      format: "1024x1024",
      style: "Publicidade premium",
    });

    return {
      type: "image",
      intent,
      image,
    };
  }

  return {
    type: "conversation",
    intent,
    parsed: {
      legenda:
        "Ainda estou aprendendo essa função. Em breve conseguirei executar esse pedido.",
    },
  };
}