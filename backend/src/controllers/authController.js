import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { env } from '../config/env.js';
import { sendError, sendSuccess } from '../utils/response.js';

const createToken = (userId) => {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Nome, e-mail e senha são obrigatórios');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 409, 'E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = companyId
      ? await prisma.company.findUnique({ where: { id: companyId } })
      : null;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER',
        companyId: company ? company.id : undefined,
      },
    });

    const token = createToken(newUser.id);

    return sendSuccess(res, 201, { token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } }, 'Usuário criado com sucesso');
  } catch (error) {
    return sendError(res, 500, 'Erro ao criar usuário', error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'E-mail e senha são obrigatórios');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    const token = createToken(user.id);

    return sendSuccess(res, 200, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'Login realizado com sucesso');
  } catch (error) {
    return sendError(res, 500, 'Erro ao realizar login', error.message);
  }
};

export const me = async (req, res) => {
  try {
    return sendSuccess(res, 200, req.user, 'Usuário autenticado');
  } catch (error) {
    return sendError(res, 500, 'Erro ao buscar usuário', error.message);
  }
};
