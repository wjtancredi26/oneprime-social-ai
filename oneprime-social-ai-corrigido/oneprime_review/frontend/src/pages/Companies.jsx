import { useEffect, useState } from "react";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../services/companyService";

const emptyForm = {
  name: "",
  cnpj: "",
  segment: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  website: "",
  tone: "",
  products: "",
  brands: "",
  ctas: "",
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadCompanies() {
    setLoading(true);

    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      alert("Erro ao carregar empresas.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingCompany(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(company) {
    setEditingCompany(company);
    setForm({
      name: company.name || "",
      cnpj: company.cnpj || "",
      segment: company.segment || "",
      whatsapp: company.whatsapp || "",
      instagram: company.instagram || "",
      facebook: company.facebook || "",
      website: company.website || "",
      tone: company.tone || "",
      products: company.products || "",
      brands: company.brands || "",
      ctas: company.ctas || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setEditingCompany(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Nome da empresa é obrigatório.");
      return;
    }

    try {
      const data = editingCompany
        ? await updateCompany(editingCompany.id, form)
        : await createCompany(form);

      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar empresa.");
      }

      closeForm();
      loadCompanies();
    } catch (error) {
      alert("Erro ao salvar empresa: " + error.message);
    }
  }

  async function handleDelete(company) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a empresa "${company.name}"?`
    );

    if (!confirmDelete) return;

    try {
      const data = await deleteCompany(company.id);

      if (!data.success) {
        throw new Error(data.error || "Erro ao excluir empresa.");
      }

      loadCompanies();
    } catch (error) {
      alert("Erro ao excluir empresa: " + error.message);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <section className="panel">
      <div className="agenda-header">
        <div>
          <h2>🏢 Empresas</h2>
          <p>
            Cadastre empresas para a OnePrime AI criar campanhas personalizadas.
          </p>
        </div>

        <button className="primary" onClick={showForm ? closeForm : openCreateForm}>
          {showForm ? "Fechar" : "+ Nova Empresa"}
        </button>
      </div>

      {showForm && (
        <form className="company-form" onSubmit={handleSubmit}>
          <h3>{editingCompany ? "Editar empresa" : "Nova empresa"}</h3>

          <input
            placeholder="Nome da empresa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="CNPJ"
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
          />

          <input
            placeholder="Segmento"
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
          />

          <input
            placeholder="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />

          <input
            placeholder="Instagram"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          />

          <input
            placeholder="Facebook"
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
          />

          <input
            placeholder="Site"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />

          <textarea
            placeholder="Tom de voz. Ex: profissional, elegante, comercial..."
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
          />

          <textarea
            placeholder="Produtos/serviços. Ex: Seguro Auto, Vida, Residencial..."
            value={form.products}
            onChange={(e) => setForm({ ...form, products: e.target.value })}
          />

          <textarea
            placeholder="Marcas/parceiros. Ex: Porto, HDI, Tokio..."
            value={form.brands}
            onChange={(e) => setForm({ ...form, brands: e.target.value })}
          />

          <textarea
            placeholder="CTAs. Ex: Faça sua cotação agora, Me chame no WhatsApp..."
            value={form.ctas}
            onChange={(e) => setForm({ ...form, ctas: e.target.value })}
          />

          <div className="actions">
            <button className="primary" type="submit">
              {editingCompany ? "Salvar alterações" : "Salvar Empresa"}
            </button>

            <button className="secondary" type="button" onClick={closeForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && <p>Carregando empresas...</p>}

      {!loading && companies.length === 0 && (
        <div className="result-box">
          <p>Nenhuma empresa cadastrada ainda.</p>
        </div>
      )}

      <div className="companies-list">
        {companies.map((company) => (
          <div className="company-card" key={company.id}>
            <h3>🏢 {company.name}</h3>
            <p>{company.segment || "Sem segmento informado"}</p>

            <small>WhatsApp: {company.whatsapp || "Não informado"}</small>
            <small>Instagram: {company.instagram || "Não informado"}</small>
            <small>Site: {company.website || "Não informado"}</small>

            <div className="company-tags">
              {company.products && <span>Produtos cadastrados</span>}
              {company.brands && <span>Marcas cadastradas</span>}
              {company.tone && <span>Tom de voz definido</span>}
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => openEditForm(company)}>
                ✏️ Editar
              </button>

              <button className="secondary" onClick={() => handleDelete(company)}>
                🗑️ Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}