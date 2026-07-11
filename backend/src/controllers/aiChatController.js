import { runOnePrimeEngine } from "../ai/engine/onePrimeEngine.js";

export async function runAIChat(req, res) {
  try {
    const { message, actionPayload } = req.body;

    if (!message && !actionPayload) {
      return res.status(400).json({
        success: false,
        error: "Mensagem ou ação obrigatória.",
      });
    }

    const response = await runOnePrimeEngine(message || "", actionPayload);

    return res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Erro no AI Chat:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao processar mensagem da IA.",
    });
  }
}