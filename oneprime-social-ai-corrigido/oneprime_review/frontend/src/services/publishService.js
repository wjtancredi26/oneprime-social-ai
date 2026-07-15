import api from "./api";

export async function publishFacebookPost(postId) {
  const { data } = await api.post(`/publish/facebook/post/${postId}`);
  return data;
}

export async function publishPostNow(payload) {
  const { data } = await api.post("/publish/now", payload);
  return data;
}

export async function publishScheduledPost(postId) {
  const { data } = await api.post(`/publish/post/${postId}`);
  return data;
}
