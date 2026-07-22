import crypto from "crypto";
import prisma from "../prisma/client.js";
import { decryptToken, encryptToken } from "./tokenCryptoService.js";

const SESSION_TTL_MS = 15 * 60 * 1000;

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createMetaOAuthSession({ userId, companyId, payload }) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.metaOAuthSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { userId: Number(userId), companyId: Number(companyId) },
      ],
    },
  });

  await prisma.metaOAuthSession.create({
    data: {
      tokenHash,
      userId: Number(userId),
      companyId: Number(companyId),
      payloadEncrypted: encryptToken(JSON.stringify(payload)),
      expiresAt,
    },
  });

  return rawToken;
}

export async function getMetaOAuthSession({ rawToken, userId }) {
  if (!rawToken) throw new Error("Sessão de conexão Meta não informada.");

  const session = await prisma.metaOAuthSession.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!session || session.usedAt || session.expiresAt <= new Date()) {
    throw new Error("A sessão de conexão Meta expirou. Inicie a conexão novamente.");
  }

  if (Number(session.userId) !== Number(userId)) {
    throw new Error("Esta sessão Meta pertence a outro usuário.");
  }

  return {
    ...session,
    payload: JSON.parse(decryptToken(session.payloadEncrypted)),
  };
}

export async function consumeMetaOAuthSession({ rawToken, userId }) {
  const session = await getMetaOAuthSession({ rawToken, userId });

  await prisma.metaOAuthSession.update({
    where: { id: session.id },
    data: { usedAt: new Date() },
  });

  return session;
}
