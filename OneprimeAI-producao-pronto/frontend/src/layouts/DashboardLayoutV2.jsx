import Sidebar from "../components/Sidebar";
import OnePrimeAI from "../components/OnePrimeAI";

export default function DashboardLayoutV2({ children, setView, view }) {
  return (
    <div className="app-v2">
      <Sidebar setView={setView} activeView={view} />

      <div className="content-v2">
        <header className="topbar-v2">
          <div>
            <span className="badge">OnePrime Social AI v2</span>
            <h1>Centro de Marketing Inteligente</h1>
            <p>Crie, agende e acompanhe campanhas com IA.</p>
          </div>

          <button className="primary" onClick={() => setView("dashboard")}>
            Dashboard
          </button>
        </header>

        <main className="page-v2">{children}</main>
      </div>

      <OnePrimeAI />
    </div>
  );
}