import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { AdminUsersPageOut } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activityType, setActivityType] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersPageOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboarding_completed) nav("/auth/onboarding", { replace: true });
    else if (user.access_level !== "Administrador") nav("/", { replace: true });
  }, [loading, user, nav]);

  const qs = useMemo(() => {
    const p = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (email.trim()) p.set("email", email.trim());
    if (statusFilter) p.set("status", statusFilter);
    if (activityType) p.set("activity_type", activityType);
    return p.toString();
  }, [page, email, statusFilter, activityType]);

  useEffect(() => {
    if (!user || user.access_level !== "Administrador") return;
    let cancelled = false;
    void (async () => {
      setPending(true);
      setErr(null);
      try {
        const out = await apiJson<AdminUsersPageOut>(`/admin/users?${qs}`);
        if (!cancelled) setData(out);
      } catch (ex) {
        if (!cancelled) setErr(ex instanceof Error ? ex.message : "Erro ao carregar usuários");
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qs, user]);

  async function onPatch(userId: number, body: { status?: string; access_level?: string }) {
    try {
      await apiJson(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const out = await apiJson<AdminUsersPageOut>(`/admin/users?${qs}`);
      setData(out);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao atualizar usuário");
    }
  }

  if (loading || !user?.onboarding_completed) {
    return <div className="dash-wrap"><p className="muted">Carregando…</p></div>;
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const statusBadgeClass = (status: string) =>
    status === "Ativo" ? "admin-badge admin-badge--ok" : "admin-badge admin-badge--warn";
  const accessBadgeClass = (level: string) =>
    level === "Administrador" ? "admin-badge admin-badge--admin" : "admin-badge";

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>← Início</Link>
        <header className="dash-header" style={{ marginTop: "0.5rem" }}>
          <div>
            <h1 className="bd-card-heading">Admin · Usuários</h1>
            <p className="muted" style={{ marginTop: "0.35rem" }}>Filtros e paginação com ações rápidas de status e acesso.</p>
          </div>
        </header>

        <div className="auth-card auth-card--full admin-panel" style={{ marginTop: "1rem" }}>
          <div className="metric-grid metric-grid--cols-3" style={{ marginBottom: "0.9rem" }}>
            <label className="label">Email
              <input className="input" value={email} onChange={(e) => { setPage(1); setEmail(e.target.value); }} />
            </label>
            <label className="label">Status
              <select className="input" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
            <label className="label">Tipo de atividade
              <select className="input" value={activityType} onChange={(e) => { setPage(1); setActivityType(e.target.value); }}>
                <option value="">Todos</option>
                <option value="Serviços">Serviços</option>
                <option value="Comércio">Comércio</option>
                <option value="Indústria">Indústria</option>
              </select>
            </label>
          </div>

          {err ? <div className="alert">{err}</div> : null}
          {pending ? <p className="muted">Carregando usuários…</p> : null}

          {data ? (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Nome</th>
                    <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Email</th>
                    <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Atividade</th>
                    <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                    <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Acesso</th>
                    <th className="muted small" style={{ textAlign: "left", padding: "0.5rem" }}>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id} style={{ borderTop: "1px solid rgba(1,57,44,0.12)" }}>
                      <td style={{ padding: "0.6rem 0.5rem" }}>{u.name}</td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>{u.email}</td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>{u.activity_type}</td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <button className="btn-ghost" onClick={() => void onPatch(u.id, { status: u.status === "Ativo" ? "Inativo" : "Ativo" })}>
                          <span className={statusBadgeClass(u.status)}>{u.status}</span>
                        </button>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <button className="btn-ghost" onClick={() => void onPatch(u.id, { access_level: u.access_level === "Administrador" ? "Cliente" : "Administrador" })}>
                          <span className={accessBadgeClass(u.access_level)}>{u.access_level}</span>
                        </button>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.9rem" }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span className="muted small">Página {page} de {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            <Link to="/admin/licenses" className="btn-ghost" style={{ marginLeft: "auto" }}>Licenças</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
