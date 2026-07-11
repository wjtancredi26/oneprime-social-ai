export default function QuickActions({ setView }) {
  return (
    <div className="panel premium-panel">
      <h2>⚡ Atalhos rápidos</h2>

      <div className="quick-actions">
        <button onClick={() => setView("creator")}>🤖 Criar Conteúdo</button>
        <button onClick={() => setView("creator")}>🎨 Gerar Imagem</button>
        <button onClick={() => setView("agenda")}>📅 Ver Agenda</button>
        <button onClick={() => setView("analytics")}>📊 Analytics</button>
      </div>
    </div>
  );
}