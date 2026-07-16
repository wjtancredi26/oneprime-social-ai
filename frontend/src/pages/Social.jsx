import { useEffect, useState } from "react";
import api from "../services/api";
import { getCompanies } from "../services/companyService";

export default function Social() {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");

  async function loadCompanies() {
    const items = await getCompanies();
    setCompanies(items);
    if (!companyId && items[0]) setCompanyId(String(items[0].id));
  }

  async function loadStatus(selectedCompanyId = companyId) {
    if (!selectedCompanyId) return;

    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.get("/meta/status", {
        params: { companyId: selectedCompanyId },
      });
      setConnection(data.connection || null);
    } catch (error) {
      setConnection(null);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function connectMeta() {
    if (!companyId) {
      setMessage("Selecione uma empresa antes de conectar.");
      return;
    }

    setConnecting(true);
    setMessage("");

    try {
      const { data } = await api.post("/meta/connect-url", {
        companyId: Number(companyId),
      });
      window.location.href = data.url;
    } catch (error) {
      setMessage(error.message);
      setConnecting(false);
    }
  }

  async function disconnectMeta() {
    if (!window.confirm("Deseja desconectar Facebook e Instagram desta empresa?")) {
      return;
    }

    try {
      await api.delete("/meta/disconnect", {
        data: { companyId: Number(companyId) },
      });
      setConnection(null);
      setMessage("Redes sociais desconectadas.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadCompanies().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (companyId) loadStatus(companyId);
  }, [companyId]);

  return (
    <section className="panel">
      <h2>📲 Redes Sociais</h2>
      <p>
        Cada empresa conecta sua própria Página do Facebook e o Instagram
        profissional vinculado.
      </p>

      <div className="result-box">
        <label>
          <strong>Empresa</strong>
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
          >
            <option value="">Selecione uma empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>

        <h2>Meta Business</h2>

        {message && <p>{message}</p>}

        {loading ? (
          <p>Carregando conexão...</p>
        ) : connection ? (
          <>
            <p>🟢 <strong>{connection.status === "CONNECTED" ? "Conectado" : "Atenção necessária"}</strong></p>
            <p><strong>Facebook:</strong> {connection.facebookPageName}</p>
            <p><strong>Page ID:</strong> {connection.facebookPageId}</p>
            <p>
              <strong>Instagram:</strong>{" "}
              {connection.instagramUsername
                ? `@${connection.instagramUsername}`
                : connection.instagramUserId || "Não conectado à Página"}
            </p>
            <p>
              <strong>Conectado em:</strong>{" "}
              {new Date(connection.connectedAt).toLocaleString("pt-BR")}
            </p>
            {connection.lastError && (
              <p><strong>Último erro:</strong> {connection.lastError}</p>
            )}

            <button className="primary" onClick={connectMeta} disabled={connecting}>
              {connecting ? "Abrindo Meta..." : "Reconectar Meta"}
            </button>
            <button className="secondary" onClick={disconnectMeta}>
              Desconectar
            </button>
          </>
        ) : (
          <>
            <p>🔴 Nenhuma conta Meta conectada para esta empresa.</p>
            <button className="primary" onClick={connectMeta} disabled={connecting}>
              {connecting ? "Abrindo Meta..." : "Conectar Facebook e Instagram"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
