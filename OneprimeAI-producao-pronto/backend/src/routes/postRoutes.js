import express from "express";

import {
  createPost,
  deletePost,
  getPostById,
  listPosts,
  updatePost,
} from "../controllers/postController.js";

import {
  authenticate,
} from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listPosts);
router.get("/:id", getPostById);
router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;