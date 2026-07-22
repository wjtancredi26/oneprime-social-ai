import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configureCloudinary() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export async function uploadImageBuffer(
  buffer,
  folder = "oneprime-social-ai"
) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Buffer da imagem não informado ou inválido.");
  }

  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "png",
        overwrite: false,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(
            new Error(error.message || "Falha ao enviar imagem para o Cloudinary.")
          );
        }

        if (!result?.secure_url || !result?.public_id) {
          return reject(
            new Error("O Cloudinary não retornou uma URL pública para a imagem.")
          );
        }

        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );

    stream.on("error", reject);
    stream.end(buffer);
  });
}
