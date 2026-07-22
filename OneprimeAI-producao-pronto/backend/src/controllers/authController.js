import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../prisma/client.js";
import { env } from "../config/env.js";
import {
  sendError,
  sendSuccess,
} from "../utils/response.js";

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeRole(role = "CLIENT") {
  const normalizedRole = String(role).trim().toUpperCase();

  if (normalizedRole === "ADMIN") {
    return "ADMIN";
  }

  return "CLIENT";
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      companyId: user.companyId || null,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId || null,
  };
}

/**
 * Esta função será acessível somente por ADMIN
 * depois da alteração no authRoutes.js.
 */
export async function register(req, res) {
  try {
    const {
      name,
      email: rawEmail,
      password,
      role,
      companyId,
    } = req.body;

    const email = normalizeEmail(rawEmail);

    if (!name?.trim() || !email || !password) {
      return sendError(
        res,
        400,
        "Nome, e-mail e senha são obrigatórios."
      );
    }

    if (password.length < 8) {
      return sendError(
        res,
        400,
        "A senha deve possuir pelo menos 8 caracteres."
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return sendError(
        res,
        409,
        "E-mail já cadastrado."
      );
    }

    let validatedCompanyId = null;

    if (companyId !== undefined && companyId !== null && companyId !== "") {
      const parsedCompanyId = Number(companyId);

      if (!Number.isInteger(parsedCompanyId) || parsedCompanyId <= 0) {
        return sendError(
          res,
          400,
          "Empresa inválida."
        );
      }

      const company = await prisma.company.findUnique({
        where: {
          id: parsedCompanyId,
        },
        select: {
          id: true,
        },
      });

      if (!company) {
        return sendError(
          res,
          404,
          "Empresa não encontrada."
        );
      }

      validatedCompanyId = company.id;
    }

    const normalizedRole = normalizeRole(role);

    if (normalizedRole === "CLIENT" && !validatedCompanyId) {
      return sendError(
        res,
        400,
        "Um usuário cliente precisa estar vinculado a uma empresa."
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        role: normalizedRole,
        companyId: validatedCompanyId,
      },
    });

    return sendSuccess(
      res,
      201,
      {
        user: serializeUser(newUser),
      },
      "Usuário criado com sucesso."
    );
  } catch (error) {
    console.error("ERRO AO CRIAR USUÁRIO:", error);

    return sendError(
      res,
      500,
      "Erro ao criar usuário.",
      error.message
    );
  }
}

export async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return sendError(
        res,
        400,
        "E-mail e senha são obrigatórios."
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return sendError(
        res,
        401,
        "Credenciais inválidas."
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return sendError(
        res,
        401,
        "Credenciais inválidas."
      );
    }

    /*
     * Converte usuários antigos com role USER
     * para o comportamento de cliente.
     */
    const effectiveRole =
      user.role === "ADMIN" ? "ADMIN" : "CLIENT";

    const token = createToken({
      ...user,
      role: effectiveRole,
    });

    return sendSuccess(
      res,
      200,
      {
        token,
        user: serializeUser({
          ...user,
          role: effectiveRole,
        }),
      },
      "Login realizado com sucesso."
    );
  } catch (error) {
    console.error("ERRO AO REALIZAR LOGIN:", error);

    return sendError(
      res,
      500,
      "Erro ao realizar login.",
      error.message
    );
  }
}

export async function me(req, res) {
  try {
    return sendSuccess(
      res,
      200,
      req.user,
      "Usuário autenticado."
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Erro ao buscar usuário.",
      error.message
    );
  }
}