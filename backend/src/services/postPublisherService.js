import { publishFacebookPost, publishInstagramPost } from "./metaService.js";

export async function publishScheduledPost(post) {
  const message = `${post.caption}

${post.hashtags || ""}

${post.cta || ""}`.trim();

  const result = {
    facebook: null,
    instagram: null,
  };

  if (post.network.includes("Facebook")) {
    result.facebook = await publishFacebookPost({
      companyId: post.companyId,
      message,
      imageUrl: post.imageUrl,
    });
  }

  if (post.network.includes("Instagram")) {
    result.instagram = await publishInstagramPost({
      companyId: post.companyId,
      caption: message,
      imageUrl: post.imageUrl,
    });
  }

  return result;
}