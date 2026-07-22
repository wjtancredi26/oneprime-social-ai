import { useMemo, useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const resetToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("resetToken") || "";
  }, []);

  const [mode, setMode] = useState(
    resetToken ? "reset" : "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      const token = data?.data?.token;
      const user = data?.data?.user;

      if (!token) {
        throw new Error(
          "O servidor não retornou o token de acesso."
        );
      }

      localStorage.setItem("oneprime_token", token);
      localStorage.setItem(
        "oneprime_user",
        JSON.stringify(user || {})
      );

      onLogin(user);
    } catch (requestError) {
      setError(
        requestError.message || "Não foi possível entrar."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { data } = await api.post(
        "/auth/forgot-password",
        { email }
      );

      setSuccess(
        data.message ||
          "Confira seu e-mail para continuar."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Não foi possível enviar as instruções."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    resetMessages();

    if (password !== passwordConfirmation) {
      setError("As senhas informadas não são iguais.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        "/auth/reset-password",
        {
          token: resetToken,
          password,
          passwordConfirmation,
        }
      );

      setSuccess(data.message);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setPassword("");
      setPasswordConfirmation("");

      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 2200);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Não foi possível redefinir a senha."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={
          mode === "login"
            ? handleLogin
            : mode === "forgot"
              ? handleForgotPassword
              : handleResetPassword
        }
      >
        <div className="logo">
          OnePrime <span>Social AI</span>
        </div>

        {mode === "login" && (
          <>
            <h1>Entrar no sistema</h1>

            <p>
              Gerencie conteúdos, IA, Instagram e Facebook
              em um só lugar.
            </p>

            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />

            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </>
        )}

        {mode === "forgot" && (
          <>
            <h1>Recuperar senha</h1>

            <p>
              Informe seu e-mail. Você receberá um link
              para cadastrar uma nova senha.
            </p>

            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </>
        )}

        {mode === "reset" && (
          <>
            <h1>Cadastrar nova senha</h1>

            <p>
              Digite e confirme a nova senha para acessar o
              OnePrime Social AI.
            </p>

            <input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
            />

            <input
              type="password"
              placeholder="Confirme a nova senha"
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
            />
          </>
        )}

        {error && (
          <p className="error-message">{error}</p>
        )}

        {success && (
          <p className="success-message">{success}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? "Processando..."
            : mode === "login"
              ? "Entrar"
              : mode === "forgot"
                ? "Enviar link por e-mail"
                : "Salvar nova senha"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            className="login-link-button"
            onClick={() => {
              resetMessages();
              setMode("forgot");
            }}
          >
            Esqueci minha senha
          </button>
        )}

        {mode === "forgot" && (
          <button
            type="button"
            className="login-link-button"
            onClick={() => {
              resetMessages();
              setMode("login");
            }}
          >
            Voltar para o login
          </button>
        )}
      </form>
    </div>
  );
}