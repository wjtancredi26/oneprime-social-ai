import api from "./api";

export async function getCompanies() {
  const { data } = await api.get("/companies");
  return data.companies || [];
}

export async function createCompany(company) {
  const { data } = await api.post("/companies", company);
  return data;
}

export async function updateCompany(id, company) {
  const { data } = await api.put(`/companies/${id}`, company);
  return data;
}

export async function deleteCompany(id) {
  const { data } = await api.delete(`/companies/${id}`);
  return data;
}