import api from "./api";

export async function getDashboardData(companyId = null) {
  const params = companyId ? { companyId } : {};

  const { data } = await api.get("/dashboard", {
    params,
  });

  return data;
}