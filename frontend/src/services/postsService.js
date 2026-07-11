import api from "./api";

export async function getPosts() {
  const { data } = await api.get("/posts");
  return data.posts;
}

export async function createPost(post) {
  const { data } = await api.post("/posts", post);
  return data;
}

export async function removePost(id) {
  const { data } = await api.delete(`/posts/${id}`);
  return data;
}