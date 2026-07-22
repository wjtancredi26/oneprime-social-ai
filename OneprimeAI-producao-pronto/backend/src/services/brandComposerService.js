import sharp from "sharp";
import path from "path";
import fs from "fs";

const LOGO_PATH = path.resolve("assets/brand/logo-oneprime.png");

export async function applyOnePrimeBrand(imagePath) {
  if (!fs.existsSync(LOGO_PATH)) {
    console.warn("Logo não encontrada:", LOGO_PATH);
    return imagePath;
  }

  const outputPath = imagePath.replace(".png", "-branded.png");

  const metadata = await sharp(imagePath).metadata();

  const logoWidth = Math.round(metadata.width * 0.18);
  const margin = Math.round(metadata.width * 0.04);

  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ width: logoWidth })
    .png()
    .toBuffer();

  await sharp(imagePath)
    .composite([
      {
        input: logoBuffer,
        top: margin,
        left: margin,
      },
    ])
    .png()
    .toFile(outputPath);

  return outputPath;
}