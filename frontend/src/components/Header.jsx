export default function Header({ setView }) {
  return (
    <header>
      <div>
        <h1>Olá, Wilian 👋</h1>
        <p>Seu assistente de marketing com IA está pronto.</p>
      </div>

      <button className="primary" onClick={() => setView("creator")}>
        + Criar Conteúdo
      </button>
    </header>
  );
}