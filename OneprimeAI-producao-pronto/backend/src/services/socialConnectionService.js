import prisma from "../prisma/client.js";
import { decryptToken, encryptToken } from "./tokenCryptoService.js";

export async function resolveCompanyId({ user, requestedCompanyId }) {
  const explicitId = requestedCompanyId ? Number(requestedCompanyId) : null;

  if (explicitId && Number.isInteger(explicitId)) {
    if (user?.role !== "ADMIN" && user?.companyId !== explicitId) {
      throw new Error("Você não tem acesso a esta empresa.");
    }

    const company = await prisma.company.findUnique({ where: { id: explicitId } });
    if (!company) throw new Error("Empresa não encontrada.");
    return explicitId;
  }

  if (user?.companyId) return user.companyId;

  if (user?.role === "ADMIN") {
    throw new Error("Selecione uma empresa antes de conectar a Meta.");
  }

  throw new Error("Seu usuário não está vinculado a uma empresa.");
}

export async function getMetaConnection(companyId, { includeSecrets = false } = {}) {
  const connection = await prisma.socialConnection.findUnique({
    where: {
      companyId_provider: {
        companyId: Number(companyId),
        provider: "META",
      },
    },
  });

  if (!connection) return null;

  const safeConnection = {
    id: connection.id,
    companyId: connection.companyId,
    provider: connection.provider,
    facebookPageId: connection.facebookPageId,
    facebookPageName: connection.facebookPageName,
    instagramUserId: connection.instagramUserId,
    instagramUsername: connection.instagramUsername,
    tokenExpiresAt: connection.tokenExpiresAt,
    status: connection.status,
    lastError: connection.lastError,
    connectedAt: connection.connectedAt,
    updatedAt: connection.updatedAt,
  };

  if (!includeSecrets) return safeConnection;

  return {
    ...safeConnection,
    pageAccessToken: decryptToken(connection.pageAccessTokenEncrypted),
    userAccessToken: decryptToken(connection.userAccessTokenEncrypted),
  };
}

export async function saveMetaConnection({
  companyId,
  facebookPageId,
  facebookPageName,
  instagramUserId,
  instagramUsername,
  pageAccessToken,
  userAccessToken,
  tokenExpiresAt,
}) {
  if (!companyId || !facebookPageId || !facebookPageName || !pageAccessToken) {
    throw new Error("Dados obrigatórios da conexão Meta estão ausentes.");
  }

  return prisma.socialConnection.upsert({
    where: {
      companyId_provider: {
        companyId: Number(companyId),
        provider: "META",
      },
    },
    create: {
      companyId: Number(companyId),
      provider: "META",
      facebookPageId,
      facebookPageName,
      instagramUserId: instagramUserId || null,
      instagramUsername: instagramUsername || null,
      pageAccessTokenEncrypted: encryptToken(pageAccessToken),
      userAccessTokenEncrypted: encryptToken(userAccessToken),
      tokenExpiresAt: tokenExpiresAt || null,
      status: "CONNECTED",
      lastError: null,
      connectedAt: new Date(),
    },
    update: {
      facebookPageId,
      facebookPageName,
      instagramUserId: instagramUserId || null,
      instagramUsername: instagramUsername || null,
      pageAccessTokenEncrypted: encryptToken(pageAccessToken),
      userAccessTokenEncrypted: encryptToken(userAccessToken),
      tokenExpiresAt: tokenExpiresAt || null,
      status: "CONNECTED",
      lastError: null,
      connectedAt: new Date(),
    },
  });
}

export async function disconnectMeta(companyId) {
  await prisma.socialConnection.deleteMany({
    where: { companyId: Number(companyId), provider: "META" },
  });
}

export async function setMetaConnectionError(
  companyId,
  errorMessage,
  { reconnectRequired = false } = {}
) {
  await prisma.socialConnection.updateMany({
    where: { companyId: Number(companyId), provider: "META" },
    data: {
      status: reconnectRequired ? "RECONNECT_REQUIRED" : "CONNECTED",
      lastError: errorMessage || "Erro desconhecido na Meta.",
    },
  });
}
