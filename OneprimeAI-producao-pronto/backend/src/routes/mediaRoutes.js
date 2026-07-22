import express from "express";
import multer from "multer";

import { authenticate } from "../middlewares/auth.js";
import { saveImageBuffer } from "../services/mediaService.js";

const router = express.Router();
router.use(authenticate);

const storage = multer.memoryStorage();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const fileFilter = (req, file, callback) => {
  if (!allowedTypes.has(file.mimetype)) {
    return callback(new Error("Formato inválido. Envie JPG, PNG ou WEBP."));
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhuma imagem enviada.",
      });
    }

    const savedImage = await saveImageBuffer(
      req.file.buffer,
      req.file.originalname || "oneprime-upload.png"
    );

    return res.json({
      success: true,
      message: "Imagem enviada com sucesso.",
      imageUrl: savedImage.imageUrl,
      publicId: savedImage.publicId,
      width: savedImage.width,
      height: savedImage.height,
      filename: savedImage.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("ERRO AO FAZER UPLOAD DA IMAGEM:", error);

    const status = error instanceof multer.MulterError ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Erro ao fazer upload da imagem.",
    });
  }
});

export default router;
