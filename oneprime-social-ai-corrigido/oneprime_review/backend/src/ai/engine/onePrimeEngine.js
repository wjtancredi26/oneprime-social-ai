import { detectIntent } from "../intent/detectIntent.js";
import { executeMarketingAgent } from "../agents/marketingAgent.js";
import { generateImageWorkflow } from "../workflows/generateImageWorkflow.js";
import { scheduleWorkflow } from "../workflows/scheduleWorkflow.js";

export async function runOnePrimeEngine(message, actionPayload = null) {
  if (actionPayload?.action === "generate_image") {
    return await generateImageWorkflow({
      imagePrompt: actionPayload.imagePrompt,
    });
  }

  if (actionPayload?.action === "schedule_post") {
    return await scheduleWorkflow(actionPayload.post);
  }

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
          label: "🎨 Gerar imagem",
          action: "generate_image",
          imagePrompt: marketing.content.imagem,
        },
        {
          label: "📅 Agendar postagem",
          action: "schedule_post",
        },
      ],
    };
  }

  if (intent === "image") {
    return await generateImageWorkflow({
      imagePrompt: message,
    });
  }

  return {
    type: "conversation",
    intent,
    parsed: {
      legenda:
        "Ainda estou aprendendo essa função. Por enquanto, posso criar campanhas, gerar imagens e agendar postagens.",
    },
  };
}