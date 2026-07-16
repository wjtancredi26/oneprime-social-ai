import { useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      const token = data?.data?.token;
      const user = data?.data?.user;

      if (!token) throw new Error("O servidor não retornou o token de acesso.");

      localStorage.setItem("oneprime_token", token);
      localStorage.setItem("oneprime_user", JSON.stringify(user || {}));
      onLogin(user);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo">
          OnePrime <span>Social AI</span>
        </div>

        <h1>Entrar no sistema</h1>
        <p>Gerencie conteúdos, IA, Instagram e Facebook em um só lugar.</p>

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
