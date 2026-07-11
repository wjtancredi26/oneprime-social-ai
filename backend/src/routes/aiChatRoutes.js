import express from "express";
import { runAIChat } from "../controllers/aiChatController.js";

const router = express.Router();

router.post("/chat", runAIChat);

export default router;