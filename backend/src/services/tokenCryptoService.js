import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.META_TOKEN_ENCRYPTION_KEY;

  if (!secret || secret.length < 24) {
    throw new Error(
      "META_TOKEN_ENCRYPTION_KEY não configurada ou muito curta. Use uma chave com pelo menos 24 caracteres."
    );
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(value) {
  if (!value) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptToken(payload) {
  if (!payload) return null;

  const [ivB64, authTagB64, encryptedB64] = payload.split(".");

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Token criptografado inválido.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
