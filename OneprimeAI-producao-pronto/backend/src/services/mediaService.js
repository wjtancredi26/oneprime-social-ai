import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { uploadImageBuffer } from "./cloudinaryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, "../..");
const LOGO_PATH = path.join(BACKEND_ROOT, "assets", "brand", "logo-oneprime.png");

async function normalizeImage(buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .png({ quality: 95, compressionLevel: 8 })
      .toBuffer();
  } catch {
    throw new Error("O arquivo enviado não é uma imagem válida.");
  }
}

async function applyBrand(buffer) {
  const normalizedBuffer = await normalizeImage(buffer);

  if (!fs.existsSync(LOGO_PATH)) {
    console.warn("Logo não encontrada; imagem será salva sem marca:", LOGO_PATH);
    return normalizedBuffer;
  }

  const metadata = await sharp(normalizedBuffer).metadata();
  const baseWidth = metadata.width || 1024;
  const logoWidth = Math.max(80, Math.round(baseWidth * 0.16));
  const margin = Math.max(20, Math.round(baseWidth * 0.03));

  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ width: logoWidth, withoutEnlargement: true })
    .png()
    .toBuffer();

  return sharp(normalizedBuffer)
    .composite([{ input: logoBuffer, top: margin, left: margin }])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();
}

export async function saveImageBuffer(buffer, originalName = "image.png") {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Buffer da imagem não informado.");
  }

  const brandedBuffer = await applyBrand(buffer);
  const uploaded = await uploadImageBuffer(
    brandedBuffer,
    "oneprime-social-ai/generated"
  );

  return {
    filename: originalName,
    filePath: null,
    imageUrl: uploaded.imageUrl,
    publicId: uploaded.publicId,
    width: uploaded.width,
    height: uploaded.height,
  };
}

export async function saveBase64Image(
  base64Image,
  originalName = "oneprime-image.png"
) {
  if (!base64Image || typeof base64Image !== "string") {
    throw new Error("Imagem base64 não informada.");
  }

  const cleanBase64 = base64Image.includes(",")
    ? base64Image.split(",").pop()
    : base64Image;

  const buffer = Buffer.from(cleanBase64, "base64");

  if (!buffer.length) {
    throw new Error("A imagem base64 recebida está vazia ou inválida.");
  }

  return saveImageBuffer(buffer, originalName);
}

export async function saveRemoteImage(
  remoteUrl,
  originalName = "oneprime-remote-image.png"
) {
  let url;

  try {
    url = new URL(remoteUrl);
  } catch {
    throw new Error("A URL da imagem remota é inválida.");
  }

  if (url.protocol !== "https:") {
    throw new Error("A imagem remota precisa usar HTTPS.");
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });

  if (!response.ok) {
    throw new Error(`Não foi possível baixar a imagem remota (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("A URL informada não retornou uma imagem.");
  }

  const arrayBuffer = await response.arrayBuffer();
  return saveImageBuffer(Buffer.from(arrayBuffer), originalName);
}

export function getUploadRoot() {
  return null;
}
