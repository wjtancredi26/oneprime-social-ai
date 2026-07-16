import prisma from "../prisma/client.js";
import {
  getSelectedNetworks,
  publishScheduledPost,
} from "./postPublisherService.js";

const INTERVAL_MS = 60 * 1000;
const MAX_POSTS_PER_CYCLE = 5;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000;
const STUCK_TIMEOUT_MS = 10 * 60 * 1000;

let schedulerStarted = false;
let schedulerProcessing = false;
let schedulerInterval = null;

function normalizeError(error) {
  if (!error) {
    return "Erro desconhecido durante a publicação.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error.message ||
    error.response?.data?.error?.message ||
    error.response?.data?.error ||
    "Erro desconhecido durante a publicação."
  );
}

/**
 * Erros de autorização ou configuração não devem ser
 * tentados automaticamente várias vezes.
 */
function isRetryableError(error) {
  const message = normalizeError(error).toLowerCase();

  const permanentErrors = [
    "permissions error",
    "permission",
    "token expirado",
    "invalid oauth",
    "access token",
    "meta não conectada",
    "meta app",
    "não configurado",
    "not configured",
    "instagram exige uma imagem",
    "empresa vinculada",
  ];

  if (
    permanentErrors.some((text) => message.includes(text))
  ) {
    return false;
  }

  const temporaryErrors = [
    "timeout",
    "timed out",
    "fetch failed",
    "network",
    "econnreset",
    "econnrefused",
    "temporarily",
    "rate limit",
    "too many requests",
    "429",
    "500",
    "502",
    "503",
    "504",
  ];

  return temporaryErrors.some((text) =>
    message.includes(text)
  );
}

function isCompletelyPublished(post) {
  const selected = getSelectedNetworks(post.network);

  const facebookDone =
    !selected.facebook || Boolean(post.facebookPostId);

  const instagramDone =
    !selected.instagram || Boolean(post.instagramPostId);

  return facebookDone && instagramDone;
}

/**
 * Caso o Railway reinicie enquanto um post estiver sendo
 * publicado, ele pode ficar preso em PUBLICANDO.
 *
 * Esta função devolve esses posts para AGENDADO.
 */
async function recoverStuckPosts() {
  const stuckBefore = new Date(
    Date.now() - STUCK_TIMEOUT_MS
  );

  const result = await prisma.scheduledPost.updateMany({
    where: {
      status: "PUBLICANDO",
      updatedAt: {
        lte: stuckBefore,
      },
    },
    data: {
      status: "AGENDADO",
      scheduledAt: new Date(),
      lastError:
        "A publicação foi interrompida. Nova tentativa programada.",
    },
  });

  if (result.count > 0) {
    console.warn(
      `${result.count} publicação(ões) travada(s) recuperada(s).`
    );
  }
}

/**
 * Reserva o post antes da publicação.
 *
 * O updateMany com status AGENDADO impede que duas
 * instâncias processem o mesmo post ao mesmo tempo.
 */
async function claimPost(postId) {
  const result = await prisma.scheduledPost.updateMany({
    where: {
      id: postId,
      status: "AGENDADO",
    },
    data: {
      status: "PUBLICANDO",
      attempts: {
        increment: 1,
      },
      lastError: null,
    },
  });

  return result.count === 1;
}

async function processOnePost(candidate) {
  const claimed = await claimPost(candidate.id);

  if (!claimed) {
    return;
  }

  let post = await prisma.scheduledPost.findUnique({
    where: {
      id: candidate.id,
    },
  });

  if (!post) {
    return;
  }

  try {
    console.log(
      `Publicando post agendado ID ${post.id}, tentativa ${post.attempts}.`
    );

    /*
     * Salva o ID de cada rede imediatamente após o sucesso.
     * Assim, se a outra rede falhar, não duplicamos a primeira.
     */
    const result = await publishScheduledPost(post, {
      onProgress: async (progress) => {
        post = await prisma.scheduledPost.update({
          where: {
            id: post.id,
          },
          data: progress,
        });
      },
    });

    post = await prisma.scheduledPost.findUnique({
      where: {
        id: post.id,
      },
    });

    if (!post || !isCompletelyPublished(post)) {
      throw new Error(
        "A publicação não foi concluída em todas as redes selecionadas."
      );
    }

    await prisma.scheduledPost.update({
      where: {
        id: post.id,
      },
      data: {
        status: "PUBLICADO",
        publishedAt: new Date(),
        lastError: null,
      },
    });

    console.log(
      `Post ${post.id} publicado com sucesso.`,
      result
    );
  } catch (error) {
    const message = normalizeError(error);

    console.error(
      `Erro ao publicar post ${post.id}:`,
      message
    );

    const currentPost =
      await prisma.scheduledPost.findUnique({
        where: {
          id: post.id,
        },
      });

    const attempts = currentPost?.attempts || post.attempts;
    const retryable =
      attempts < MAX_ATTEMPTS && isRetryableError(error);

    await prisma.scheduledPost.update({
      where: {
        id: post.id,
      },
      data: retryable
        ? {
            status: "AGENDADO",
            scheduledAt: new Date(
              Date.now() + RETRY_DELAY_MS
            ),
            lastError: `${message} Nova tentativa automática programada.`,
          }
        : {
            status: "ERRO",
            lastError: message,
          },
    });

    if (retryable) {
      console.log(
        `Nova tentativa do post ${post.id} programada para daqui a 5 minutos.`
      );
    }
  }
}

async function processScheduledPosts() {
  if (schedulerProcessing) {
    return;
  }

  schedulerProcessing = true;

  try {
    const posts = await prisma.scheduledPost.findMany({
      where: {
        status: "AGENDADO",
        scheduledAt: {
          lte: new Date(),
        },
      },
      take: MAX_POSTS_PER_CYCLE,
      orderBy: {
        scheduledAt: "asc",
      },
    });

    for (const post of posts) {
      await processOnePost(post);
    }
  } catch (error) {
    console.error(
      "Erro geral no scheduler:",
      normalizeError(error)
    );
  } finally {
    schedulerProcessing = false;
  }
}

export async function startScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  console.log("Scheduler automático iniciado.");

  try {
    await recoverStuckPosts();
  } catch (error) {
    console.error(
      "Erro ao recuperar posts travados:",
      normalizeError(error)
    );
  }

  void processScheduledPosts();

  schedulerInterval = setInterval(() => {
    void processScheduledPosts();
  }, INTERVAL_MS);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  schedulerStarted = false;
  schedulerProcessing = false;

  console.log("Scheduler automático interrompido.");
}