import { useEffect, useMemo, useState } from "react";
import { getDashboardData } from "../services/dashboardService";

import StatCard from "../components/StatCard";
import UpcomingPost from "../components/UpcomingPost";
import QuickActions from "../components/QuickActions";

function formatDate(value) {
  if (!value) return "Data não informada";

  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusLabel(status) {
  const labels = {
    AGENDADO: "Agendado",
    PUBLICANDO: "Publicando",
    PUBLICADO: "Publicado",
    ERRO: "Erro",
  };

  return labels[status] || status || "Sem status";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}

export default function Dashboard({ setView }) {
  const [dashboard, setDashboard] = useState({
    stats: {
      scheduled: 0,
      publishing: 0,
      published: 0,
      publishedToday: 0,
      errors: 0,
      companies: 0,
    },
    social: {
      facebookConnected: 0,
      instagramConnected: 0,
      totalConnections: 0,
    },
    upcoming: [],
    recent: [],
    connections: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboardData();

      setDashboard({
        stats: data.stats || {},
        social: data.social || {},
        upcoming: data.upcoming || [],
        recent: data.recent || [],
        connections: data.connections || [],
      });
    } catch (requestError) {
      console.error("Erro ao carregar dashboard:", requestError);

      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Não foi possível carregar o Dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const nextPost = dashboard.upcoming[0] || null;

  const connectedCompanies = useMemo(() => {
    return new Set(
      dashboard.connections
        .filter((connection) => connection.status === "CONNECTED")
        .map((connection) => connection.companyId)
    ).size;
  }, [dashboard.connections]);

  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="badge">OnePrime Social AI</span>

          <h2>{getGreeting()}, Wilian 👋</h2>

          <p>
            Acompanhe suas publicações, conexões sociais e próximos
            agendamentos em um único painel.
          </p>
        </div>

        <button
          className="primary"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar painel"}
        </button>
      </section>

      {error && (
        <section className="dashboard-error">
          <strong>Não foi possível carregar o painel</strong>
          <p>{error}</p>

          <button className="secondary" onClick={loadDashboard}>
            Tentar novamente
          </button>
        </section>
      )}

      <section className="stats-grid">
        <StatCard
          icon="📅"
          title="Posts agendados"
          value={dashboard.stats.scheduled || 0}
          subtitle="Aguardando publicação"
        />

        <StatCard
          icon="✅"
          title="Publicados hoje"
          value={dashboard.stats.publishedToday || 0}
          subtitle={`${dashboard.stats.published || 0} publicados no total`}
        />

        <StatCard
          icon="❌"
          title="Com erro"
          value={dashboard.stats.errors || 0}
          subtitle={
            dashboard.stats.errors > 0
              ? "Precisam de atenção"
              : "Nenhum erro encontrado"
          }
        />

        <StatCard
          icon="🏢"
          title="Empresas"
          value={dashboard.stats.companies || 0}
          subtitle={`${connectedCompanies} com redes conectadas`}
        />
      </section>

      <section className="social-summary-grid">
        <article className="social-summary-card">
          <div className="social-summary-icon">📘</div>

          <div>
            <span>Facebook</span>
            <strong>
              {dashboard.social.facebookConnected || 0} conectado(s)
            </strong>
          </div>
        </article>

        <article className="social-summary-card">
          <div className="social-summary-icon">📸</div>

          <div>
            <span>Instagram</span>
            <strong>
              {dashboard.social.instagramConnected || 0} conectado(s)
            </strong>
          </div>
        </article>

        <article className="social-summary-card">
          <div className="social-summary-icon">🚀</div>

          <div>
            <span>Publicando agora</span>
            <strong>{dashboard.stats.publishing || 0}</strong>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <UpcomingPost post={nextPost} />
        <QuickActions setView={setView} />
      </section>

      <section className="dashboard-content-grid">
        <article className="panel premium-panel">
          <div className="panel-title-row">
            <div>
              <h2>📅 Próximos agendamentos</h2>
              <p>As próximas publicações programadas.</p>
            </div>

            <button
              className="secondary"
              onClick={() => setView?.("agenda")}
            >
              Ver agenda
            </button>
          </div>

          {loading ? (
            <p>Carregando agendamentos...</p>
          ) : dashboard.upcoming.length === 0 ? (
            <div className="empty-dashboard-state">
              <span>📭</span>
              <strong>Nenhum post agendado</strong>
              <p>Crie um conteúdo e escolha uma data para publicação.</p>
            </div>
          ) : (
            <div className="dashboard-list">
              {dashboard.upcoming.map((post) => (
                <div className="dashboard-list-item" key={post.id}>
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt="Imagem da publicação"
                      className="dashboard-post-thumbnail"
                    />
                  ) : (
                    <div className="dashboard-post-placeholder">🖼️</div>
                  )}

                  <div className="dashboard-list-content">
                    <strong>
                      {post.title ||
                        post.caption?.slice(0, 70) ||
                        "Publicação sem título"}
                    </strong>

                    <span>
                      {post.company?.name || "Empresa não informada"}
                    </span>

                    <small>
                      {formatDate(post.scheduledAt)} • {post.network}
                    </small>
                  </div>

                  <span className="dashboard-status agendado">
                    Agendado
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel premium-panel">
          <div className="panel-title-row">
            <div>
              <h2>📝 Últimas atividades</h2>
              <p>Publicações concluídas ou que apresentaram erro.</p>
            </div>
          </div>

          {loading ? (
            <p>Carregando atividades...</p>
          ) : dashboard.recent.length === 0 ? (
            <div className="empty-dashboard-state">
              <span>📊</span>
              <strong>Nenhuma atividade registrada</strong>
              <p>As publicações aparecerão aqui após o processamento.</p>
            </div>
          ) : (
            <div className="dashboard-list">
              {dashboard.recent.map((post) => (
                <div className="dashboard-list-item" key={post.id}>
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt="Imagem da publicação"
                      className="dashboard-post-thumbnail"
                    />
                  ) : (
                    <div className="dashboard-post-placeholder">🖼️</div>
                  )}

                  <div className="dashboard-list-content">
                    <strong>
                      {post.title ||
                        post.caption?.slice(0, 70) ||
                        "Publicação sem título"}
                    </strong>

                    <span>
                      {post.company?.name || "Empresa não informada"}
                    </span>

                    <small>
                      {post.status === "PUBLICADO"
                        ? `Publicado em ${formatDate(post.publishedAt)}`
                        : post.lastError || "Falha durante a publicação"}
                    </small>
                  </div>

                  <span
                    className={`dashboard-status ${String(
                      post.status || ""
                    ).toLowerCase()}`}
                  >
                    {getStatusLabel(post.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}