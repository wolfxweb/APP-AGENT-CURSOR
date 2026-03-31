import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { UserMe } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await apiJson<UserMe>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      nav("/", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha no login");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell fade-in">
      <div className="auth-card">
        <h1 className="auth-title">Entrar</h1>
        <p className="auth-sub">Acesse sua conta SuccessWay</p>
        <form onSubmit={onSubmit} className="stack">
          {err && (
            <div className="alert" role="alert">
              {err}
            </div>
          )}
          <label className="label">
            E-mail
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="label">
            Senha
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/auth/forgot-password">Esqueci minha senha</Link>
          {" · "}
          <Link to="/auth/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
