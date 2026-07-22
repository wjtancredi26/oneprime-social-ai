import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIContent(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é a OnePrime AI, especialista em marketing digital para pequenas empresas brasileiras.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content;
}

export async function generateAIImage({ prompt, style = "Publicidade premium" }) {
  const imagePrompt = `
Crie uma propaganda extremamente profissional.

Tema:
${prompt}

Estilo:
${style}

Imagem ultra realista.
Alta qualidade.
Publicidade premium.
Sem logotipos de marcas famosas.
Sem textos pequenos.
Foco em marketing digital para pequenas empresas brasileiras.
`;

  const image = await openai.images.generate({
    model: "gpt-image-1",
    prompt: imagePrompt,
    size: "1024x1024",
  });

  const imageBase64 = image?.data?.[0]?.b64_json;
  const imageUrlFromApi = image?.data?.[0]?.url;

  if (imageBase64) {
    return `data:image/png;base64,${imageBase64}`;
  }

  if (imageUrlFromApi) {
    return imageUrlFromApi;
  }

  return null;
}