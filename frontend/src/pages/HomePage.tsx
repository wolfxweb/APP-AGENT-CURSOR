import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const baseShortcuts: { label: string; hint: string; to?: string }[] = [
  { label: "Dados básicos", hint: "Registro mensal", to: "/basic-data" },
  { label: "Calculadora de preços", hint: "Margem e histórico", to: "/calculadora" },
  { label: "Diagnóstico", hint: "Análise por período", to: "/diagnostico" },
  { label: "Importância dos meses", hint: "Intensidade por mês e eventos", to: "/importancia-meses" },
  { label: "Categorias e produtos", hint: "Cadastro e vínculos", to: "/produtos" },
  { label: "Gestão de prioridades", hint: "Ranking do período", to: "/gestao-prioridades" },
  { label: "Simulador", hint: "Cenários e margens", to: "/simulador" },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user && !user.onboarding_completed) nav("/auth/onboarding", { replace: true });
  }, [loading, user, nav]);

  if (loading) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dash-wrap bd-shell-wide fade-in">
        <section className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
          <p
            style={{
              display: "inline-block",
              background: "rgba(1,57,44,0.08)",
              color: "var(--brand)",
              borderRadius: 999,
              padding: "0.25rem 0.65rem",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            SuccessWay
          </p>
          <h1 className="bd-card-heading" style={{ fontSize: "2rem", marginTop: "0.75rem" }}>
            Decida melhor com dados, margens e simulações.
          </h1>
          <p className="muted" style={{ maxWidth: 760, marginTop: "0.7rem", lineHeight: 1.55 }}>
            A plataforma reúne dados básicos, diagnóstico financeiro, gestão de prioridades, simulador de cenários e
            administração da operação em um fluxo simples para apoiar decisões do dia a dia.
          </p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: "1.15rem" }}>
            <Link to="/auth/register" className="btn-primary" style={{ textDecoration: "none" }}>
              Criar conta
            </Link>
            <Link to="/auth/login" className="btn-ghost" style={{ textDecoration: "none" }}>
              Entrar
            </Link>
          </div>
          <div className="metric-grid metric-grid--cols-3" style={{ marginTop: "1.1rem" }}>
            <div className="metric-card">
              <span className="metric-label">Diagnóstico</span>
              <span className="metric-value metric-value--secondary">Margens e insights por período</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Simulador</span>
              <span className="metric-value metric-value--secondary">Cenários com parâmetros ajustáveis</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Admin</span>
              <span className="metric-value metric-value--secondary">Usuários e licenças em um painel único</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!user.onboarding_completed) {
    return (
      <div className="dash-wrap">
        <p className="muted">Redirecionando…</p>
      </div>
    );
  }

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const shortcuts =
    user.access_level === "Administrador"
      ? [...baseShortcuts, { label: "Admin · Usuários", hint: "Gestão de contas", to: "/admin/users" }]
      : baseShortcuts;

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <header className="dash-header">
        <div>
          <p className="muted small">Olá,</p>
          <h1 className="dash-greet">{user.name}</h1>
          <p className="muted">{today}</p>
        </div>
      </header>

      <section className="shortcuts">
        {shortcuts.map((s) =>
          s.to ? (
            <Link key={s.label} to={s.to} className="shortcut-card" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="shortcut-title">{s.label}</span>
              <span className="shortcut-hint">{s.hint}</span>
            </Link>
          ) : (
            <div key={s.label} className="shortcut-card">
              <span className="shortcut-title">{s.label}</span>
              <span className="shortcut-hint">{s.hint}</span>
            </div>
          ),
        )}
      </section>
    </div>
  );
}
