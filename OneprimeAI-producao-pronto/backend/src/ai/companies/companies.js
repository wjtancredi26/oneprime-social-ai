export const companies = {
  oneprimeseg: {
    name: "OnePrimeSeg",
    segment: "Corretora de Seguros",
    tone: "profissional, confiável, humano e comercial",
    products: [
      "Seguro Auto",
      "Proteção Veicular",
      "Seguro Residencial",
      "Seguro Empresarial",
      "Seguro de Vida",
      "Consórcio",
      "Convênio Médico",
    ],
    brands: [
      "Porto Seguro",
      "Azul Seguros",
      "Tokio Marine",
      "HDI",
      "Mitsui",
      "Youse",
      "Universo AGV",
      "Loovi",
    ],
    ctas: [
      "Faça sua cotação agora",
      "Me chame no WhatsApp",
      "Proteja seu carro hoje",
      "Não deixe para depois",
    ],
  },

  hgstore: {
    name: "HG Store",
    segment: "Ternos e trajes sociais",
    tone: "elegante, sofisticado e comercial",
    products: [
      "Ternos",
      "Blazers",
      "Camisas sociais",
      "Trajes para casamento",
      "Trajes para formatura",
    ],
    brands: [],
    ctas: [
      "Conheça nossos modelos",
      "Garanta seu terno hoje",
      "Vista-se com elegância",
    ],
  },

  onetv: {
    name: "OneTV",
    segment: "IPTV e entretenimento",
    tone: "animado, direto e popular",
    products: [
      "IPTV",
      "Filmes",
      "Séries",
      "Futebol ao vivo",
      "Canais infantis",
    ],
    brands: [],
    ctas: [
      "Peça seu teste grátis",
      "Assista agora",
      "Chame no WhatsApp",
    ],
  },

  igreen: {
    name: "iGreen Energy",
    segment: "Economia de energia",
    tone: "educativo, confiável e econômico",
    products: [
      "Energia por assinatura",
      "Economia na conta de luz",
      "iGreen Club",
    ],
    brands: [],
    ctas: [
      "Economize na sua conta de luz",
      "Simule sua economia",
      "Comece sem custo de implantação",
    ],
  },
};

export function getCompanyByText(text) {
  const lower = text.toLowerCase();

  if (lower.includes("terno") || lower.includes("traje") || lower.includes("hg")) {
    return companies.hgstore;
  }

  if (
    lower.includes("iptv") ||
    lower.includes("futebol") ||
    lower.includes("filme") ||
    lower.includes("série") ||
    lower.includes("onetv")
  ) {
    return companies.onetv;
  }

  if (
    lower.includes("energia") ||
    lower.includes("conta de luz") ||
    lower.includes("igreen")
  ) {
    return companies.igreen;
  }

  return companies.oneprimeseg;
}