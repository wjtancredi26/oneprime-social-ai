import { generateContent, generateImage } from "../services/aiService";
import { createPost } from "../services/postsService";

export async function aiGenerateContent(prompt) {
  return await generateContent(prompt);
}

export async function aiGenerateImage(prompt, format, style) {
  return await generateImage(prompt, format, style);
}

export async function aiSchedulePost(post) {
  return await createPost(post);
}