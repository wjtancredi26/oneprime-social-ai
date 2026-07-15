import { useEffect, useState } from "react";
import api, { API_ORIGIN } from "../services/api";

export default function Social() {
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState(null);

  async function loadStatus() {
    setLoading(true);

    try {
      const { data } = await api.get("/meta/status");
      setConnection(data.connection || null);
    } catch (error) {
      alert("Erro ao carregar conexão Meta.");
    } finally {
      setLoading(false);
    }
  }

  function connectMeta() {
    window.location.href = `${API_ORIGIN}/api/meta/connect`;
  }

  async function disconnectMeta() {
    if (!confirm("Deseja desconectar a Meta?")) return;

    await api.delete("/meta/disconnect");
    setConnection(null);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <section className="panel">
      <h2>📲 Redes Sociais</h2>
      <p>Conecte Facebook e Instagram para publicar automaticamente.</p>

      <div className="result-box">
        <h2>Meta Business</h2>

        {loading ? (
          <p>Carregando...</p>
        ) : connection ? (
          <>
            <p>🟢 Conectado</p>
            <p><strong>Página:</strong> {connection.pageName}</p>
            <p><strong>Page ID:</strong> {connection.pageId}</p>
            <p><strong>Instagram ID:</strong> {connection.igUserId || "Não encontrado"}</p>
            <p><strong>Conectado em:</strong> {new Date(connection.connectedAt).toLocaleString("pt-BR")}</p>

            <button className="secondary" onClick={disconnectMeta}>
              Desconectar Meta
            </button>
          </>
        ) : (
          <>
            <p>🔴 Nenhuma conta Meta conectada.</p>

            <button className="primary" onClick={connectMeta}>
              Conectar Facebook / Instagram
            </button>
          </>
        )}
      </div>
    </section>
  );
}