import { useState } from "react";
import "./styles.css";

import Login from "./components/Login";

import DashboardLayout from "./layouts/DashboardLayoutV2";

import Dashboard from "./pages/Dashboard";
import Creator from "./pages/Creator";
import Agenda from "./pages/Agenda";
import Social from "./pages/Social";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Companies from "./pages/Companies";

export default function App() {
  const [logged, setLogged] = useState(false);
  const [view, setView] = useState("dashboard");

  if (!logged) {
    return <Login onLogin={() => setLogged(true)} />;
  }

  return (
    <DashboardLayout setView={setView} view={view}>
      {view === "dashboard" && <Dashboard setView={setView} />}
      {view === "creator" && <Creator />}
      {view === "agenda" && <Agenda />}
      {view === "companies" && <Companies />}
      {view === "social" && <Social />}
      {view === "analytics" && <Analytics />}
      {view === "settings" && <Settings />}
    </DashboardLayout>
  );
}