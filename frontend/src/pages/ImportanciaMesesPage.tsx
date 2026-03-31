import { Chart, registerables } from "chart.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { MesImportancia } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import BasicDataScreenNav from "../components/basicData/ScreenNav";

Chart.register(...registerables);

const MESES_ABREV = ["", "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const BRAND_BAR = "rgba(1, 57, 44, 0.55)";
const BRAND_BAR_BORDER = "rgb(1, 57, 44)";

function qtdVendasLegado(r: MesImportancia): number | null {
  if (r.quantidade_vendas_real != null) return r.quantidade_vendas_real;
  if (r.quantidade_vendas_estimada != null) return r.quantidade_vendas_estimada;
  return null;
}

export default function ImportanciaMesesPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [years, setYears] = useState<number[]>([]);
  const [yearsFetchOk, setYearsFetchOk] = useState<boolean | null>(null);
  const [year, setYear] = useState<number | "">("");
  const [rows, setRows] = useState<MesImportancia[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const chartRef = useRef<Chart<"bar"> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    void (async () => {
      try {
        const y = await apiJson<number[]>("/importancia-meses/available-years");
        const sorted = [...y].sort((a, b) => b - a);
        setYears(sorted);
        setYearsFetchOk(true);
        setErr(null);
        if (sorted.length) {
          setYear((prev) => (prev === "" || !sorted.includes(prev as number) ? sorted[0] : prev));
        } else {
          setYear("");
        }
      } catch {
        setYearsFetchOk(false);
        setYears([]);
        setYear("");
        setErr("Erro ao carregar dados. Tente novamente.");
      }
    })();
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user?.onboarding_completed || year === "") return;
    let c = false;
    void (async () => {
      setPending(true);
      setErr(null);
      try {
        const data = await apiJson<MesImportancia[]>(`/importancia-meses?year=${year}`);
        if (!c) setRows(data);
      } catch (e) {
        if (!c) {
          setErr(e instanceof Error ? e.message : "Erro ao carregar importância");
          setRows([]);
        }
      } finally {
        if (!c) setPending(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [loading, user, year]);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboarding_completed) nav("/auth/onboarding", { replace: true });
  }, [loading, user, nav]);

  const rowsByMonth = useMemo(() => {
    const m = new Map<number, MesImportancia>();
    for (const r of rows) m.set(r.month, r);
    return m;
  }, [rows]);

  const tableRows = useMemo(() => {
    const yNum = typeof year === "number" ? year : new Date().getFullYear();
    const out: MesImportancia[] = [];
    for (let month = 1; month <= 12; month++) {
      out.push(
        rowsByMonth.get(month) ?? {
          id: month,
          user_id: user?.id ?? 0,
          year: yNum,
          month,
          nota_atribuida: null,
          ritmo_negocio_percentual: null,
          peso_mes: null,
          quantidade_vendas_real: null,
          quantidade_vendas_estimada: null,
          created_at: "",
          updated_at: "",
        },
      );
    }
    return out;
  }, [rowsByMonth, year, user?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || year === "") {
      chartRef.current?.destroy();
      chartRef.current = null;
      return;
    }

    chartRef.current?.destroy();
    chartRef.current = null;

    const labels: string[] = [];
    const dados: number[] = [];
    for (const r of [...tableRows].sort((a, b) => a.month - b.month)) {
      const q = qtdVendasLegado(r);
      if (q != null && Number.isFinite(q)) {
        labels.push(MESES_ABREV[r.month]);
        dados.push(Math.round(q));
      }
    }

    if (dados.length === 0) {
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Quantidade de vendas",
            data: dados,
            backgroundColor: BRAND_BAR,
            borderColor: BRAND_BAR_BORDER,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            title: { display: true, text: "Quantidade de vendas" },
          },
          x: {
            title: { display: true, text: "Mês" },
          },
        },
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: {
            callbacks: {
              label: (ctx) => `Vendas: ${Math.round(Number(ctx.parsed.y))}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [tableRows, year]);

  const semAnosCadastrados = yearsFetchOk === true && years.length === 0;
  const mostrarTabela = !pending && year !== "" && rows.length > 0 && !err;
  const mostrarGrafico =
    mostrarTabela && tableRows.some((r) => qtdVendasLegado(r) != null && Number.isFinite(qtdVendasLegado(r)!));

  if (loading || !user?.onboarding_completed) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small importancia-back-link" style={{ textDecoration: "none" }}>
          ← Início
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Importância dos meses</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Intensidade, ritmo do negócio e vendas por mês no ano selecionado (valores dos dados básicos ou estimados).
            </p>
          </div>
        </header>

        <BasicDataScreenNav />

        {yearsFetchOk === null ? <p className="muted">Carregando anos…</p> : null}

        {err ? (
          <div className="alert" role="alert" style={{ marginTop: "1rem" }}>
            {err}
          </div>
        ) : null}

        {semAnosCadastrados ? (
          <div className="shortcut-card" style={{ marginTop: "1rem" }}>
            <p className="shortcut-hint" style={{ marginBottom: "0.85rem" }}>
              Nenhuma importância de mês cadastrada. Comece pelo cadastro para definir eventos e notas por mês.
            </p>
            <Link to="/importancia-meses/cadastrar" className="btn-primary inline-block">
              Cadastrar importâncias dos meses
            </Link>
          </div>
        ) : null}

        {!semAnosCadastrados && yearsFetchOk ? (
          <>
            <div className="bd-filter-section" style={{ marginTop: "1rem" }}>
              <div className="bd-filter-grid">
                <label className="label" style={{ maxWidth: 320 }}>
                  Selecione o ano
                  <select
                    className="input"
                    value={year === "" ? "" : String(year)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setYear(v === "" ? "" : Number(v));
                    }}
                  >
                    <option value="">Selecione um ano…</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ justifySelf: "end", alignSelf: "end" }}>
                  <Link to="/importancia-meses/cadastrar" className="btn-primary inline-block">
                    Cadastrar importâncias
                  </Link>
                </div>
              </div>
            </div>

            {pending && year !== "" ? <p className="muted">Carregando…</p> : null}

            {mostrarTabela ? (
              <>
                <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
                  <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
                    Importância dos meses
                  </h2>
                  <div className="bd-table-wrap" style={{ maxHeight: 560, overflowY: "auto" }}>
                    <table className="bd-table">
                      <thead>
                        <tr>
                          <th>Ano</th>
                          <th>Mês</th>
                          <th>Notas Atribuídas</th>
                          <th title="Percentual em relação ao mês mais forte do ano">Ritmo do Negócio (%)</th>
                          <th title="Clientes atendidos nos dados básicos, ou estimativa quando não houver registro">
                            Quantidade de Vendas
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((r) => {
                          const q = qtdVendasLegado(r);
                          return (
                            <tr key={r.month}>
                              <td>{r.year}</td>
                              <td style={{ fontWeight: 700 }}>{MESES_ABREV[r.month]}</td>
                            <td>{r.nota_atribuida != null ? r.nota_atribuida.toFixed(2) : "-"}</td>
                            <td>
                              {r.ritmo_negocio_percentual != null ? `${r.ritmo_negocio_percentual.toFixed(1)}%` : "-"}
                            </td>
                            <td>{q != null && Number.isFinite(q) ? Math.round(q) : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {mostrarGrafico ? (
                  <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
                    <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
                      Quantidade de vendas por mês
                    </h2>
                    <div
                      style={{
                        position: "relative",
                        height: "min(360px, 50vh)",
                        minHeight: 240,
                      }}
                    >
                      <canvas ref={canvasRef} id="graficoVendas" aria-label="Gráfico de vendas por mês" />
                    </div>
                  </div>
                ) : null}
              </>
            ) : !pending && year !== "" && !err && rows.length === 0 ? (
              <div className="shortcut-card" style={{ marginTop: "1rem" }}>
                <p className="shortcut-hint" style={{ margin: 0 }}>
                  Nenhum mês encontrado para o ano selecionado. Use o cadastro para configurar eventos e importâncias.
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
