import api from "./api";

export async function generateContent(prompt) {
  const { data } = await api.post("/ai/generate", {
    prompt,
  });

  return data;
}

export async function generateImage(prompt, format, style) {
  const { data } = await api.post("/ai/image", {
    prompt,
    format,
    style,
  });

  return data;
}

export async function askAIChat(message, actionPayload = null) {
  const { data } = await api.post("/ai/chat", {
    message,
    actionPayload,
  });

  return data.response;
}