import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicData, DiagnosticoOut } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import BasicDataScreenNav from "../components/basicData/ScreenNav";
import { isWholesaleRetailCommerce } from "../components/basicData/activity";
import { buildLegacyDiagnosticNarrative } from "../services/diagnosticoNarrativaLegacy";

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

function healthLabelPt(h: string): string {
  const m: Record<string, string> = {
    bom: "Bom",
    atencao: "Atenção",
    critico: "Crítico",
    sem_dados: "Sem dados",
  };
  return m[h] ?? h;
}

export default function DiagnosticoPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<BasicData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState<DiagnosticoOut | null>(null);
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
        const d = await apiJson<DiagnosticoOut>(`/diagnostico?basic_data_id=${selectedId}`);
        if (!c) setData(d);
      } catch (ex) {
        if (!c) setErr(ex instanceof Error ? ex.message : "Erro ao carregar diagnóstico");
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

  const showCommerceHint = user && isWholesaleRetailCommerce(user.activity_type);

  const selectedBasic = useMemo(
    () => rows.find((r) => String(r.id) === selectedId),
    [rows, selectedId],
  );

  const legacyNarrative = useMemo(() => {
    if (!selectedBasic || !user) return null;
    return buildLegacyDiagnosticNarrative(selectedBasic, user.activity_type, user.name);
  }, [selectedBasic, user]);

  function narrativeBorder(tone: string | undefined): string {
    switch (tone) {
      case "danger":
        return "4px solid var(--danger-text, #b91c1c)";
      case "warning":
        return "4px solid #ca8a04";
      case "success":
        return "4px solid #15803d";
      default:
        return "4px solid var(--brand-mid, rgb(1, 57, 44))";
    }
  }

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>
          ← Início
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Diagnóstico</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Indicadores e leituras com base nos dados básicos do período selecionado.
            </p>
          </div>
        </header>

        <BasicDataScreenNav />

        {rows.length === 0 ? (
          <div className="shortcut-card" style={{ marginTop: "1rem" }}>
            <p>Cadastre pelo menos um mês de dados básicos para ver o diagnóstico.</p>
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

            {data && selectedId && !loadPending ? (
              <div className="fade-in">
                {showCommerceHint ? (
                  <p className="muted" style={{ fontSize: "0.9rem", margin: "0.75rem 0 0" }}>
                    Para comércio, os cálculos utilizam exclusivamente os valores informados nos dados básicos deste
                    mês.
                  </p>
                ) : null}

                <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
                  <p className="muted small" style={{ margin: "0 0 0.75rem" }}>
                    {data.activity_type} · {monthsPt[data.month - 1]} / {data.year}
                  </p>
                  <div
                    className={`health-pill health-pill--${data.health_label === "sem_dados" ? "atencao" : data.health_label}`}
                    style={{ marginBottom: "1rem" }}
                  >
                    {healthLabelPt(data.health_label)}
                  </div>

                  <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
                    Indicadores
                  </h2>
                  <div className="metric-grid metric-grid--cols-3">
                    <div className="metric-card">
                      <span className="metric-label">Faturamento</span>
                      <span className="metric-value">
                        {data.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Margem variável</span>
                      <span className="metric-value metric-value--secondary">
                        {data.variable_margin_pct != null ? `${data.variable_margin_pct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Margem operacional</span>
                      <span className="metric-value metric-value--secondary">
                        {data.operating_margin_pct != null ? `${data.operating_margin_pct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Gastos vendas / faturamento</span>
                      <span className="metric-value metric-value--secondary">
                        {data.sales_expense_ratio_pct != null ? `${data.sales_expense_ratio_pct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Insumos / faturamento</span>
                      <span className="metric-value metric-value--secondary">
                        {data.input_expense_ratio_pct != null ? `${data.input_expense_ratio_pct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Custos fixos (total)</span>
                      <span className="metric-value metric-value--secondary">
                        {data.fixed_costs_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    {data.ideal_margin_pct != null ? (
                      <div className="metric-card">
                        <span className="metric-label">Meta de margem (cadastro)</span>
                        <span className="metric-value metric-value--secondary">{data.ideal_margin_pct.toFixed(1)}%</span>
                      </div>
                    ) : null}
                    {data.margin_gap_pct != null ? (
                      <div className="metric-card">
                        <span className="metric-label">Gap vs meta (p.p.)</span>
                        <span className="metric-value metric-value--secondary">{data.margin_gap_pct.toFixed(1)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {legacyNarrative?.ok === false ? (
                  <div
                    className="auth-card auth-card--full"
                    style={{ marginTop: "1rem", borderLeft: narrativeBorder("info") }}
                  >
                    <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.5rem" }}>
                      Análise narrativa (modelo planilha)
                    </h2>
                    <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                      {legacyNarrative.message}
                    </p>
                  </div>
                ) : null}

                {legacyNarrative?.ok ? (
                  <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
                    <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
                      Análise narrativa (modelo planilha)
                    </h2>
                    <p className="muted small" style={{ margin: "0 0 1rem", lineHeight: 1.5 }}>
                      Texto gerado a partir dos dados básicos do período e do tipo de atividade do seu cadastro, no
                      mesmo espírito do diagnóstico legado. Os indicadores numéricos acima vêm da API.
                    </p>
                    <div className="stack" style={{ gap: "0.85rem" }}>
                      {legacyNarrative.blocks.map((blk, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "0.75rem 0.9rem",
                            borderRadius: 10,
                            background: "var(--surface-subtle, rgba(0,0,0,0.03))",
                            borderLeft: narrativeBorder(blk.tone),
                          }}
                        >
                          <h3
                            style={{
                              margin: "0 0 0.5rem",
                              fontSize: "1rem",
                              fontWeight: 600,
                              color: "var(--text, inherit)",
                            }}
                          >
                            {blk.title}
                          </h3>
                          {blk.paragraphs.map((p, j) => (
                            <p key={j} className="muted" style={{ margin: j ? "0.5rem 0 0" : 0, lineHeight: 1.55 }}>
                              {p}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
                  <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
                    Resumo e próximos passos
                  </h2>
                  <ul className="stack" style={{ paddingLeft: "1.1rem", margin: 0 }}>
                    {data.insights.map((t, i) => (
                      <li key={i} style={{ color: "var(--muted)", lineHeight: 1.5, marginBottom: "0.35rem" }}>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
