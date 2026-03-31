import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicData, SimuladorScenarioOut } from "../api/types";
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

type FormState = {
  capacidadeB: string;
  clientesB: string;
  variacaoPrecos: string;
  ticketMedioB: string;
  faturamentoB: string;
  gastosVendasB: string;
  gastosComprasB: string;
  custosFixosB: string;
};

const INITIAL_FORM: FormState = {
  capacidadeB: "",
  clientesB: "",
  variacaoPrecos: "",
  ticketMedioB: "",
  faturamentoB: "",
  gastosVendasB: "",
  gastosComprasB: "",
  custosFixosB: "",
};

function num(v: string): number {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function money(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(v: number): string {
  return `${v.toFixed(2)}%`;
}

function clampApiDelta(v: number): number {
  return Math.max(-90, Math.min(500, v));
}

function parseCapacity(raw: string | null, fallback: number): number {
  const n = Number(raw ?? "");
  if (Number.isFinite(n) && n > 0) return n;
  return fallback;
}

export default function SimuladorPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<BasicData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<SimuladorScenarioOut | null>(null);
  const [resultTick, setResultTick] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loadPending, setLoadPending] = useState(false);
  const initSel = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedBase = useMemo(
    () => rows.find((r) => String(r.id) === selectedId) ?? null,
    [rows, selectedId],
  );

  const metrics = useMemo(() => {
    if (!selectedBase) return null;

    const revenueA = selectedBase.sales_revenue;
    const salesA = selectedBase.sales_expenses;
    const inputA = selectedBase.input_product_expenses;
    const fixedA =
      (selectedBase.fixed_costs ?? 0) +
      (selectedBase.pro_labore ?? 0) +
      (selectedBase.other_fixed_costs ?? 0);
    const clientsA = selectedBase.clients_served;
    const capacityA = parseCapacity(selectedBase.service_capacity, clientsA);
    const ticketA = clientsA > 0 ? revenueA / clientsA : 0;

    const capacidadeB = num(form.capacidadeB);
    const clientesB = num(form.clientesB);
    const variacaoPrecos = num(form.variacaoPrecos);
    const ticketB = num(form.ticketMedioB);
    const faturamentoB = num(form.faturamentoB);
    const gastosVendasB = num(form.gastosVendasB);
    const gastosComprasB = num(form.gastosComprasB);
    const custosFixosB = num(form.custosFixosB);

    const ticketCalc = ticketA * (variacaoPrecos > 0 ? variacaoPrecos / 100 : 1);
    const faturamentoCalc = clientesB * ticketB;
    const custoVariavel = gastosVendasB + gastosComprasB;
    const custoTotal = custoVariavel + custosFixosB;
    const resultadoValor = faturamentoB - custoTotal;
    const resultadoPct = faturamentoB > 0 ? (resultadoValor / faturamentoB) * 100 : 0;

    const margemA = revenueA > 0 ? ((revenueA - (salesA + inputA + fixedA)) / revenueA) * 100 : 0;

    return {
      revenueA,
      salesA,
      inputA,
      fixedA,
      clientsA,
      capacityA,
      ticketA,
      capacidadeB,
      clientesB,
      variacaoPrecos,
      ticketB,
      ticketCalc,
      faturamentoB,
      faturamentoCalc,
      gastosVendasB,
      gastosComprasB,
      custosFixosB,
      custoVariavel,
      custoTotal,
      resultadoValor,
      resultadoPct,
      margemA,
    };
  }, [selectedBase, form]);

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
    setForm(INITIAL_FORM);
    setResult(null);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !metrics) return;
    if (!(metrics.faturamentoB > 0 && metrics.gastosVendasB >= 0 && metrics.gastosComprasB >= 0 && metrics.custosFixosB >= 0)) {
      return;
    }

    const delta_revenue_pct = clampApiDelta(
      metrics.revenueA > 0 ? ((metrics.faturamentoB / metrics.revenueA) - 1) * 100 : 0,
    );
    const delta_sales_expenses_pct = clampApiDelta(
      metrics.salesA > 0 ? ((metrics.gastosVendasB / metrics.salesA) - 1) * 100 : 0,
    );
    const delta_input_expenses_pct = clampApiDelta(
      metrics.inputA > 0 ? ((metrics.gastosComprasB / metrics.inputA) - 1) * 100 : 0,
    );
    const delta_fixed_costs_pct = clampApiDelta(
      metrics.fixedA > 0 ? ((metrics.custosFixosB / metrics.fixedA) - 1) * 100 : 0,
    );

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        setLoadPending(true);
        try {
          const out = await apiJson<SimuladorScenarioOut>("/simulador/calcular", {
            method: "POST",
            body: JSON.stringify({
              basic_data_id: Number(selectedId),
              delta_revenue_pct,
              delta_sales_expenses_pct,
              delta_input_expenses_pct,
              delta_fixed_costs_pct,
            }),
          });
          setResult(out);
          setResultTick((t) => t + 1);
        } catch (ex) {
          setErr(ex instanceof Error ? ex.message : "Erro ao simular");
        } finally {
          setLoadPending(false);
        }
      })();
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedId, metrics]);

  if (loading || !user?.onboarding_completed) {
    return <div className="dash-wrap"><p className="muted">Carregando…</p></div>;
  }

  const monthLabel = selectedBase ? `${monthsPt[selectedBase.month - 1]} / ${selectedBase.year}` : "";
  const ideal = selectedBase?.ideal_profit_margin ?? selectedBase?.ideal_service_profit_margin ?? 0;

  const showClientes = (metrics?.capacidadeB ?? 0) > 0;
  const showPrecos = (metrics?.clientesB ?? 0) > 0;
  const showTicket = (metrics?.variacaoPrecos ?? 0) > 0;
  const showFaturamento = (metrics?.ticketB ?? 0) > 0;
  const showGastosVendas = (metrics?.faturamentoB ?? 0) > 0;
  const showGastosCompras = (metrics?.gastosVendasB ?? -1) >= 0 && showGastosVendas;
  const showCustosFixos = (metrics?.gastosComprasB ?? -1) >= 0 && showGastosCompras;
  const showResultado = (metrics?.custosFixosB ?? -1) >= 0 && showCustosFixos;
  const capacidadeAlert =
    metrics && metrics.capacidadeB > 0
      ? metrics.capacidadeB > metrics.capacityA
        ? `Aumento de ${pct(((metrics.capacidadeB - metrics.capacityA) / metrics.capacityA) * 100)} em relação ao período base.`
        : metrics.capacidadeB < metrics.capacityA
          ? `Redução de ${pct(((metrics.capacityA - metrics.capacidadeB) / metrics.capacityA) * 100)} em relação ao período base.`
          : "Capacidade inalterada em relação ao período base."
      : null;
  const clientesAlert =
    metrics && metrics.clientesB > 0 && metrics.capacidadeB > 0
      ? metrics.clientesB > metrics.capacidadeB * 1.05
        ? "Atenção: clientes acima da capacidade prevista."
        : metrics.clientesB < metrics.capacidadeB * 0.95
          ? "Atenção: clientes abaixo da capacidade prevista."
          : "Estimativa de clientes compatível com a capacidade."
      : null;
  const precoAlert =
    metrics && metrics.variacaoPrecos > 0
      ? metrics.variacaoPrecos > 100
        ? "Você simulou aumento de preços."
        : metrics.variacaoPrecos < 100
          ? "Você simulou redução de preços."
          : "Você simulou manutenção de preços."
      : null;
  const ticketAlert =
    metrics && metrics.ticketB > 0 && metrics.ticketCalc > 0
      ? metrics.ticketB < metrics.ticketCalc * 0.99
        ? "Ticket informado abaixo do ticket calculado."
        : metrics.ticketB > metrics.ticketCalc * 1.01
          ? "Ticket informado acima do ticket calculado."
          : "Ticket informado alinhado ao ticket calculado."
      : null;
  const faturamentoAlert =
    metrics && metrics.faturamentoB > 0 && metrics.faturamentoCalc > 0
      ? metrics.faturamentoB > metrics.faturamentoCalc * 1.01
        ? "Previsão de faturamento acima do cálculo por clientes x ticket."
        : metrics.faturamentoB < metrics.faturamentoCalc * 0.99
          ? "Previsão de faturamento abaixo do cálculo por clientes x ticket."
          : "Previsão de faturamento coerente com clientes x ticket."
      : null;
  const custoVariavelCritico =
    metrics && metrics.faturamentoB > 0 && metrics.custoVariavel >= metrics.faturamentoB;

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>← Início</Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Simulador de cenários</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Fluxo guiado com validações da versão legada e cálculo final sincronizado com a API nova.
            </p>
          </div>
        </header>

        <BasicDataScreenNav />

        {rows.length === 0 ? (
          <div className="shortcut-card" style={{ marginTop: "1rem" }}>
            <p>É preciso ter dados básicos de um mês para simular cenários.</p>
            <Link to="/basic-data/new" className="btn-primary inline-block">Novo registro</Link>
          </div>
        ) : (
          <>
            <div className="bd-filter-section" style={{ marginTop: "1rem" }}>
              <label className="label" style={{ maxWidth: 480 }}>
                Período base
                <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Selecione…</option>
                  {rows.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {monthsPt[r.month - 1]} / {r.year}{r.is_current ? " (atual)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {err ? <div className="alert">{err}</div> : null}
            {!metrics ? null : (
              <div className="simulador-grid" style={{ marginTop: "1rem" }}>
                <section className="auth-card auth-card--full" style={{ margin: 0 }}>
                  <h2 className="bd-card-heading" style={{ fontSize: "1.1rem", marginBottom: "0.8rem" }}>Parâmetros</h2>

                  <div className="stack" style={{ gap: "0.9rem" }}>
                    <label className="label">Capacidade para o mês simulado
                      <input className="input" type="number" value={form.capacidadeB} onChange={(e) => setForm((p) => ({ ...p, capacidadeB: e.target.value }))} />
                    </label>
                    {showClientes ? <p className="muted small">Capacidade base em {monthLabel}: {metrics.capacityA} atendimentos.</p> : null}

                    {showClientes ? <label className="label">Clientes atendidos (estimativa)
                      <input className="input" type="number" value={form.clientesB} onChange={(e) => setForm((p) => ({ ...p, clientesB: e.target.value }))} />
                    </label> : null}

                    {showPrecos ? <label className="label">Variação nos preços (%)
                      <input className="input" type="number" step="0.1" value={form.variacaoPrecos} onChange={(e) => setForm((p) => ({ ...p, variacaoPrecos: e.target.value }))} />
                    </label> : null}

                    {showTicket ? <label className="label">Ticket médio estimado (R$)
                      <input className="input" type="number" step="0.01" value={form.ticketMedioB} onChange={(e) => setForm((p) => ({ ...p, ticketMedioB: e.target.value }))} />
                    </label> : null}

                    {showFaturamento ? <label className="label">Previsão de faturamento (R$)
                      <input className="input" type="number" step="0.01" value={form.faturamentoB} onChange={(e) => setForm((p) => ({ ...p, faturamentoB: e.target.value }))} />
                    </label> : null}

                    {showGastosVendas ? <label className="label">Gastos com vendas (R$)
                      <input className="input" type="number" step="0.01" value={form.gastosVendasB} onChange={(e) => setForm((p) => ({ ...p, gastosVendasB: e.target.value }))} />
                    </label> : null}

                    {showGastosCompras ? <label className="label">Gastos com compras/insumos (R$)
                      <input className="input" type="number" step="0.01" value={form.gastosComprasB} onChange={(e) => setForm((p) => ({ ...p, gastosComprasB: e.target.value }))} />
                    </label> : null}

                    {showCustosFixos ? <label className="label">Custos fixos (R$)
                      <input className="input" type="number" step="0.01" value={form.custosFixosB} onChange={(e) => setForm((p) => ({ ...p, custosFixosB: e.target.value }))} />
                    </label> : null}
                  </div>
                </section>

                <section key={resultTick} className="auth-card auth-card--full fade-in" style={{ margin: 0 }}>
                  <h2 className="bd-card-heading" style={{ fontSize: "1.1rem", marginBottom: "0.8rem" }}>Resultados</h2>
                  <p className="muted small" style={{ marginBottom: "0.8rem" }}>Período base: {monthLabel}</p>

                  <div className="stack" style={{ gap: "0.6rem", marginBottom: "1rem" }}>
                    <p className="muted small">Ticket calculado pela variação de preços: <strong>{money(metrics.ticketCalc)}</strong></p>
                    <p className="muted small">Faturamento estimado por clientes x ticket: <strong>{money(metrics.faturamentoCalc)}</strong></p>
                    {capacidadeAlert ? <p className="muted small">{capacidadeAlert}</p> : null}
                    {clientesAlert ? <p className="muted small">{clientesAlert}</p> : null}
                    {precoAlert ? <p className="muted small">{precoAlert}</p> : null}
                    {ticketAlert ? <p className="muted small">{ticketAlert}</p> : null}
                    {faturamentoAlert ? <p className="muted small">{faturamentoAlert}</p> : null}
                    {showResultado ? (
                      <>
                        <p className="muted small">Custo variável: <strong>{money(metrics.custoVariavel)}</strong></p>
                        <p className="muted small">Custo total: <strong>{money(metrics.custoTotal)}</strong></p>
                        {custoVariavelCritico ? (
                          <p className="muted small" style={{ color: "var(--danger-text)" }}>
                            Situação crítica: custo variável maior ou igual ao faturamento.
                          </p>
                        ) : null}
                        <p className="muted small">Resultado final: <strong>{money(metrics.resultadoValor)}</strong> ({pct(metrics.resultadoPct)})</p>
                        <p className="muted small">Margem histórica ({monthLabel}): <strong>{pct(metrics.margemA)}</strong></p>
                        <p className="muted small">
                          Próximo passo: {metrics.resultadoPct < 0 ? "corrigir custo variável e preço" : metrics.resultadoPct < ideal ? "ajustar prioridades para alcançar margem ideal" : "validar plano para manter/elevar desempenho"}.
                        </p>
                      </>
                    ) : null}
                  </div>

                  {loadPending ? <p className="muted">Calculando cenário API…</p> : null}
                  {result ? (
                    <div className="metric-grid metric-grid--cols-2">
                      <div className="metric-card">
                        <span className="metric-label">Margem operacional (API)</span>
                        <span className="metric-value">{result.simulated.operating_margin_pct != null ? `${result.simulated.operating_margin_pct.toFixed(1)}%` : "—"}</span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Delta operacional (p.p.)</span>
                        <span className="metric-value metric-value--secondary">{result.delta_operating_margin_pp != null ? `${result.delta_operating_margin_pp >= 0 ? "+" : ""}${result.delta_operating_margin_pp.toFixed(1)}` : "—"}</span>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
