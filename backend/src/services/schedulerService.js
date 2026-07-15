import prisma from "../prisma/client.js";
import { publishScheduledPost } from "./postPublisherService.js";

let schedulerStarted = false;
let schedulerProcessing = false;

async function processScheduledPosts() {
  if (schedulerProcessing) return;
  schedulerProcessing = true;

  try {
    const posts = await prisma.scheduledPost.findMany({
      where: {
        status: "AGENDADO",
        scheduledAt: { lte: new Date() },
      },
      take: 5,
      orderBy: { scheduledAt: "asc" },
    });

    for (const post of posts) {
      try {
        console.log(`Publicando post agendado ID ${post.id}`);

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "PUBLICANDO",
            attempts: { increment: 1 },
          },
        });

        const result = await publishScheduledPost(post);

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "PUBLICADO",
            publishedAt: new Date(),
            facebookPostId: result.facebook?.post_id || result.facebook?.id || null,
            instagramPostId: result.instagram?.id || null,
            lastError: null,
          },
        });

        console.log(`Post ${post.id} publicado com sucesso.`);
      } catch (error) {
        console.error(`Erro ao publicar post ${post.id}:`, error);

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "ERRO",
            lastError: error.message,
          },
        });
      }
    }
  } catch (error) {
    console.error("Erro geral no scheduler:", error);
  } finally {
    schedulerProcessing = false;
  }
}

export function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("Scheduler automático iniciado.");
  void processScheduledPosts();
  setInterval(processScheduledPosts, 60 * 1000);
}
