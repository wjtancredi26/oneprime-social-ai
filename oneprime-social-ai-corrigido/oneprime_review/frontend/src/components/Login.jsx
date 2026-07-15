export default function Login({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          OnePrime <span>Social AI</span>
        </div>

        <h1>Entrar no sistema</h1>

        <p>Gerencie conteúdos, IA, Instagram e Facebook em um só lugar.</p>

        <input type="email" placeholder="Seu e-mail" />
        <input type="password" placeholder="Sua senha" />

        <button onClick={onLogin}>Entrar</button>

        <small>Esqueci minha senha</small>
      </div>
    </div>
  );
}