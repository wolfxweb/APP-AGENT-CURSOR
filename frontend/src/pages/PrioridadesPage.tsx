import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicData, PrioridadeItemOut } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import BasicDataScreenNav from "../components/basicData/ScreenNav";

const monthsPt = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function eixoLabel(e: string): string {
  const m: Record<string, string> = {
    dados: "Dados",
    financeiro: "Financeiro",
    operacional: "Operacional",
    comercial: "Comercial",
  };
  return m[e] ?? e;
}

export default function PrioridadesPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<BasicData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [items, setItems] = useState<PrioridadeItemOut[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadPending, setLoadPending] = useState(false);
  const initSel = useRef(false);

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    void (async () => {
      try {
        const bd = await apiJson<BasicData[]>("/basic-data");
        setRows(bd);
      } catch {
        setErr("Falha ao carregar dados básicos.");
      }
    })();
  }, [loading, user]);

  useEffect(() => {
    if (!rows.length || initSel.current) return;
    initSel.current = true;
    const cur = rows.find((r) => r.is_current);
    setSelectedId(String((cur ?? rows[0]).id));
  }, [rows]);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboarding_completed) nav("/auth/onboarding", { replace: true });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!selectedId || loading || !user?.onboarding_completed) return;
    let c = false;
    void (async () => {
      setLoadPending(true);
      setErr(null);
      try {
        const list = await apiJson<PrioridadeItemOut[]>(`/prioridades?basic_data_id=${selectedId}`);
        if (!c) setItems(list);
      } catch (ex) {
        if (!c) setErr(ex instanceof Error ? ex.message : "Erro ao carregar prioridades");
        if (!c) setItems(null);
      } finally {
        if (!c) setLoadPending(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [selectedId, loading, user]);

  if (loading || !user?.onboarding_completed) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  const onlyIncomplete =
    items?.length === 1 && items[0].codigo === "dados_incompletos";

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>
          ← Início
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Gestão de prioridades</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Ranking sugerido com base no diagnóstico do período e na importância do mês, quando houver cadastro.
            </p>
          </div>
        </header>

        <BasicDataScreenNav />

        {rows.length === 0 ? (
          <div className="shortcut-card" style={{ marginTop: "1rem" }}>
            <p>Cadastre pelo menos um mês de dados básicos para ver as prioridades.</p>
            <Link to="/basic-data/new" className="btn-primary inline-block">
              Novo registro
            </Link>
          </div>
        ) : (
          <>
            <div className="bd-filter-section" style={{ marginTop: "1rem" }}>
              <label className="label" style={{ maxWidth: 480 }}>
                Período dos dados básicos
                <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Selecione…</option>
                  {rows.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {monthsPt[r.month - 1]} / {r.year}
                      {r.is_current ? " (atual)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {err ? <div className="alert">{err}</div> : null}
            {loadPending ? <p className="muted">Atualizando…</p> : null}

            {items && selectedId && !loadPending ? (
              <div className="prioridades-stack fade-in" style={{ marginTop: "1.25rem" }}>
                {onlyIncomplete ? (
                  <div className="auth-card auth-card--full" style={{ borderLeft: "4px solid #ca8a04" }}>
                    <h2 className="bd-card-heading" style={{ fontSize: "1.1rem", margin: "0 0 0.5rem" }}>
                      {items[0].titulo}
                    </h2>
                    <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                      {items[0].descricao}
                    </p>
                    <Link to="/basic-data/new" className="btn-primary inline-block" style={{ marginTop: "1rem" }}>
                      Completar dados básicos
                    </Link>
                  </div>
                ) : (
                  <ol className="prioridades-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {items.map((it) => {
                    const barPct = Math.min(100, Math.max(4, it.score));
                    return (
                      <li
                        key={`${it.codigo}-${it.ordem}`}
                        className="prioridade-card"
                        style={{
                          marginBottom: "0.85rem",
                          padding: "1rem 1.1rem",
                          borderRadius: "var(--radius)",
                          background: "var(--surface)",
                          boxShadow: "var(--shadow)",
                          border: "1px solid rgba(1, 57, 44, 0.08)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="prioridade-rank"
                          style={{
                            position: "absolute",
                            top: "0.65rem",
                            right: "0.85rem",
                            fontFamily: '"Fraunces", Georgia, serif',
                            fontWeight: 600,
                            fontSize: "2rem",
                            color: "rgba(1, 57, 44, 0.12)",
                            lineHeight: 1,
                          }}
                          aria-hidden
                        >
                          {it.ordem}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: "var(--brand-mid)",
                              background: "rgba(1, 57, 44, 0.08)",
                              padding: "0.2rem 0.55rem",
                              borderRadius: 999,
                            }}
                          >
                            {eixoLabel(it.eixo)}
                          </span>
                          <span className="muted small">Prioridade #{it.ordem}</span>
                          <span className="muted small" style={{ marginLeft: "auto" }}>
                            Pontuação · {it.score.toFixed(0)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 999,
                            background: "rgba(1, 57, 44, 0.1)",
                            marginBottom: "0.65rem",
                            overflow: "hidden",
                          }}
                          aria-hidden
                        >
                          <div
                            style={{
                              width: `${barPct}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: "linear-gradient(90deg, var(--brand), var(--brand-mid))",
                              transition: "width 0.45s ease-out",
                            }}
                          />
                        </div>
                        <h2 className="bd-card-heading" style={{ fontSize: "1.05rem", margin: "0 0 0.4rem", paddingRight: "2.5rem" }}>
                          {it.titulo}
                        </h2>
                        <p className="muted" style={{ margin: 0, lineHeight: 1.55, fontSize: "0.95rem" }}>
                          {it.descricao}
                        </p>
                      </li>
                    );
                  })}
                  </ol>
                )}
                {!onlyIncomplete ? (
                  <p className="muted small" style={{ marginTop: "1rem", lineHeight: 1.5 }}>
                    A lista é uma heurística de apoio à decisão, derivada dos indicadores do período. Ajuste cadastros e
                    use o simulador para explorar cenários.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
