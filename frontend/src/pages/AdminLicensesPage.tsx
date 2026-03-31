import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { AdminLicenseRow } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export default function AdminLicensesPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<AdminLicenseRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboarding_completed) nav("/auth/onboarding", { replace: true });
    else if (user.access_level !== "Administrador") nav("/", { replace: true });
  }, [loading, user, nav]);

  async function loadList() {
    setPending(true);
    setErr(null);
    try {
      setItems(await apiJson<AdminLicenseRow[]>("/admin/licenses"));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao carregar licenças");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (!user || user.access_level !== "Administrador") return;
    void loadList();
  }, [user]);

  async function onCreate() {
    try {
      await apiJson("/admin/create-license", { method: "POST" });
      await loadList();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao criar licença");
    }
  }

  if (loading || !user?.onboarding_completed) {
    return <div className="dash-wrap"><p className="muted">Carregando…</p></div>;
  }

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>← Início</Link>
        <header className="dash-header" style={{ marginTop: "0.5rem" }}>
          <div>
            <h1 className="bd-card-heading">Admin · Licenças</h1>
            <p className="muted" style={{ marginTop: "0.35rem" }}>Gestão de chaves de ativação (8 caracteres).</p>
          </div>
        </header>

        <div className="auth-card auth-card--full admin-panel" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
            <button className="btn-primary" onClick={() => void onCreate()}>Gerar licença</button>
            <Link to="/admin/users" className="btn-ghost">Usuários</Link>
          </div>
          {err ? <div className="alert">{err}</div> : null}
          {pending ? <p className="muted">Carregando licenças…</p> : null}
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Chave</th>
                  <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                  <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>E-mail ativação</th>
                  <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Data ativação</th>
                  <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id} style={{ borderTop: "1px solid rgba(1,57,44,0.12)" }}>
                    <td style={{ padding: "0.6rem 0.5rem", fontFamily: "monospace", letterSpacing: "0.08em" }}>{x.activation_key}</td>
                    <td style={{ padding: "0.6rem 0.5rem" }}>
                      <span className={x.status === "Disponível" ? "admin-badge admin-badge--ok" : "admin-badge admin-badge--warn"}>
                        {x.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.5rem" }}>{x.activation_email ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.5rem" }}>{x.activation_date ? new Date(x.activation_date).toLocaleString("pt-BR") : "—"}</td>
                    <td style={{ padding: "0.6rem 0.5rem" }}>{new Date(x.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
