const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://carefree-patience-production.up.railway.app";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Erro na API: ${response.status}`
    );
  }

  return data;
}

export default API_URL;