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

import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authenticate, me);

export default router;