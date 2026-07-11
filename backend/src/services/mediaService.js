import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { uploadImageBuffer } from "./cloudinaryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_ROOT = path.resolve(__dirname, "../..");

const LOGO_PATH = path.join(
  BACKEND_ROOT,
  "assets",
  "brand",
  "logo-oneprime.png"
);

async function applyBrand(buffer) {
  if (!fs.existsSync(LOGO_PATH)) {
    console.warn("Logo não encontrada:", LOGO_PATH);
    return buffer;
  }

  const metadata = await sharp(buffer).metadata();

  const logoWidth = Math.round((metadata.width || 1024) * 0.16);
  const margin = Math.round((metadata.width || 1024) * 0.03);

  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ width: logoWidth })
    .png()
    .toBuffer();

  return sharp(buffer)
    .composite([
      {
        input: logoBuffer,
        top: margin,
        left: margin,
      },
    ])
    .png()
    .toBuffer();
}

export async function saveImageBuffer(
  buffer,
  originalName = "image.png"
) {
  if (!buffer) {
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
  if (!base64Image) {
    throw new Error("Imagem base64 não informada.");
  }

  const cleanBase64 = base64Image.includes(",")
    ? base64Image.split(",").pop()
    : base64Image;

  const buffer = Buffer.from(cleanBase64, "base64");

  return saveImageBuffer(buffer, originalName);
}

export function getUploadRoot() {
  return null;
}