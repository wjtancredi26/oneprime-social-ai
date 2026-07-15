import { getCompanyByText } from "../companies";
import { buildMarketingPrompt } from "../prompts";
import { aiGenerateContent } from "../tools";
import parseAIResponse from "../../utils/parseAIResponse";

export async function executeMarketingAgent(userMessage) {
  const company = getCompanyByText(userMessage);

  const prompt = buildMarketingPrompt(userMessage, company);

  const response = await aiGenerateContent(prompt);

  return {
    agent: "Marketing Agent",
    company,
    content: parseAIResponse(response.content || ""),
  };
}