export default function Sidebar({ setView }) {
  function handleLogout() {
    const confirmed = window.confirm(
      "Deseja realmente sair do OnePrime Social AI?"
    );

    if (!confirmed) return;

    localStorage.removeItem("oneprime_token");
    localStorage.removeItem("oneprime_user");

    window.location.href = "/";
  }

  return (
    <aside className="sidebar">
      <div className="logo">
        OnePrime <span>Social AI</span>
      </div>

      <nav>
        <button onClick={() => setView("dashboard")}>
          🏠 Dashboard
        </button>

        <button onClick={() => setView("creator")}>
          🤖 OnePrime AI
        </button>

        <button onClick={() => setView("agenda")}>
          📅 Agenda
        </button>

        <button onClick={() => setView("companies")}>
          🏢 Empresas
        </button>

        <button onClick={() => setView("social")}>
          📱 Redes Sociais
        </button>

        <button onClick={() => setView("analytics")}>
          📊 Analytics
        </button>

        <button onClick={() => setView("settings")}>
          ⚙️ Configurações
        </button>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout-button"
          onClick={handleLogout}
        >
          🚪 Sair do sistema
        </button>

        <div className="sidebar-version">
          OnePrime Social AI
          <br />
          <small>Versão 1.0 MVP</small>
        </div>
      </div>
    </aside>
  );
}