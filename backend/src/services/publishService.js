import api from "./api";

export async function publishFacebookPost(postId) {
  const { data } = await api.post(`/publish/facebook/post/${postId}`);
  return data;
}