import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiJson } from "../api/http";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!token) {
      setErr("Link inválido. Solicite um novo e-mail de recuperação.");
      return;
    }
    setPending(true);
    try {
      const r = await apiJson<{ detail: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          new_password: password,
          confirm_password: confirm,
        }),
      });
      setMsg(r.detail);
      setTimeout(() => nav("/auth/login", { replace: true }), 1500);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Não foi possível redefinir");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell fade-in">
      <div className="auth-card">
        <h1 className="auth-title">Nova senha</h1>
        <p className="auth-sub">Defina uma senha forte (mínimo 8 caracteres).</p>
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
            Nova senha
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="label">
            Confirmar senha
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Redefinir senha"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/auth/login">Ir para login</Link>
        </p>
      </div>
    </div>
  );
}
