import {
  publishFacebookPost,
  publishInstagramPost,
} from "./metaService.js";

function buildMessage(post) {
  return `${post.caption || ""}

${post.hashtags || ""}

${post.cta || ""}`.trim();
}

export function getSelectedNetworks(network = "") {
  const normalized = String(network).trim().toLowerCase();

  const both =
    normalized.includes("ambos") ||
    normalized.includes("ambas") ||
    normalized.includes("both");

  return {
    facebook: both || normalized.includes("facebook"),
    instagram: both || normalized.includes("instagram"),
  };
}

function extractFacebookId(response) {
  return response?.post_id || response?.id || null;
}

function extractInstagramId(response) {
  return response?.id || response?.post_id || null;
}

/**
 * Publica somente nas redes ainda não publicadas.
 *
 * Isso evita duplicar uma publicação no Facebook quando:
 * - o Facebook publicou;
 * - o Instagram falhou;
 * - o sistema tentou novamente.
 */
export async function publishScheduledPost(
  post,
  { onProgress } = {}
) {
  if (!post?.companyId) {
    throw new Error(
      "A postagem não possui uma empresa vinculada."
    );
  }

  const message = buildMessage(post);
  const selected = getSelectedNetworks(post.network);

  if (!selected.facebook && !selected.instagram) {
    throw new Error(
      "Selecione Facebook, Instagram ou ambas as redes."
    );
  }

  const result = {
    facebook: null,
    instagram: null,
  };

  /*
   * FACEBOOK
   */
  if (selected.facebook) {
    if (post.facebookPostId) {
      result.facebook = {
        id: post.facebookPostId,
        skipped: true,
        reason: "already_published",
      };
    } else {
      result.facebook = await publishFacebookPost({
        companyId: post.companyId,
        message,
        imageUrl: post.imageUrl || null,
      });

      const facebookPostId = extractFacebookId(
        result.facebook
      );

      if (facebookPostId && onProgress) {
        await onProgress({
          facebookPostId,
        });
      }
    }
  }

  /*
   * INSTAGRAM
   */
  if (selected.instagram) {
    if (post.instagramPostId) {
      result.instagram = {
        id: post.instagramPostId,
        skipped: true,
        reason: "already_published",
      };
    } else {
      if (!post.imageUrl) {
        throw new Error(
          "O Instagram exige uma imagem pública para publicar."
        );
      }

      result.instagram = await publishInstagramPost({
        companyId: post.companyId,
        caption: message,
        imageUrl: post.imageUrl,
      });

      const instagramPostId = extractInstagramId(
        result.instagram
      );

      if (instagramPostId && onProgress) {
        await onProgress({
          instagramPostId,
        });
      }
    }
  }

  return result;
}