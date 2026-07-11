import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { env } from '../config/env.js';

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const comparePassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

export const signToken = (userId) => jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });

export const findUserByEmail = async (email) => prisma.user.findUnique({ where: { email } });

export const createUser = async (data) => prisma.user.create({ data });

export const getUserById = async (id) => prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    companyId: true,
  },
});
