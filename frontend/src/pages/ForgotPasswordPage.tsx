import { useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "../api/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      const r = await apiJson<{ detail: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMsg(r.detail);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao enviar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell fade-in">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar senha</h1>
        <p className="auth-sub">
          Informe seu e-mail. Se houver cadastro, enviaremos o link de
          redefinição (verifique também o spam).
        </p>
        <form onSubmit={onSubmit} className="stack">
          {err && (
            <div className="alert" role="alert">
              {err}
            </div>
          )}
          {msg && (
            <div
              className="alert"
              style={{
                background: "rgba(1, 57, 44, 0.08)",
                color: "rgb(1, 57, 44)",
              }}
              role="status"
            >
              {msg}
            </div>
          )}
          <label className="label">
            E-mail
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Enviando…" : "Enviar link"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/auth/login">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
