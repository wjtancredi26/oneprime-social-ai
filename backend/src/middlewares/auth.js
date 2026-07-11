import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Token de acesso ausente ou inválido');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 401, 'Usuário não encontrado');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Token inválido');
  }
};
