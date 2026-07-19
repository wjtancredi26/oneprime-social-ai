import prisma from "../prisma/client.js";

export function parsePostId(value) {
  const postId = Number(value);

  if (!Number.isInteger(postId) || postId <= 0) {
    throw new Error("Post inválido.");
  }

  return postId;
}

export function parseCompanyId(value) {
  const companyId = Number(value);

  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("Empresa inválida.");
  }

  return companyId;
}

export function getPostAccessFilter(user) {
  if (user.role === "ADMIN") {
    return {};
  }

  if (!user.companyId) {
    return {
      id: -1,
    };
  }

  return {
    companyId: Number(user.companyId),
  };
}

export function canAccessCompany(user, companyId) {
  if (user.role === "ADMIN") {
    return true;
  }

  return Number(user.companyId) === Number(companyId);
}

export async function resolveCompanyId(user, requestedCompanyId) {
  let companyId;

  if (user.role === "ADMIN") {
    if (!requestedCompanyId) {
      throw new Error(
        "Selecione a empresa responsável pelo post."
      );
    }

    companyId = parseCompanyId(requestedCompanyId);
  } else {
    if (!user.companyId) {
      throw new Error(
        "Seu usuário não está vinculado a uma empresa."
      );
    }

    companyId = Number(user.companyId);
  }

  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!company) {
    throw new Error("Empresa não encontrada.");
  }

  return company.id;
}

export async function findAccessiblePost(user, postIdValue) {
  const postId = parsePostId(postIdValue);

  const post = await prisma.scheduledPost.findFirst({
    where: {
      id: postId,
      ...getPostAccessFilter(user),
    },
    include: {
      company: true,
    },
  });

  return post;
}

export function validateScheduledDate(value) {
  if (!value) {
    throw new Error(
      "A data de agendamento é obrigatória."
    );
  }

  const scheduledAt = new Date(value);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error(
      "A data de agendamento é inválida."
    );
  }

  return scheduledAt;
}

export function buildPostCreateData({
  body,
  user,
  companyId,
}) {
  const {
    prompt,
    caption,
    hashtags,
    imageIdea,
    cta,
    imageUrl,
    network,
    scheduledAt,
  } = body;

  if (
    !String(prompt || "").trim() ||
    !String(caption || "").trim() ||
    !String(network || "").trim()
  ) {
    throw new Error(
      "Prompt, legenda e rede social são obrigatórios."
    );
  }

  return {
    prompt: String(prompt).trim(),
    caption: String(caption).trim(),
    hashtags: String(hashtags || "").trim(),
    imageIdea: String(imageIdea || "").trim(),
    cta: String(cta || "").trim(),
    imageUrl: imageUrl
      ? String(imageUrl).trim()
      : null,
    network: String(network).trim(),
    scheduledAt: validateScheduledDate(
      scheduledAt
    ),
    status: "AGENDADO",
    userId: user.id,
    companyId,
  };
}

export function buildPostUpdateData(body) {
  const data = {};

  if (body.prompt !== undefined) {
    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      throw new Error(
        "O prompt não pode ficar vazio."
      );
    }

    data.prompt = prompt;
  }

  if (body.caption !== undefined) {
    const caption = String(
      body.caption || ""
    ).trim();

    if (!caption) {
      throw new Error(
        "A legenda não pode ficar vazia."
      );
    }

    data.caption = caption;
  }

  if (body.hashtags !== undefined) {
    data.hashtags = String(
      body.hashtags || ""
    ).trim();
  }

  if (body.imageIdea !== undefined) {
    data.imageIdea = String(
      body.imageIdea || ""
    ).trim();
  }

  if (body.cta !== undefined) {
    data.cta = String(body.cta || "").trim();
  }

  if (body.imageUrl !== undefined) {
    data.imageUrl = body.imageUrl
      ? String(body.imageUrl).trim()
      : null;
  }

  if (body.network !== undefined) {
    const network = String(
      body.network || ""
    ).trim();

    if (!network) {
      throw new Error(
        "A rede social não pode ficar vazia."
      );
    }

    data.network = network;
  }

  if (body.scheduledAt !== undefined) {
    data.scheduledAt = validateScheduledDate(
      body.scheduledAt
    );
  }

  if (body.status !== undefined) {
    const allowedStatuses = [
      "RASCUNHO",
      "AGENDADO",
      "PUBLICANDO",
      "PUBLICADO",
      "ERRO",
      "CANCELADO",
    ];

    const status = String(
      body.status || ""
    )
      .trim()
      .toUpperCase();

    if (!allowedStatuses.includes(status)) {
      throw new Error(
        "Status do post inválido."
      );
    }

    data.status = status;
  }

  return data;
}