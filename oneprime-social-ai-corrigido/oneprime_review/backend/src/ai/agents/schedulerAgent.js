import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getDefaultUser() {
  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Wilian",
        email: "wilian@oneprimeseg.com.br",
        password: "123456",
        role: "ADMIN",
      },
    });
  }

  return user;
}

export async function executeSchedulerAgent(data) {
  const user = await getDefaultUser();

  const post = await prisma.scheduledPost.create({
    data: {
      prompt: data.prompt || "",
      caption: data.caption || "",
      hashtags: data.hashtags || "",
      imageIdea: data.imageIdea || "",
      cta: data.cta || "",
      imageUrl: data.imageUrl || null,
      network: data.network,
      scheduledAt: new Date(data.scheduledAt),
      status: "AGENDADO",
      userId: user.id,
    },
  });

  return post;
}