import express from "express";

import {
  login,
  me,
  register,
} from "../controllers/authController.js";

import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordResetController.js";

import {
  authenticate,
  requireAdmin,
} from "../middlewares/auth.js";

const router = express.Router();

/*
 * Rotas públicas
 */
router.post("/login", login);
router.post(
  "/forgot-password",
  forgotPassword
);
router.post(
  "/reset-password",
  resetPassword
);

/*
 * Rotas autenticadas
 */
router.get("/me", authenticate, me);

/*
 * Somente ADMIN pode criar usuários.
 */
router.post(
  "/register",
  authenticate,
  requireAdmin,
  register
);

export default router;