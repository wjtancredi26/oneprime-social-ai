import dotenv from "dotenv";

dotenv.config();

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlaceholder(value) {
  const normalized = clean(value).toUpperCase();
  return (
    !normalized ||
    normalized.includes("SEU_") ||
    normalized.includes("YOUR_") ||
    normalized.includes("CHANGEME") ||
    normalized.includes("EXEMPLO") ||
    normalized.includes("EXAMPLE")
  );
}

function validateMetaAppId(value) {
  const appId = clean(value);
  if (isPlaceholder(appId) || !/^\d+$/.test(appId)) {
    return null;
  }
  return appId;
}

function validateAbsoluteUrl(value, { requireHttps = false } = {}) {
  const raw = clean(value);
  if (isPlaceholder(raw)) return null;

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (requireHttps && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

const nodeEnv = clean(process.env.NODE_ENV) || "development";
const isProduction = nodeEnv === "production";

export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv,
  isProduction,
  databaseUrl: clean(process.env.DATABASE_URL),
  jwtSecret: clean(process.env.JWT_SECRET) || "development-secret",

  frontendUrl: validateAbsoluteUrl(process.env.FRONTEND_URL, {
    requireHttps: isProduction,
  }),

  meta: {
    appId: validateMetaAppId(process.env.META_APP_ID),
    appSecret: isPlaceholder(process.env.META_APP_SECRET)
      ? null
      : clean(process.env.META_APP_SECRET),
    redirectUri: validateAbsoluteUrl(process.env.META_REDIRECT_URI, {
      requireHttps: isProduction,
    }),
    graphVersion: clean(process.env.META_GRAPH_VERSION) || "v25.0",
  },
};

export function getMetaConfigurationErrors() {
  const errors = [];

  if (!env.meta.appId) {
    errors.push("META_APP_ID deve conter somente o número real do aplicativo Meta.");
  }
  if (!env.meta.appSecret) {
    errors.push("META_APP_SECRET não está configurado com um valor válido.");
  }
  if (!env.meta.redirectUri) {
    errors.push(
      env.isProduction
        ? "META_REDIRECT_URI deve ser uma URL HTTPS válida do callback do backend."
        : "META_REDIRECT_URI deve ser uma URL absoluta válida."
    );
  }
  if (!env.frontendUrl) {
    errors.push(
      env.isProduction
        ? "FRONTEND_URL deve ser uma URL HTTPS válida do frontend."
        : "FRONTEND_URL deve ser uma URL absoluta válida."
    );
  }

  return errors;
}
