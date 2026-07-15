import { askAIChat } from "../services/aiService";

export async function askOnePrimeAI(message, actionPayload = null) {
  return await askAIChat(message, actionPayload);
}