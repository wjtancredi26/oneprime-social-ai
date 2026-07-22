import jwt from "jsonwebtoken";

import prisma from "../prisma/client.js";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

function normalizeUserRole(role) {
  return role === "ADMIN" ? "ADMIN" : "CLIENT";
}

export async function authenticate(req, res, next) {
  try {
    const authHeader =
      req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return sendError(
        res,
        401,
        "Token de acesso ausente ou inválido."
      );
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return sendError(
        res,
        401,
        "Token de acesso ausente ou inválido."
      );
    }

    const decoded = jwt.verify(
      token,
      env.jwtSecret
    );

    if (!decoded?.userId) {
      return sendError(
        res,
        401,
        "Token inválido."
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: Number(decoded.userId),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(
        res,
        401,
        "Usuário não encontrado."
      );
    }

    req.user = {
      ...user,
      role: normalizeUserRole(user.role),
    };

    return next();
  } catch (error) {
    if (
      error?.name === "TokenExpiredError"
    ) {
      return sendError(
        res,
        401,
        "Sua sessão expirou. Entre novamente."
      );
    }

    return sendError(
      res,
      401,
      "Token inválido."
    );
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return sendError(
      res,
      401,
      "Usuário não autenticado."
    );
  }

  if (req.user.role !== "ADMIN") {
    return sendError(
      res,
      403,
      "Acesso permitido somente para administradores."
    );
  }

  return next();
}

/**
 * Valida acesso a uma empresa.
 *
 * ADMIN pode acessar qualquer empresa.
 * CLIENT só pode acessar sua própria companyId.
 */
export function canAccessCompany(
  user,
  requestedCompanyId
) {
  if (!user) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  const companyId = Number(requestedCompanyId);

  return (
    Number.isInteger(companyId) &&
    companyId > 0 &&
    Number(user.companyId) === companyId
  );
}

export function requireCompanyAccess(
  source = "params",
  field = "companyId"
) {
  return function companyAccessMiddleware(
    req,
    res,
    next
  ) {
    const requestedCompanyId =
      req[source]?.[field];

    if (
      !canAccessCompany(
        req.user,
        requestedCompanyId
      )
    ) {
      return sendError(
        res,
        403,
        "Você não possui acesso a esta empresa."
      );
    }

    return next();
  };
}