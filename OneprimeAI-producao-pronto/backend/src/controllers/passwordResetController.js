import crypto from "crypto";
import bcrypt from "bcrypt";

import prisma from "../prisma/client.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const RESET_EXPIRATION_MINUTES = 30;

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
}

export async function forgotPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Informe seu e-mail.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    /*
     * A resposta é igual mesmo quando o e-mail não existe.
     * Isso evita revelar quais e-mails estão cadastrados.
     */
    const successResponse = {
      success: true,
      message:
        "Caso o e-mail esteja cadastrado, você receberá as instruções para redefinir sua senha.",
    };

    if (!user) {
      return res.json(successResponse);
    }

    /*
     * Invalida solicitações anteriores ainda não utilizadas.
     */
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + RESET_EXPIRATION_MINUTES * 60 * 1000
    );

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl =
      `${getFrontendUrl()}/?resetToken=` +
      encodeURIComponent(rawToken);

    try {
      await sendPasswordResetEmail({
        recipient: user.email,
        userName: user.name,
        resetUrl,
      });
    } catch (emailError) {
      console.error(
        "ERRO AO ENVIAR E-MAIL DE RECUPERAÇÃO:",
        emailError
      );

      /*
       * Remove o token que não chegou ao usuário.
       */
      await prisma.passwordResetToken.delete({
        where: { tokenHash },
      });

      return res.status(500).json({
        success: false,
        error:
          "Não foi possível enviar o e-mail. Verifique a configuração SMTP.",
      });
    }

    return res.json(successResponse);
  } catch (error) {
    console.error("ERRO AO SOLICITAR NOVA SENHA:", error);

    return res.status(500).json({
      success: false,
      error:
        "Não foi possível processar a solicitação de recuperação.",
    });
  }
}

export async function resetPassword(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");
    const passwordConfirmation = String(
      req.body.passwordConfirmation || ""
    );

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token de recuperação ausente.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "A nova senha deve possuir pelo menos 8 caracteres.",
      });
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({
        success: false,
        error: "A confirmação da senha não corresponde.",
      });
    }

    const tokenHash = hashToken(token);

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: {
          user: true,
        },
      });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Este link é inválido, já foi utilizado ou expirou.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: passwordHash,
        },
      }),

      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return res.json({
      success: true,
      message:
        "Senha redefinida com sucesso. Agora você pode entrar no sistema.",
    });
  } catch (error) {
    console.error("ERRO AO REDEFINIR SENHA:", error);

    return res.status(500).json({
      success: false,
      error: "Não foi possível redefinir a senha.",
    });
  }
}