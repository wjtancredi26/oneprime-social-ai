import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getFallbackPrompt({ prompt, style, format }) {
  return `
Crie uma arte publicitária hiper-realista e premium.

Tema:
${prompt}

Estilo:
${style}

Formato:
${format}

Direção criativa:
- campanha realista de alto impacto
- fotografia profissional
- composição de agência publicitária
- iluminação cinematográfica
- pessoa brasileira realista
- veículo ou produto realista quando fizer sentido
- fundo coerente com o segmento
- cores premium
- hierarquia visual forte
- espaço para logo no canto superior esquerdo
- CTA visual bem destacado
- visual moderno e vendedor

Qualidade:
- hyper realistic
- ultra detailed
- commercial advertising
- premium flyer
- 8K
- HDR
- professional photography
- magazine quality

Evitar:
- aparência artificial
- cartoon
- ilustração
- texto deformado
- mãos deformadas
- rosto estranho
`;
}

export async function buildPremiumImagePrompt({
  prompt,
  style = "Publicidade premium realista",
  format = "1024x1536",
}) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `
Você é um Diretor Criativo de uma agência de publicidade premium.

Sua missão é transformar pedidos simples em prompts visuais ultra realistas para geração de imagem publicitária.

Regras obrigatórias:
- Não crie prompt genérico.
- Não repita sempre a mesma cena.
- Adapte cenário, pessoa, produto, iluminação e composição ao tema.
- O resultado deve parecer campanha profissional de agência.
- Priorize realismo, fotografia comercial e estética premium.
- Use linguagem visual rica: câmera, lente, iluminação, composição, emoção, cenário, cores, CTA e layout.
- Não peça para desenhar logotipo.
- Não desenhe logotipos.
- Não desenhe marcas.
- Não escreva a palavra "LOGO".
- Não reserve espaço para logotipo.
- A imagem deve parecer uma fotografia publicitária pronta.
- Não use marcas famosas reais.
- Não gere explicações.
- Responda somente com o prompt final da imagem.
`,
        },
        {
          role: "user",
          content: `
Pedido do usuário:
${prompt}

Estilo escolhido:
${style}

Formato:
${format}

Crie um prompt final para uma imagem publicitária ultra realista.

O prompt deve conter:
1. tipo de cena;
2. personagem ou produto principal;
3. ambiente;
4. iluminação;
5. paleta de cores;
6. composição;
7. estilo fotográfico;
8. elementos de anúncio;
9. CTA visual;
10. instruções negativas para evitar imagem artificial.
`,
        },
      ],
    });

    const finalPrompt = response.choices?.[0]?.message?.content?.trim();

    if (!finalPrompt) {
      return getFallbackPrompt({ prompt, style, format });
    }

    return finalPrompt;
  } catch (error) {
    console.error("ERRO CREATIVE PROMPT:", error);
    return getFallbackPrompt({ prompt, style, format });
  }
}