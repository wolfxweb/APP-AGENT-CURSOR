import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicData, CalculatorHistoryRow } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import BasicDataScreenNav from "../components/basicData/ScreenNav";
import HelpDialog from "../components/basicData/HelpDialog";
import { computeCalculatorPreview } from "../services/calculatorMath";

const HELP = {
  date: {
    title: "Data",
    body: "A data em que o registro foi criado no sistema — quando o cálculo foi salvo.",
  },
  basicMonth: {
    title: "Mês dados básicos",
    body: "Mês e ano dos dados básicos usados como referência (margem ideal, custos etc.).",
  },
  product: {
    title: "Produto",
    body: "Nome do produto ou serviço para o qual o cálculo foi feito.",
  },
  currentPrice: {
    title: "Preço atual",
    body: "Preço de venda atualmente praticado.",
  },
  currentMargin: {
    title: "Margem atual",
    body: "Margem de lucro atual (percentual sobre o preço de venda).",
  },
  desiredMargin: {
    title: "Margem desejada",
    body: "Margem que você quer atingir com o preço sugerido.",
  },
  suggestedPrice: {
    title: "Preço sugerido",
    body: "Valor recomendado de venda com base nas margens informadas.",
  },
  relation: {
    title: "Relação",
    body: "Relação percentual entre o preço sugerido e o preço atual de venda.",
  },
  competitorPrice: {
    title: "Preço concorrente",
    body: "Referência de mercado. Quando informado, também calculamos a diferença percentual do sugerido em relação a esse valor.",
  },
} as const;

type HelpKey = keyof typeof HELP;

function parseNum(s: string): number {
  return Number(String(s).replace(",", ".").trim());
}

/** Limites alinhados a `CalculatorCalculateIn`: margens em [0, 100). */
const MAX_MARGIN_EXCLUSIVE = 99.999;

function clampMarginPrefill(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_MARGIN_EXCLUSIVE);
}

type CalcPayload =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; message: string };

function buildCalcPayload(
  currentPrice: string,
  currentMargin: string,
  desiredMargin: string,
  companyMargin: string,
  competitorPrice: string,
  basicDataId: string,
  productName: string,
  notes: string,
): CalcPayload {
  const price = parseNum(currentPrice);
  const curM = parseNum(currentMargin);
  const desM = parseNum(desiredMargin);

  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: "Informe um preço atual maior que zero." };
  }
  if (!Number.isFinite(curM) || curM < 0 || curM >= 100) {
    return { ok: false, message: "Margem atual deve ser um número de 0% a menos de 100%." };
  }
  if (!Number.isFinite(desM) || desM < 0 || desM >= 100) {
    return {
      ok: false,
      message:
        "Margem desejada deve ser de 0% a menos de 100% (100% deixa o preço indefinido na fórmula).",
    };
  }

  const body: Record<string, unknown> = {
    current_price: price,
    current_margin: curM,
    desired_margin: desM,
    product_name: productName.trim() || null,
    notes: notes.trim() || null,
  };

  const cm = companyMargin.trim();
  if (cm) {
    const c = parseNum(cm);
    if (!Number.isFinite(c) || c < 0 || c >= 100) {
      return { ok: false, message: "Margem da empresa deve ser de 0% a menos de 100%." };
    }
    body.company_margin = c;
  }

  const cp = competitorPrice.trim();
  if (cp) {
    const comp = parseNum(cp);
    if (!Number.isFinite(comp) || comp <= 0) {
      return { ok: false, message: "Preço do concorrente deve ser maior que zero quando informado." };
    }
    body.competitor_price = comp;
  }

  const bid = basicDataId.trim();
  if (bid) body.basic_data_id = Number(bid);

  return { ok: true, body };
}

function HelpTh({
  k,
  label,
  onHelp,
}: {
  k: HelpKey;
  label: React.ReactNode;
  onHelp: (key: HelpKey) => void;
}) {
  const h = HELP[k];
  return (
    <th>
      {label}
      <button type="button" className="bd-help-chip" aria-label={`Ajuda: ${h.title}`} onClick={() => onHelp(k)}>
        ?
      </button>
    </th>
  );
}

export default function CalculatorPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [basicRows, setBasicRows] = useState<BasicData[]>([]);
  const [history, setHistory] = useState<CalculatorHistoryRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [productName, setProductName] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentMargin, setCurrentMargin] = useState("");
  const [companyMargin, setCompanyMargin] = useState("");
  const [desiredMargin, setDesiredMargin] = useState("");
  const [competitorPrice, setCompetitorPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [basicDataId, setBasicDataId] = useState("");

  const [help, setHelp] = useState<{ key: HelpKey } | null>(null);

  const [filterProduct, setFilterProduct] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterMarginMin, setFilterMarginMin] = useState("");
  const [filterMarginMax, setFilterMarginMax] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const initializedRef = useRef(false);

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    let c = false;
    void (async () => {
      try {
        const [bd, hi] = await Promise.all([
          apiJson<BasicData[]>("/basic-data"),
          apiJson<CalculatorHistoryRow[]>("/calculator"),
        ]);
        if (!c) {
          setBasicRows(bd);
          setHistory(hi);
        }
      } catch {
        if (!c) setErr("Não foi possível carregar dados.");
      }
    })();
    return () => {
      c = true;
    };
  }, [loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboarding_completed) nav("/auth/onboarding", { replace: true });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!basicRows.length || initializedRef.current) return;
    initializedRef.current = true;
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const found = basicRows.find((b) => b.month === m && b.year === y);
    const b = found ?? basicRows[0];
    setBasicDataId(String(b.id));
    const ideal = b.ideal_profit_margin ?? b.ideal_service_profit_margin;
    if (ideal != null) {
      const m = clampMarginPrefill(ideal);
      setCompanyMargin(String(m));
      setDesiredMargin(String(m));
    }
  }, [basicRows]);

  function applyBasicDataPrefill(id: string) {
    const b = basicRows.find((x) => String(x.id) === id);
    if (!b) return;
    const ideal = b.ideal_profit_margin ?? b.ideal_service_profit_margin;
    if (ideal != null) {
      const m = clampMarginPrefill(ideal);
      setCompanyMargin(String(m));
      setDesiredMargin(String(m));
    }
  }

  async function onClickSave() {
    if (!productName.trim()) {
      setErr("Informe o nome do produto.");
      return;
    }
    const built = buildCalcPayload(
      currentPrice,
      currentMargin,
      desiredMargin,
      companyMargin,
      competitorPrice,
      basicDataId,
      productName,
      notes,
    );
    if (!built.ok) {
      setErr(built.message);
      return;
    }
    setErr(null);
    setPending(true);
    try {
      await apiJson<CalculatorHistoryRow>("/calculator", {
        method: "POST",
        body: JSON.stringify(built.body),
      });
      const hi = await apiJson<CalculatorHistoryRow[]>("/calculator");
      setHistory(hi);
      setProductName("");
      setCurrentPrice("");
      setCurrentMargin("");
      setCompetitorPrice("");
      setNotes("");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao salvar");
    } finally {
      setPending(false);
    }
  }

  async function onDeleteRow(id: number) {
    if (!window.confirm("Tem certeza que deseja remover este registro?")) return;
    setErr(null);
    try {
      await apiJson(`/calculator/${id}`, { method: "DELETE" });
      setHistory(await apiJson<CalculatorHistoryRow[]>("/calculator"));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao remover");
    }
  }

  const livePreview = useMemo(() => {
    const price = parseNum(currentPrice);
    const curM = parseNum(currentMargin);
    const desM = parseNum(desiredMargin);
    const ct = competitorPrice.trim();
    let comp: number | undefined;
    if (ct) {
      const x = parseNum(competitorPrice);
      if (Number.isFinite(x) && x > 0) comp = x;
    }
    return computeCalculatorPreview(price, curM, desM, comp);
  }, [currentPrice, currentMargin, desiredMargin, competitorPrice]);

  const relationVsCurrent =
    livePreview && parseNum(currentPrice) > 0
      ? ((livePreview.suggested_price / parseNum(currentPrice) - 1) * 100).toFixed(2)
      : "";

  function clearHistoryFilters() {
    setFilterProduct("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterMarginMin("");
    setFilterMarginMax("");
    setFilterDate("");
  }

  function exportHistoryCsv() {
    const sep = ";";
    const esc = (s: string) => {
      const t = s.replaceAll('"', '""');
      return `"${t}"`;
    };
    const header = [
      "id",
      "Data",
      "Mês dados básicos",
      "Produto",
      "Preço atual",
      "Margem atual %",
      "Margem desejada %",
      "Preço sugerido",
      "Relação vs atual %",
      "Preço concorrente",
      "Observações",
    ];
    const lines = [header.join(sep)];
    for (const h of filteredHistory) {
      const d = new Date(h.created_at);
      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const basicMy = h.month && h.year ? `${h.month}/${h.year}` : "";
      const rel = h.current_price > 0 ? `${((h.suggested_price / h.current_price - 1) * 100).toFixed(1)}` : "";
      const row = [
        String(h.id),
        dateStr,
        basicMy,
        h.product_name ?? "",
        h.current_price.toFixed(2).replace(".", ","),
        h.current_margin.toFixed(1).replace(".", ","),
        h.desired_margin.toFixed(1).replace(".", ","),
        h.suggested_price.toFixed(2).replace(".", ","),
        rel,
        h.competitor_price != null ? h.competitor_price.toFixed(2).replace(".", ",") : "",
        h.notes ?? "",
      ];
      lines.push(row.map(esc).join(sep));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calculadora_historico_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredHistory = useMemo(() => {
    const p = filterProduct.trim().toLowerCase();
    const priceMin = filterPriceMin.trim() ? parseNum(filterPriceMin) : null;
    const priceMax = filterPriceMax.trim() ? parseNum(filterPriceMax) : null;
    const marginMin = filterMarginMin.trim() ? parseNum(filterMarginMin) : null;
    const marginMax = filterMarginMax.trim() ? parseNum(filterMarginMax) : null;

    return history.filter((h) => {
      const name = (h.product_name ?? "").toLowerCase();
      if (p && !name.includes(p)) return false;
      if (priceMin != null && h.current_price < priceMin) return false;
      if (priceMax != null && h.current_price > priceMax) return false;
      if (marginMin != null && h.desired_margin < marginMin) return false;
      if (marginMax != null && h.desired_margin > marginMax) return false;
      if (filterDate) {
        const d = new Date(h.created_at);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (iso !== filterDate) return false;
      }
      return true;
    });
  }, [history, filterProduct, filterPriceMin, filterPriceMax, filterMarginMin, filterMarginMax, filterDate]);

  function tableRelationPct(h: CalculatorHistoryRow): string {
    if (h.current_price > 0) return `${((h.suggested_price / h.current_price - 1) * 100).toFixed(1)}%`;
    return "—";
  }

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
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>
          ← Início
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Calculadora de preços</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              O preço sugerido e o custo implícito atualizam automaticamente ao preencher preço e margens. Use Gravar para
              salvar no histórico.
            </p>
          </div>
        </header>

        <HelpDialog
          open={help != null}
          title={help ? HELP[help.key].title : ""}
          onClose={() => setHelp(null)}
        >
          <p style={{ margin: 0, lineHeight: 1.5 }}>{help ? HELP[help.key].body : null}</p>
        </HelpDialog>

        <BasicDataScreenNav />

        {err ? (
          <div className="alert" role="alert" style={{ marginBottom: "1rem" }}>
            {err}
          </div>
        ) : null}

        {basicRows.length === 0 ? (
          <div className="shortcut-card">
            <p className="shortcut-hint">Cadastre dados básicos mensais para vincular um período de referência.</p>
            <Link to="/basic-data/new" className="btn-primary inline-block">
              Novo registro
            </Link>
          </div>
        ) : (
          <div className="auth-card auth-card--full" style={{ marginBottom: "1.25rem" }}>
            <p className="muted small" style={{ margin: "0 0 0.85rem", lineHeight: 1.5 }}>
              Preencha <strong>preço atual</strong>, <strong>margem atual</strong> e <strong>margem desejada</strong> — o
              resultado aparece na hora, sem precisar de outro botão.
            </p>
            <div className="grid2" style={{ marginBottom: "0.75rem" }}>
                <label className="label">
                  Dados básicos
                  <select
                    className="input"
                    value={basicDataId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBasicDataId(v);
                      applyBasicDataPrefill(v);
                    }}
                  >
                    <option value="">Selecione os dados básicos</option>
                    {basicRows.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.month}/{b.year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Nome do produto *
                  <input
                    className="input"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid2" style={{ marginBottom: "0.75rem" }}>
                <label className="label">
                  Preço de venda atual (R$) *
                  <input
                    className="input"
                    inputMode="decimal"
                    required
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                  />
                </label>
                <label className="label">
                  Margem de preço atual (%) *
                  <input
                    className="input"
                    inputMode="decimal"
                    required
                    value={currentMargin}
                    onChange={(e) => setCurrentMargin(e.target.value)}
                  />
                </label>
              </div>

              <div className="calc-form-row-3" style={{ marginBottom: "0.75rem" }}>
                <label className="label">
                  Margem da empresa (%)
                  <input className="input" inputMode="decimal" value={companyMargin} onChange={(e) => setCompanyMargin(e.target.value)} />
                </label>
                <label className="label">
                  Margem desejada (%) *
                  <input
                    className="input"
                    inputMode="decimal"
                    required
                    value={desiredMargin}
                    onChange={(e) => setDesiredMargin(e.target.value)}
                  />
                </label>
                <label className="label">
                  Preço sugerido (R$)
                  <input
                    className="input"
                    readOnly
                    value={livePreview ? livePreview.suggested_price.toFixed(2) : ""}
                    placeholder="—"
                  />
                </label>
              </div>

              <div className="grid2" style={{ marginBottom: "0.75rem" }}>
                <label className="label">
                  Relação com preço atual (%)
                  <input className="input" readOnly value={relationVsCurrent} placeholder="—" />
                  {livePreview?.price_relation_pct != null ? (
                    <span className="muted small" style={{ display: "block", marginTop: "0.25rem" }}>
                      Vs concorrente: {livePreview.price_relation_pct.toFixed(1)}%
                    </span>
                  ) : null}
                </label>
                <label className="label">
                  Preço médio do concorrente (R$)
                  <input className="input" inputMode="decimal" value={competitorPrice} onChange={(e) => setCompetitorPrice(e.target.value)} />
                </label>
              </div>

              <label className="label" style={{ marginBottom: "1rem" }}>
                Observações <span className="muted small">opcional</span>
                <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "0.65rem" }}>
                <button type="button" className="btn-primary" disabled={pending} onClick={() => void onClickSave()}>
                  {pending ? "Gravando…" : "Gravar"}
                </button>
              </div>

              {livePreview ? (
                <div className="metric-grid" style={{ marginTop: "1.25rem" }}>
                  <div className="metric-card metric-card--highlight">
                    <span className="metric-label">Custo variável implícito</span>
                    <span className="metric-value metric-value--secondary">
                      {livePreview.implied_unit_cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>
              ) : null}
          </div>
        )}

        <section className="calc-history" aria-label="Histórico da calculadora">
          <h2 className="bd-card-heading" style={{ fontSize: "1.35rem", marginTop: "0.5rem" }}>
            Histórico
          </h2>
          <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
            Cálculos já salvos. Use os filtros para localizar registros.
          </p>

          {history.length > 0 ? (
            <div className="bd-filter-section calc-history-filters">
              <div className="bd-filter-grid calc-history-filter-grid">
                <label className="label">
                  Produto
                  <input
                    className="input"
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    placeholder="Filtrar por produto"
                  />
                </label>
                <label className="label">
                  Faixa de preço (atual)
                  <div className="calc-filter-range calc-history-filter-range">
                    <input
                      className="input"
                      inputMode="decimal"
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value)}
                      placeholder="Min"
                    />
                    <span className="muted calc-history-range-sep" aria-hidden="true">
                      –
                    </span>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </label>
                <label className="label">
                  Margem desejada
                  <div className="calc-filter-range calc-history-filter-range">
                    <input
                      className="input"
                      inputMode="decimal"
                      value={filterMarginMin}
                      onChange={(e) => setFilterMarginMin(e.target.value)}
                      placeholder="Min"
                    />
                    <span className="muted calc-history-range-sep" aria-hidden="true">
                      –
                    </span>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={filterMarginMax}
                      onChange={(e) => setFilterMarginMax(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </label>
                <label className="label">
                  Data do registro
                  <input className="input" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </label>
              </div>
              <div className="calc-history-actions">
                <button type="button" className="btn-ghost calc-history-action-btn" onClick={clearHistoryFilters}>
                  Limpar filtros
                </button>
                <button
                  type="button"
                  className="btn-primary calc-history-action-btn"
                  disabled={filteredHistory.length === 0}
                  onClick={exportHistoryCsv}
                >
                  Exportar CSV (filtrado)
                </button>
              </div>
            </div>
          ) : null}

          {history.length === 0 ? (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Nenhum cálculo salvo ainda.
            </p>
          ) : filteredHistory.length === 0 ? (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Nenhum registro corresponde aos filtros.
            </p>
          ) : (
            <div className="bd-table-wrap calc-history-table-wrap">
              <table className="bd-table calc-history-table">
              <thead>
                <tr>
                  <HelpTh k="date" label="Data" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="basicMonth" label="Mês dados básicos" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="product" label="Produto" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="currentPrice" label="Preço atual" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="currentMargin" label="Margem atual" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="desiredMargin" label="Margem desejada" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="suggestedPrice" label="Preço sugerido" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="relation" label="Relação" onHelp={(key) => setHelp({ key })} />
                  <HelpTh k="competitorPrice" label="Preço concorrente" onHelp={(key) => setHelp({ key })} />
                  <th>Ações</th>
                </tr>
              </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.id}>
                      <td>
                        {new Date(h.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>{h.month && h.year ? `${h.month}/${h.year}` : "—"}</td>
                      <td>{h.product_name ?? "—"}</td>
                      <td>{h.current_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td>{h.current_margin.toFixed(1)}%</td>
                      <td>{h.desired_margin.toFixed(1)}%</td>
                      <td>{h.suggested_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td>{tableRelationPct(h)}</td>
                      <td>
                        {h.competitor_price != null
                          ? h.competitor_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost btn-ghost--danger"
                          style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem" }}
                          title="Remover"
                          onClick={() => void onDeleteRow(h.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
