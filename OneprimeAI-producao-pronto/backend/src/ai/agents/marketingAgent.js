import { getCompanyByText } from "../companies/companies.js";
import { buildMarketingPrompt } from "../prompts/marketingPrompt.js";
import { generateAIContent } from "../tools/openaiTools.js";

function parseAIResponse(text) {
  return {
    legenda: text.match(/Legenda:(.*?)Hashtags:/s)?.[1]?.trim() || "",
    hashtags: text.match(/Hashtags:(.*?)Ideia de imagem:/s)?.[1]?.trim() || "",
    imagem: text.match(/Ideia de imagem:(.*?)Melhor horário:/s)?.[1]?.trim() || "",
    horario: text.match(/Melhor horário:(.*?)CTA:/s)?.[1]?.trim() || "",
    cta: text.match(/CTA:(.*)/s)?.[1]?.trim() || "",
  };
}

export async function executeMarketingAgent(message) {
  const company = getCompanyByText(message);
  const prompt = buildMarketingPrompt(message, company);
  const content = await generateAIContent(prompt);

  return {
    agent: "Marketing Agent",
    company,
    content: parseAIResponse(content || ""),
  };
}