import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import OnePrimeAI from "../components/OnePrimeAI";

export default function DashboardLayout({ children, setView }) {
  return (
    <div className="dashboard-layout">
      <Sidebar setView={setView} />

      <main className="main">
        <Header setView={setView} />
        {children}
      </main>

      <OnePrimeAI />
    </div>
  );
}