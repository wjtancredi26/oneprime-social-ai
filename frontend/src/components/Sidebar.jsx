export default function Sidebar({ setView }) {
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

      <div
        style={{
          marginTop: "auto",
          padding: "18px",
          fontSize: "12px",
          opacity: 0.7,
          textAlign: "center",
        }}
      >
        OnePrime Social AI
        <br />
        <small>Versão 1.0 MVP</small>
      </div>
    </aside>
  );
}