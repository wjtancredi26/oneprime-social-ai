import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getCompanies } from "../services/companyService";

function formatDate(value) {
  if (!value) return "Não informado";

  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function isMetaConfigurationError(message = "") {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("meta_app_id") ||
    normalized.includes("meta_app_secret") ||
    normalized.includes("app id") ||
    normalized.includes("id do app") ||
    normalized.includes("não configurado")
  );
}

export default function Social() {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [connection, setConnection] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [metaSession, setMetaSession] = useState("");
  const [pendingPages, setPendingPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [loadingPages, setLoadingPages] = useState(false);
  const [savingPage, setSavingPage] = useState(false);

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (company) => String(company.id) === String(companyId)
      ) || null,
    [companies, companyId]
  );

  const facebookConnected = Boolean(
    connection?.status === "CONNECTED" &&
      connection?.facebookPageId
  );

  const instagramConnected = Boolean(
    connection?.status === "CONNECTED" &&
      connection?.instagramUserId
  );

  function showMessage(text, type = "info") {
    setMessage(text || "");
    setMessageType(type);
  }

  async function loadCompanies() {
    const items = await getCompanies();
    const companiesList = Array.isArray(items) ? items : [];

    setCompanies(companiesList);

    if (!companyId && companiesList[0]) {
      setCompanyId(String(companiesList[0].id));
    }
  }

  async function loadStatus(selectedCompanyId = companyId) {
    if (!selectedCompanyId) {
      setConnection(null);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.get("/meta/status", {
        params: {
          companyId: Number(selectedCompanyId),
        },
      });

      setConnection(data.connection || null);
    } catch (error) {
      setConnection(null);

      showMessage(
        error.message ||
          "Não foi possível verificar a conexão com a Meta.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function connectMeta() {
    if (!companyId) {
      showMessage(
        "Selecione uma empresa antes de conectar as redes sociais.",
        "warning"
      );
      return;
    }

    setConnecting(true);
    setMessage("");

    try {
      const { data } = await api.post("/meta/connect-url", {
        companyId: Number(companyId),
      });

      if (!data?.url) {
        throw new Error(
          "O servidor não retornou a URL de conexão da Meta."
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      const errorMessage =
        error.message ||
        "Não foi possível iniciar a conexão com a Meta.";

      if (isMetaConfigurationError(errorMessage)) {
        showMessage(
          "O aplicativo da Meta ainda não está configurado. Assim que o Meta App ID e o Meta App Secret forem cadastrados no Railway, este botão abrirá o login oficial do Facebook e Instagram.",
          "warning"
        );
      } else {
        showMessage(errorMessage, "error");
      }

      setConnecting(false);
    }
  }

  async function loadPendingPages(sessionToken) {
    if (!sessionToken) return;

    setLoadingPages(true);
    setMessage("");

    try {
      const { data } = await api.get("/meta/pending-pages", {
        params: { session: sessionToken },
      });

      const pages = Array.isArray(data.pages) ? data.pages : [];
      setPendingPages(pages);
      setMetaSession(sessionToken);

      if (data.companyId) {
        setCompanyId(String(data.companyId));
      }

      if (pages.length === 1) {
        setSelectedPageId(String(pages[0].id));
      }

      if (data.missingPermissions?.length) {
        showMessage(
          `A Meta não concedeu todas as permissões: ${data.missingPermissions.join(", ")}. A conexão pode ficar limitada.`,
          "warning"
        );
      } else {
        showMessage(
          "Escolha abaixo a Página do Facebook que será usada por esta empresa.",
          "info"
        );
      }
    } catch (error) {
      showMessage(error.message || "Não foi possível carregar as Páginas da Meta.", "error");
    } finally {
      setLoadingPages(false);
    }
  }

  async function confirmSelectedPage() {
    if (!metaSession || !selectedPageId) {
      showMessage("Escolha uma Página antes de continuar.", "warning");
      return;
    }

    setSavingPage(true);
    setMessage("");

    try {
      const { data } = await api.post("/meta/select-page", {
        session: metaSession,
        pageId: selectedPageId,
      });

      setConnection(data.connection || null);
      setPendingPages([]);
      setMetaSession("");
      setSelectedPageId("");
      showMessage(data.message || "Conexão Meta concluída com sucesso.", "success");
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      showMessage(error.message || "Não foi possível salvar a Página escolhida.", "error");
    } finally {
      setSavingPage(false);
    }
  }

  async function disconnectMeta() {
    if (!companyId) return;

    const confirmed = window.confirm(
      `Deseja desconectar o Facebook e o Instagram de ${
        selectedCompany?.name || "esta empresa"
      }?`
    );

    if (!confirmed) return;

    setDisconnecting(true);
    setMessage("");

    try {
      await api.delete("/meta/disconnect", {
        data: {
          companyId: Number(companyId),
        },
      });

      setConnection(null);

      showMessage(
        "Facebook e Instagram foram desconectados desta empresa.",
        "success"
      );
    } catch (error) {
      showMessage(
        error.message ||
          "Não foi possível desconectar as redes sociais.",
        "error"
      );
    } finally {
      setDisconnecting(false);
    }
  }

  useEffect(() => {
    loadCompanies().catch((error) => {
      showMessage(
        error.message || "Não foi possível carregar as empresas.",
        "error"
      );
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaResult = params.get("meta");
    const sessionToken = params.get("metaSession");
    const callbackCompanyId = params.get("companyId");
    const callbackMessage = params.get("message");

    if (callbackCompanyId) setCompanyId(callbackCompanyId);

    if (metaResult === "select_page" && sessionToken) {
      loadPendingPages(sessionToken);
      return;
    }

    if (metaResult === "error") {
      showMessage(callbackMessage || "A Meta não concluiu a autorização.", "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (metaResult === "invalid_callback") {
      showMessage("O retorno da Meta foi inválido. Tente conectar novamente.", "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (companyId && !metaSession) {
      loadStatus(companyId);
    } else if (!companyId) {
      setConnection(null);
    }
  }, [companyId, metaSession]);

  return (
    <section className="social-page">
      <header className="social-page-header">
        <div>
          <span className="badge">Integração Meta</span>

          <h1>Redes Sociais</h1>

          <p>
            Conecte o Facebook e o Instagram profissional de cada
            empresa para publicar agora ou agendar conteúdos.
          </p>
        </div>

        <button
          className="secondary"
          onClick={() => loadStatus(companyId)}
          disabled={!companyId || loading}
        >
          {loading ? "Atualizando..." : "Atualizar conexão"}
        </button>
      </header>

      <section className="social-company-selector">
        <label htmlFor="social-company">
          Empresa
        </label>

        <select
          id="social-company"
          value={companyId}
          onChange={(event) => {
            setCompanyId(event.target.value);
            setMessage("");
          }}
        >
          <option value="">Selecione uma empresa</option>

          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        {selectedCompany && (
          <small>
            As contas conectadas serão usadas somente nas
            publicações de <strong>{selectedCompany.name}</strong>.
          </small>
        )}
      </section>

      {message && (
        <div className={`social-message ${messageType}`}>
          <strong>
            {messageType === "success" && "Concluído"}
            {messageType === "error" && "Não foi possível concluir"}
            {messageType === "warning" && "Atenção"}
            {messageType === "info" && "Informação"}
          </strong>

          <p>{message}</p>
        </div>
      )}

      {!companyId ? (
        <section className="social-empty-state">
          <span>🏢</span>
          <h2>Selecione uma empresa</h2>
          <p>
            Escolha uma empresa acima para consultar ou configurar
            suas redes sociais.
          </p>
        </section>
      ) : loading ? (
        <section className="social-empty-state">
          <span className="social-loading-icon">⏳</span>
          <h2>Carregando conexão</h2>
          <p>Estamos verificando as contas vinculadas.</p>
        </section>
      ) : (
        <>
          {(loadingPages || pendingPages.length > 0) && (
            <section className="social-actions-panel" style={{ marginBottom: 24 }}>
              <div style={{ width: "100%" }}>
                <h2>Escolha a Página do Facebook</h2>
                <p>
                  Selecione a Página que será conectada a <strong>{selectedCompany?.name || "esta empresa"}</strong>.
                  O Instagram profissional vinculado será identificado automaticamente.
                </p>

                {loadingPages ? (
                  <p>Carregando as Páginas autorizadas...</p>
                ) : (
                  <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                    {pendingPages.map((page) => (
                      <label
                        key={page.id}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          padding: 16,
                          border: selectedPageId === String(page.id)
                            ? "2px solid currentColor"
                            : "1px solid rgba(148, 163, 184, .35)",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="meta-page"
                          value={page.id}
                          checked={selectedPageId === String(page.id)}
                          onChange={(event) => setSelectedPageId(event.target.value)}
                        />
                        <span>
                          <strong style={{ display: "block" }}>{page.name}</strong>
                          <small>
                            Facebook ID: {page.id}
                            {page.instagramUsername
                              ? ` • Instagram: @${page.instagramUsername}`
                              : " • Sem Instagram profissional vinculado"}
                          </small>
                        </span>
                      </label>
                    ))}

                    <button
                      className="primary"
                      onClick={confirmSelectedPage}
                      disabled={!selectedPageId || savingPage}
                    >
                      {savingPage ? "Salvando conexão..." : "Conectar Página selecionada"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="social-status-summary">
            <div>
              <span>Status da empresa</span>

              <strong>
                {facebookConnected || instagramConnected
                  ? "Redes parcialmente ou totalmente conectadas"
                  : "Nenhuma rede conectada"}
              </strong>
            </div>

            <span
              className={`connection-status ${
                facebookConnected || instagramConnected
                  ? "connected"
                  : "disconnected"
              }`}
            >
              {facebookConnected || instagramConnected
                ? "Conectado"
                : "Desconectado"}
            </span>
          </section>

          <section className="social-cards-grid">
            <article className="social-network-card">
              <div className="social-network-card-header">
                <div className="social-network-brand">
                  <span className="social-network-icon facebook">
                    f
                  </span>

                  <div>
                    <h2>Facebook</h2>
                    <p>Página comercial da empresa</p>
                  </div>
                </div>

                <span
                  className={`connection-status ${
                    facebookConnected
                      ? "connected"
                      : "disconnected"
                  }`}
                >
                  {facebookConnected
                    ? "Conectado"
                    : "Não conectado"}
                </span>
              </div>

              <div className="social-network-content">
                {facebookConnected ? (
                  <>
                    <div className="social-information-row">
                      <span>Página</span>
                      <strong>
                        {connection.facebookPageName ||
                          "Página sem nome"}
                      </strong>
                    </div>

                    <div className="social-information-row">
                      <span>Identificação</span>
                      <strong>
                        {connection.facebookPageId}
                      </strong>
                    </div>

                    <div className="social-information-row">
                      <span>Última atualização</span>
                      <strong>
                        {formatDate(
                          connection.updatedAt ||
                            connection.connectedAt
                        )}
                      </strong>
                    </div>
                  </>
                ) : (
                  <div className="social-network-empty">
                    <span>📘</span>
                    <strong>Facebook não conectado</strong>
                    <p>
                      Conecte uma Página que você administra para
                      permitir publicações.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <article className="social-network-card">
              <div className="social-network-card-header">
                <div className="social-network-brand">
                  <span className="social-network-icon instagram">
                    ◎
                  </span>

                  <div>
                    <h2>Instagram</h2>
                    <p>Conta profissional vinculada à Página</p>
                  </div>
                </div>

                <span
                  className={`connection-status ${
                    instagramConnected
                      ? "connected"
                      : "disconnected"
                  }`}
                >
                  {instagramConnected
                    ? "Conectado"
                    : "Não conectado"}
                </span>
              </div>

              <div className="social-network-content">
                {instagramConnected ? (
                  <>
                    <div className="social-information-row">
                      <span>Perfil</span>
                      <strong>
                        {connection.instagramUsername
                          ? `@${connection.instagramUsername}`
                          : "Conta profissional"}
                      </strong>
                    </div>

                    <div className="social-information-row">
                      <span>Identificação</span>
                      <strong>
                        {connection.instagramUserId}
                      </strong>
                    </div>

                    <div className="social-information-row">
                      <span>Publicação automática</span>
                      <strong>Disponível</strong>
                    </div>
                  </>
                ) : (
                  <div className="social-network-empty">
                    <span>📸</span>
                    <strong>Instagram não conectado</strong>
                    <p>
                      É necessária uma conta profissional vinculada
                      à Página do Facebook.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </section>

          {connection?.lastError && (
            <section className="social-last-error">
              <strong>Último erro registrado</strong>
              <p>{connection.lastError}</p>
            </section>
          )}

          <section className="social-actions-panel">
            <div>
              <h2>
                {connection
                  ? "Gerenciar conexão Meta"
                  : "Conectar Facebook e Instagram"}
              </h2>

              <p>
                A autorização será feita diretamente pela tela
                oficial da Meta. O sistema não recebe a senha do
                cliente.
              </p>
            </div>

            <div className="social-actions">
              <button
                className="primary"
                onClick={connectMeta}
                disabled={connecting || disconnecting}
              >
                {connecting
                  ? "Abrindo Meta..."
                  : connection
                    ? "Reconectar Meta"
                    : "Conectar Facebook e Instagram"}
              </button>

              {connection && (
                <button
                  className="danger-button"
                  onClick={disconnectMeta}
                  disabled={connecting || disconnecting}
                >
                  {disconnecting
                    ? "Desconectando..."
                    : "Desconectar"}
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}