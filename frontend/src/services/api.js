import axios from "axios";

export const API_ORIGIN = (
  import.meta.env.VITE_API_URL ||
  "https://carefree-patience-production.up.railway.app"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 120000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("oneprime_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Erro ao comunicar com o servidor.";

    return Promise.reject(new Error(message));
  }
);

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith("/api/")
    ? path.slice(4)
    : path;

  const response = await api.request({
    url: normalizedPath,
    method: options.method || "GET",
    data: options.body ? JSON.parse(options.body) : options.data,
    headers: options.headers,
  });

  return response.data;
}

export default api;
