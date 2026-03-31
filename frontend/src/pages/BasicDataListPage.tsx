import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicData } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { isWholesaleRetailCommerce } from "../components/basicData/activity";
import HelpDialog from "../components/basicData/HelpDialog";
import BasicDataScreenNav from "../components/basicData/ScreenNav";

const MONTHS_PT = [
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

const LIST_HELP: Record<string, { title: string; body: string }> = {
  clients: {
    title: "Quantidade de clientes atendidos",
    body: "Número total de clientes atendidos no período. Representa a quantidade de pessoas ou empresas que receberam seus serviços.",
  },
  revenue: {
    title: "Faturamento com vendas",
    body: "Valor total de receitas geradas pelas vendas no período. Inclui todos os valores recebidos de clientes.",
  },
  salesExp: {
    title: "Gastos com vendas",
    body: "Valor total gasto com despesas relacionadas às vendas, como comissões, taxas de transação, marketing, etc.",
  },
  inputExp: {
    title: "Gastos com insumos e produtos",
    body: "Valor gasto em matérias-primas, produtos para revenda ou insumos necessários para a prestação de serviços.",
  },
  proLabore: {
    title: "Pró-labore",
    body: "Valor da remuneração do empresário pelos serviços prestados à empresa. Representa o “salário” do dono do negócio.",
  },
  fixed: {
    title: "Custos fixos",
    body: "Valor dos custos que permanecem constantes independentemente do volume de vendas, como aluguel, salários fixos, energia, água, etc.",
  },
  fixedMore: {
    title: "Demais custos fixos",
    body: "Valor dos custos que permanecem constantes independentemente do volume de vendas, como aluguel, salários fixos, energia, água, etc.",
  },
  hours: {
    title: "Horas de trabalho por semana",
    body: "Total de horas trabalhadas por semana. O máximo possível é 168 horas (7 dias × 24 horas).",
  },
  capacity: {
    title: "Capacidade de atendimento",
    body: "Capacidade máxima de atendimento de clientes baseada nas horas de trabalho disponíveis e na eficiência operacional.",
  },
  margin: {
    title: "Margem de lucro ideal (%)",
    body: "Porcentagem de lucro que você considera ideal para seu negócio após descontar todos os custos e despesas.",
  },
};

function cellBrl(n: number | null | undefined): string {
  if (n === null || n === undefined) return "N/A";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pctUnderRevenue(part: number | null | undefined, revenue: number): string | null {
  if (part === null || part === undefined || revenue <= 0) return null;
  return `${((part / revenue) * 100).toFixed(2)}%`;
}

function HelpTh({
  k,
  label,
  onHelp,
}: {
  k: keyof typeof LIST_HELP;
  label: React.ReactNode;
  onHelp: (key: keyof typeof LIST_HELP) => void;
}) {
  const h = LIST_HELP[k];
  return (
    <th>
      {label}
      <button type="button" className="bd-help-chip" aria-label={`Ajuda: ${h.title}`} onClick={() => onHelp(k)}>
        ?
      </button>
    </th>
  );
}

export default function BasicDataListPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<BasicData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMinClientsOrRevenue, setFilterMinClientsOrRevenue] = useState("");
  const [listHelp, setListHelp] = useState<keyof typeof LIST_HELP | null>(null);

  const commerce = user ? isWholesaleRetailCommerce(user.activity_type) : false;

  async function load() {
    setErr(null);
    try {
      const data = await apiJson<BasicData[]>("/basic-data");
      setRows(data);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao carregar");
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav("/auth/login", { replace: true });
      return;
    }
    if (!user.onboarding_completed) {
      nav("/auth/onboarding", { replace: true });
      return;
    }
    void load();
  }, [loading, user, nav]);

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    for (const r of rows) ys.add(r.year);
    return Array.from(ys).sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    const m = filterMonth.trim().toLowerCase();
    const y = filterYear.trim();
    const minVal = filterMinClientsOrRevenue.trim() === "" ? 0 : Number(filterMinClientsOrRevenue);
    const minNum = Number.isFinite(minVal) ? minVal : 0;

    return rows.filter((r) => {
      const monthName = MONTHS_PT[r.month - 1]?.toLowerCase() ?? "";
      if (m && !monthName.includes(m)) return false;
      if (y && String(r.year) !== y) return false;
      if (minNum > 0) {
        if (commerce) {
          if (r.sales_revenue < minNum) return false;
        } else if (r.clients_served < minNum) return false;
      }
      return true;
    });
  }, [rows, filterMonth, filterYear, filterMinClientsOrRevenue, commerce]);

  function clearFilters() {
    setFilterMonth("");
    setFilterYear("");
    setFilterMinClientsOrRevenue("");
  }

  function exportCsv() {
    const el = document.getElementById("bd-table");
    if (!el || !(el instanceof HTMLTableElement)) return;
    const trs = el.querySelectorAll("tbody tr");
    const ths = el.querySelectorAll("thead th");
    const header: string[] = [];
    for (let i = 0; i < ths.length - 1; i++) {
      header.push(ths[i].textContent?.replace(/\s+/g, " ").trim() ?? "");
    }
    const lines: string[] = [header.join(";")];
    for (const tr of trs) {
      if (tr.classList.contains("bd-no-results")) continue;
      const style = (tr as HTMLElement).style.display;
      if (style === "none") continue;
      const tds = tr.querySelectorAll("td");
      const cells: string[] = [];
      for (let i = 0; i < tds.length - 1; i++) {
        cells.push(tds[i].textContent?.replace(/\s+/g, " ").trim() ?? "");
      }
      if (cells.length) lines.push(cells.join(";"));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dados_basicos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function removeRow(id: number) {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    setPending(true);
    setErr(null);
    try {
      await apiJson<undefined>(`/basic-data/${id}`, { method: "DELETE" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao excluir");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user?.onboarding_completed) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  const emptyFiltered = filtered.length === 0 && rows.length > 0;

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>
          ← Início
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Histórico de dados básicos</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Registros mensais usados nos cálculos e diagnósticos.
            </p>
          </div>
          <Link to="/basic-data/new" className="btn-primary" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
            Novo registro
          </Link>
        </header>

        <div>
          {listHelp ? (
            <HelpDialog
              open
              title={LIST_HELP[listHelp].title}
              onClose={() => setListHelp(null)}
            >
              <p>{LIST_HELP[listHelp].body}</p>
            </HelpDialog>
          ) : null}
          <BasicDataScreenNav />

          <div className="bd-filter-section">
            <div className="bd-filter-grid">
              <label className="label">
                Mês
                <select
                  className="input"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="">Todos os meses</option>
                  {MONTHS_PT.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                Ano
                <select
                  className="input"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">Todos os anos</option>
                  {yearOptions.map((yy) => (
                    <option key={yy} value={String(yy)}>
                      {yy}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                {commerce ? "Faturamento (mín.)" : "Clientes (mín.)"}
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder={commerce ? "Valor mínimo (R$)" : "Número mínimo de clientes"}
                  value={filterMinClientsOrRevenue}
                  onChange={(e) => setFilterMinClientsOrRevenue(e.target.value)}
                />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button type="button" className="btn-ghost" onClick={clearFilters}>
                  Limpar filtros
                </button>
                <button type="button" className="btn-primary" disabled={rows.length === 0} onClick={exportCsv}>
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {err ? (
            <div className="alert" role="alert">
              {err}
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className="shortcut-card" style={{ textAlign: "center" }}>
              <p>Você ainda não possui registros de Dados Básicos.</p>
              <Link to="/basic-data/new" className="btn-primary inline-block">
                Criar primeiro registro
              </Link>
            </div>
          ) : (
            <div className="bd-table-wrap">
              <table className="bd-table" id="bd-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Ano</th>
                    {!commerce ? <HelpTh k="clients" label="Clientes" onHelp={setListHelp} /> : null}
                    <HelpTh k="revenue" label="Faturamento" onHelp={setListHelp} />
                    <HelpTh k="salesExp" label="Gastos vendas" onHelp={setListHelp} />
                    <HelpTh k="inputExp" label="Gastos insumos" onHelp={setListHelp} />
                    {!commerce ? <HelpTh k="proLabore" label="Pró-labore" onHelp={setListHelp} /> : null}
                    <HelpTh
                      k={commerce ? "fixed" : "fixedMore"}
                      label={commerce ? "Custos fixos" : "Demais custos fixos"}
                      onHelp={setListHelp}
                    />
                    {!commerce ? <HelpTh k="hours" label="Horas/sem" onHelp={setListHelp} /> : null}
                    <HelpTh k="capacity" label="Capacidade" onHelp={setListHelp} />
                    <HelpTh k="margin" label="Margem %" onHelp={setListHelp} />
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const rev = r.sales_revenue;
                    const show = filtered.some((x) => x.id === r.id);
                    return (
                      <tr key={r.id} style={{ display: show ? undefined : "none" }}>
                        <td>{MONTHS_PT[r.month - 1]}</td>
                        <td>{r.year}</td>
                        {!commerce ? <td>{r.clients_served ?? "N/A"}</td> : null}
                        <td>{cellBrl(rev)}</td>
                        <td>
                          {r.sales_expenses != null ? (
                            <>
                              {cellBrl(r.sales_expenses)}
                              {pctUnderRevenue(r.sales_expenses, rev) ? (
                                <span className="bd-cell-sub">{pctUnderRevenue(r.sales_expenses, rev)}</span>
                              ) : null}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>
                          {r.input_product_expenses != null ? (
                            <>
                              {cellBrl(r.input_product_expenses)}
                              {pctUnderRevenue(r.input_product_expenses, rev) ? (
                                <span className="bd-cell-sub">{pctUnderRevenue(r.input_product_expenses, rev)}</span>
                              ) : null}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        {!commerce ? (
                          <td>
                            {r.pro_labore != null ? (
                              <>
                                {cellBrl(r.pro_labore)}
                                {pctUnderRevenue(r.pro_labore, rev) ? (
                                  <span className="bd-cell-sub">{pctUnderRevenue(r.pro_labore, rev)}</span>
                                ) : null}
                              </>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        ) : null}
                        <td>
                          {(r.other_fixed_costs ?? r.fixed_costs) != null ? (
                            <>
                              {cellBrl((r.other_fixed_costs ?? r.fixed_costs)!)}
                              {pctUnderRevenue(r.other_fixed_costs ?? r.fixed_costs, rev) ? (
                                <span className="bd-cell-sub">
                                  {pctUnderRevenue(r.other_fixed_costs ?? r.fixed_costs, rev)}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        {!commerce ? (
                          <td>{r.work_hours_per_week != null ? String(Math.round(r.work_hours_per_week)) : "N/A"}</td>
                        ) : null}
                        <td>{r.service_capacity ?? "N/A"}</td>
                        <td>
                          {r.ideal_service_profit_margin != null
                            ? `${Math.round(r.ideal_service_profit_margin)}%`
                            : "N/A"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <Link to={`/basic-data/${r.id}/edit`} className="btn-ghost" style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem" }}>
                              Editar
                            </Link>
                            <button
                              type="button"
                              className="btn-ghost btn-ghost--danger"
                              style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem" }}
                              disabled={pending}
                              onClick={() => void removeRow(r.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {emptyFiltered ? (
                    <tr className="bd-no-results">
                      <td colSpan={commerce ? 9 : 12} style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted)" }}>
                        Nenhum registro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
