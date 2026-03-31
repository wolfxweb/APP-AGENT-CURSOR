import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiJson, ApiError } from "../api/http";
import type { BasicData, BasicDataLog, UserMe } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { isWholesaleRetailCommerce } from "../components/basicData/activity";
import HelpDialog from "../components/basicData/HelpDialog";
import { formatMoneyPt, parseMoneyPt, percentOfPartOverRevenue } from "../components/basicData/money";
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

const FORM_HELP: Record<string, { title: string; body: string }> = {
  month: {
    title: "Mês",
    body: "Selecione o mês correspondente aos dados que você está registrando. Por padrão, sugere-se o mês anterior ao atual.",
  },
  year: {
    title: "Ano",
    body: "Insira o ano correspondente aos dados que você está registrando.",
  },
  clients: {
    title: "Clientes atendidos",
    body: "Informe o número total de clientes atendidos no período. Considere todos os clientes que receberam seus serviços ou produtos.",
  },
  revenue: {
    title: "Faturamento com vendas",
    body: "Registre o valor total de receitas geradas pelas vendas no período. Inclua todos os valores recebidos de clientes.",
  },
  salesExp: {
    title: "Gastos com vendas",
    body: "Informe todos os custos diretamente relacionados às vendas, como comissões, taxas de transação, despesas de marketing, etc.",
  },
  inputExp: {
    title: "Gastos com insumos e produtos",
    body: "Registre o valor gasto em matérias-primas, produtos para revenda ou insumos necessários para a produção ou prestação de serviços.",
  },
  proLabore: {
    title: "Pró-labore",
    body: "Registre o valor do pró-labore, que é a remuneração do empresário pelos serviços prestados à empresa.",
  },
  fixedMore: {
    title: "Demais custos fixos",
    body: "Registre outros custos fixos não cobertos anteriormente, como despesas administrativas, manutenção de equipamentos, etc.",
  },
  fixedCommerce: {
    title: "Custos fixos",
    body: "Informe os custos que permanecem constantes independentemente do volume de vendas, como aluguel, salários fixos, energia, água, etc.",
  },
  hours: {
    title: "Horas de trabalho por semana",
    body: "Informe o total de horas trabalhadas por semana. O máximo possível é 168 horas (7 dias × 24 horas).",
  },
  capacity: {
    title: "Capacidade de atendimento",
    body: "Descreva sua capacidade de atendimento, como número máximo de clientes, produtos que pode produzir, ou serviços que pode realizar.",
  },
  margin: {
    title: "Margem de lucro ideal",
    body: "Indique a porcentagem de lucro que você considera ideal para seu negócio após descontar todos os custos e despesas.",
  },
};

function defaultPreviousMonth(): string {
  const d = new Date();
  const cur = d.getMonth(); // 0 = Jan
  if (cur === 0) return "12";
  return String(cur);
}

type FormSnap = {
  month: string;
  year: string;
  clientsServed: string;
  salesRevenue: string;
  salesExpenses: string;
  inputProductExpenses: string;
  proLabore: string;
  otherFixedCosts: string;
  idealMargin: string;
  serviceCapacity: string;
  workHoursPerWeek: string;
  isCurrent: boolean;
};

function snapFromRow(r: BasicData): FormSnap {
  const margin =
    r.ideal_service_profit_margin ?? r.ideal_profit_margin;
  return {
    month: String(r.month),
    year: String(r.year),
    clientsServed: String(r.clients_served ?? 0),
    salesRevenue: r.sales_revenue != null ? formatMoneyPt(r.sales_revenue) : "",
    salesExpenses: r.sales_expenses != null ? formatMoneyPt(r.sales_expenses) : "",
    inputProductExpenses: r.input_product_expenses != null ? formatMoneyPt(r.input_product_expenses) : "",
    proLabore: r.pro_labore != null ? formatMoneyPt(r.pro_labore) : "",
    otherFixedCosts:
      (r.other_fixed_costs ?? r.fixed_costs) != null
        ? formatMoneyPt((r.other_fixed_costs ?? r.fixed_costs) as number)
        : "",
    idealMargin: margin != null ? String(margin) : "",
    serviceCapacity: r.service_capacity ?? "",
    workHoursPerWeek: r.work_hours_per_week != null ? String(Math.round(r.work_hours_per_week)) : "",
    isCurrent: r.is_current,
  };
}

function snapNewDefaults(user: UserMe): FormSnap {
  const margin = user.ideal_profit_margin;
  return {
    month: defaultPreviousMonth(),
    year: String(new Date().getFullYear()),
    clientsServed: "",
    salesRevenue: "",
    salesExpenses: "",
    inputProductExpenses: "",
    proLabore: "",
    otherFixedCosts: "",
    idealMargin: margin != null ? String(margin) : "",
    serviceCapacity: user.service_capacity ?? "",
    workHoursPerWeek: "",
    isCurrent: true,
  };
}

function HelpLabel({
  label,
  helpId,
  required,
  onHelp,
}: {
  label: string;
  helpId: string;
  required?: boolean;
  onHelp: (id: string) => void;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--brand-mid)" }}>
        {label}
        {required ? " *" : ""}
      </span>
      <button type="button" className="bd-help-chip" aria-label="Ajuda" onClick={() => onHelp(helpId)}>
        ?
      </button>
    </span>
  );
}

export default function BasicDataFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isNew = location.pathname.endsWith("/new");
  const editId = !isNew && id ? Number(id) : null;
  const nav = useNavigate();
  const { user, loading } = useAuth();

  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [activityEffective, setActivityEffective] = useState("");
  const [snap, setSnap] = useState<FormSnap | null>(null);

  const [month, setMonth] = useState(() => defaultPreviousMonth());
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [clientsServed, setClientsServed] = useState("");
  const [salesRevenue, setSalesRevenue] = useState("");
  const [salesExpenses, setSalesExpenses] = useState("");
  const [inputProductExpenses, setInputProductExpenses] = useState("");
  const [proLabore, setProLabore] = useState("");
  const [otherFixedCosts, setOtherFixedCosts] = useState("");
  const [idealMargin, setIdealMargin] = useState("");
  const [serviceCapacity, setServiceCapacity] = useState("");
  const [workHoursPerWeek, setWorkHoursPerWeek] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);

  const [formHelp, setFormHelp] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<number | null>(null);
  const [logs, setLogs] = useState<BasicDataLog[]>([]);
  const [logFilterText, setLogFilterText] = useState("");
  const [logFilterDate, setLogFilterDate] = useState("");
  const [logPage, setLogPage] = useState(1);
  const LOG_PAGE_SIZE = 10;

  const layoutCommerce = useMemo(
    () => isWholesaleRetailCommerce(activityEffective),
    [activityEffective],
  );

  const applySnap = useCallback((s: FormSnap) => {
    setMonth(s.month);
    setYear(s.year);
    setClientsServed(s.clientsServed);
    setSalesRevenue(s.salesRevenue);
    setSalesExpenses(s.salesExpenses);
    setInputProductExpenses(s.inputProductExpenses);
    setProLabore(s.proLabore);
    setOtherFixedCosts(s.otherFixedCosts);
    setIdealMargin(s.idealMargin);
    setServiceCapacity(s.serviceCapacity);
    setWorkHoursPerWeek(s.workHoursPerWeek);
    setIsCurrent(s.isCurrent);
  }, []);

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    if (!isNew && (editId === null || Number.isNaN(editId))) return;
    if (isNew) {
      const def = snapNewDefaults(user);
      setActivityEffective(user.activity_type);
      setSnap(def);
      applySnap(def);
    }
  }, [loading, user, isNew, applySnap]);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboarding_completed) {
      nav("/auth/onboarding", { replace: true });
      return;
    }
    if (isNew || editId === null || Number.isNaN(editId)) return;

    let cancelled = false;
    (async () => {
      try {
        const r = await apiJson<BasicData>(`/basic-data/${editId}`);
        if (cancelled) return;
        setActivityEffective(r.activity_type);
        const s = snapFromRow(r);
        setSnap(s);
        applySnap(s);
      } catch (ex) {
        if (!cancelled) setErr(ex instanceof Error ? ex.message : "Registro não encontrado");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, isNew, editId, nav, applySnap]);

  useEffect(() => {
    if (!editId || Number.isNaN(editId)) {
      setLogs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<BasicDataLog[]>(`/basic-data/${editId}/logs`);
        if (!cancelled) setLogs(data);
      } catch {
        if (!cancelled) setLogs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const pctSales = percentOfPartOverRevenue(salesExpenses, salesRevenue);
  const pctInput = percentOfPartOverRevenue(inputProductExpenses, salesRevenue);
  const pctPro = percentOfPartOverRevenue(proLabore, salesRevenue);
  const pctFixed = percentOfPartOverRevenue(otherFixedCosts, salesRevenue);

  const invalidPct = (display: string) => {
    const n = parseFloat(display.replace("%", "").replace(",", "."));
    return Number.isFinite(n) && n > 100;
  };

  const filteredLogs = useMemo(() => {
    const t = logFilterText.trim().toLowerCase();
    return logs.filter((log) => {
      if (t && !log.change_description.toLowerCase().includes(t)) return false;
      if (logFilterDate) {
        const d = new Date(log.created_at);
        const iso = d.toISOString().slice(0, 10);
        if (iso !== logFilterDate) return false;
      }
      return true;
    });
  }, [logs, logFilterText, logFilterDate]);

  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / LOG_PAGE_SIZE));
  const logPageSafe = Math.min(logPage, logTotalPages);
  const paginatedLogs = filteredLogs.slice(
    (logPageSafe - 1) * LOG_PAGE_SIZE,
    logPageSafe * LOG_PAGE_SIZE,
  );

  useEffect(() => {
    setLogPage(1);
  }, [logFilterText, logFilterDate, logs.length]);

  function buildPayload(): Record<string, unknown> {
    const rev = parseMoneyPt(salesRevenue);
    return {
      month: Number(month),
      year: Number(year),
      activity_type: activityEffective.trim(),
      clients_served: Number(clientsServed) || 0,
      sales_revenue: rev,
      sales_expenses: parseMoneyPt(salesExpenses),
      input_product_expenses: parseMoneyPt(inputProductExpenses),
      fixed_costs: null,
      pro_labore: layoutCommerce ? null : (proLabore.trim() === "" ? null : parseMoneyPt(proLabore)),
      other_fixed_costs: otherFixedCosts.trim() === "" ? null : parseMoneyPt(otherFixedCosts),
      ideal_profit_margin: null,
      ideal_service_profit_margin:
        idealMargin.trim() === "" ? null : Number(idealMargin.replace(",", ".")),
      service_capacity: serviceCapacity.trim() || null,
      work_hours_per_week: layoutCommerce
        ? null
        : workHoursPerWeek.trim() === ""
          ? null
          : Number(workHoursPerWeek),
      is_current: isCurrent,
    };
  }

  async function saveToAPI(targetId: number | null) {
    const body = buildPayload();
    if (targetId == null) {
      await apiJson<BasicData>("/basic-data", {
        method: "POST",
        body: JSON.stringify(body),
      });
    } else {
      await apiJson<BasicData>(`/basic-data/${targetId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!layoutCommerce) {
      if (clientsServed.trim() === "" || Number(clientsServed) < 0) {
        setErr("Informe a quantidade de clientes atendidos.");
        return;
      }
      if (otherFixedCosts.trim() === "") {
        setErr("Demais custos fixos é obrigatório.");
        return;
      }
    }
    const wh = workHoursPerWeek.trim() === "" ? null : Number(workHoursPerWeek);
    if (!layoutCommerce && wh != null && (wh < 0 || wh > 168)) {
      setErr("Horas por semana deve estar entre 0 e 168.");
      return;
    }
    if (parseMoneyPt(salesRevenue) <= 0 && (salesRevenue.trim() !== "")) {
      /* allow zero? template requires revenue */
    }
    if (salesRevenue.trim() === "" || parseMoneyPt(salesRevenue) < 0) {
       setErr("Informe o faturamento com vendas.");
       return;
    }

    setPending(true);
    try {
      if (isNew) {
        try {
          await saveToAPI(null);
          nav("/basic-data");
        } catch (ex) {
          if (ex instanceof ApiError && ex.status === 409) {
            const all = await apiJson<BasicData[]>("/basic-data");
            const hit = all.find((r) => r.month === Number(month) && r.year === Number(year));
            if (hit) setReplaceTargetId(hit.id);
            else setErr(ex.message);
          } else throw ex;
        }
      } else if (editId != null) {
        await saveToAPI(editId);
        nav("/basic-data");
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Não foi possível salvar");
    } finally {
      setPending(false);
    }
  }

  async function confirmReplace() {
    if (replaceTargetId == null) return;
    setPending(true);
    setErr(null);
    try {
      await saveToAPI(replaceTargetId);
      setReplaceTargetId(null);
      nav("/basic-data");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Não foi possível atualizar");
    } finally {
      setPending(false);
    }
  }

  function onClear() {
    if (snap) applySnap(snap);
    else if (user) applySnap(snapNewDefaults(user));
  }

  if (loading || !user?.onboarding_completed) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  if (!isNew && (editId === null || Number.isNaN(editId))) {
    return (
      <div className="dash-wrap">
        <p className="alert">Identificador inválido.</p>
        <Link to="/basic-data">Voltar</Link>
      </div>
    );
  }

  const monthLocked = !isNew;

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      {formHelp && FORM_HELP[formHelp] ? (
        <HelpDialog open title={FORM_HELP[formHelp].title} onClose={() => setFormHelp(null)}>
          <p>{FORM_HELP[formHelp].body}</p>
        </HelpDialog>
      ) : null}

      {replaceTargetId != null ? (
        <div className="bd-modal-root" role="presentation" onClick={() => setReplaceTargetId(null)}>
          <div className="bd-modal-panel" role="dialog" onClick={(e) => e.stopPropagation()}>
            <header className="bd-modal-header">
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Registro existente</h2>
              <button type="button" className="bd-modal-close" aria-label="Fechar" onClick={() => setReplaceTargetId(null)}>
                ×
              </button>
            </header>
            <div className="bd-modal-body">
              <p>Já existe um registro para o período selecionado. Deseja atualizar os dados existentes?</p>
              <p className="muted small">Ao confirmar, as alterações serão registradas no histórico de mudanças.</p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" className="btn-ghost" onClick={() => setReplaceTargetId(null)}>
                  Não
                </button>
                <button type="button" className="btn-primary" disabled={pending} onClick={() => void confirmReplace()}>
                  Sim, atualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bd-page-bg">
        <Link to="/" className="muted small" style={{ textDecoration: "none" }}>
          ← Início
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">{isNew ? "Novo registro — dados básicos" : "Editar dados básicos"}</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Todos os valores referem-se ao mês e ano selecionados. Esses dados alimentam diagnóstico, importância dos
              meses e demais análises.
            </p>
            <p className="muted small" style={{ marginTop: "0.35rem" }}>
              Tipo de atividade: <strong>{activityEffective || user.activity_type}</strong>
            </p>
          </div>
          <Link
            to="/basic-data"
            className="btn-ghost"
            style={{ textAlign: "center", whiteSpace: "nowrap", alignSelf: "flex-start" }}
          >
            Histórico
          </Link>
        </header>

        <BasicDataScreenNav />

        <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
          {err ? (
            <div className="alert" role="alert">
              {err}
            </div>
          ) : null}

          <form onSubmit={(e) => void onSubmit(e)} className="stack">
                  <div className="grid2">
                    <label className="label" style={{ display: "block" }}>
                      <HelpLabel label="Mês" helpId="month" required onHelp={setFormHelp} />
                      <select
                        className="input"
                        value={month}
                        disabled={monthLocked}
                        onChange={(e) => setMonth(e.target.value)}
                      >
                        {MONTHS_PT.map((name, idx) => (
                          <option key={name} value={String(idx + 1)}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="label" style={{ display: "block" }}>
                      <HelpLabel label="Ano" helpId="year" required onHelp={setFormHelp} />
                      <input
                        className="input"
                        type="number"
                        min={2020}
                        max={2100}
                        value={year}
                        disabled={monthLocked}
                        onChange={(e) => setYear(e.target.value)}
                      />
                    </label>
                  </div>

                  {layoutCommerce ? (
                    <>
                      <label className="label">
                        <HelpLabel label="Faturamento com vendas" helpId="revenue" required onHelp={setFormHelp} />
                        <input
                          className="input"
                          inputMode="decimal"
                          value={salesRevenue}
                          onChange={(e) => setSalesRevenue(e.target.value)}
                          onBlur={() => setSalesRevenue((v) => (v.trim() ? formatMoneyPt(v) : ""))}
                        />
                      </label>
                      <label className="label">
                        <HelpLabel label="Quantidade de clientes atendidos" helpId="clients" onHelp={setFormHelp} />
                        <input
                          className="input"
                          type="number"
                          min={0}
                          value={clientsServed}
                          onChange={(e) => setClientsServed(e.target.value)}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="label">
                        <HelpLabel label="Quantidade de clientes atendidos" helpId="clients" required onHelp={setFormHelp} />
                        <input
                          className="input"
                          type="number"
                          min={0}
                          value={clientsServed}
                          onChange={(e) => setClientsServed(e.target.value)}
                        />
                      </label>
                      <label className="label">
                        <HelpLabel label="Faturamento com vendas" helpId="revenue" required onHelp={setFormHelp} />
                        <input
                          className="input"
                          inputMode="decimal"
                          value={salesRevenue}
                          onChange={(e) => setSalesRevenue(e.target.value)}
                          onBlur={() => setSalesRevenue((v) => (v.trim() ? formatMoneyPt(v) : ""))}
                        />
                      </label>
                    </>
                  )}

                  <label className="label">
                    <HelpLabel label="Gastos com vendas" helpId="salesExp" required onHelp={setFormHelp} />
                    <div className="bd-money-row">
                      <input
                        className="input"
                        inputMode="decimal"
                        value={salesExpenses}
                        onChange={(e) => setSalesExpenses(e.target.value)}
                        onBlur={() => setSalesExpenses((v) => (v.trim() ? formatMoneyPt(v) : ""))}
                      />
                      <input
                        className={`input ${invalidPct(pctSales) ? "bd-pct-invalid" : ""}`}
                        readOnly
                        value={pctSales}
                        title="% sobre o faturamento"
                      />
                    </div>
                  </label>

                  <label className="label">
                    <HelpLabel label="Gastos com insumos e produtos" helpId="inputExp" required onHelp={setFormHelp} />
                    <div className="bd-money-row">
                      <input
                        className="input"
                        inputMode="decimal"
                        value={inputProductExpenses}
                        onChange={(e) => setInputProductExpenses(e.target.value)}
                        onBlur={() => setInputProductExpenses((v) => (v.trim() ? formatMoneyPt(v) : ""))}
                      />
                      <input
                        className={`input ${invalidPct(pctInput) ? "bd-pct-invalid" : ""}`}
                        readOnly
                        value={pctInput}
                      />
                    </div>
                  </label>

                  {!layoutCommerce ? (
                    <label className="label">
                      <HelpLabel label="Pró-labore" helpId="proLabore" onHelp={setFormHelp} />
                      <div className="bd-money-row">
                        <input
                          className="input"
                          inputMode="decimal"
                          value={proLabore}
                          onChange={(e) => setProLabore(e.target.value)}
                          onBlur={() => setProLabore((v) => (v.trim() ? formatMoneyPt(v) : ""))}
                        />
                        <input
                          className={`input ${invalidPct(pctPro) ? "bd-pct-invalid" : ""}`}
                          readOnly
                          value={pctPro}
                        />
                      </div>
                    </label>
                  ) : null}

                  <label className="label">
                    <HelpLabel
                      label={layoutCommerce ? "Custos fixos" : "Demais custos fixos"}
                      helpId={layoutCommerce ? "fixedCommerce" : "fixedMore"}
                      required={!layoutCommerce}
                      onHelp={setFormHelp}
                    />
                    <div className="bd-money-row">
                      <input
                        className="input"
                        inputMode="decimal"
                        value={otherFixedCosts}
                        onChange={(e) => setOtherFixedCosts(e.target.value)}
                        onBlur={() => setOtherFixedCosts((v) => (v.trim() ? formatMoneyPt(v) : ""))}
                      />
                      <input
                        className={`input ${invalidPct(pctFixed) ? "bd-pct-invalid" : ""}`}
                        readOnly
                        value={pctFixed}
                      />
                    </div>
                  </label>

                  {!layoutCommerce ? (
                    <label className="label">
                      <HelpLabel label="Horas de trabalho por semana" helpId="hours" onHelp={setFormHelp} />
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={168}
                        step={1}
                        value={workHoursPerWeek}
                        onChange={(e) => setWorkHoursPerWeek(e.target.value)}
                      />
                    </label>
                  ) : null}

                  <label className="label">
                    <HelpLabel label="Capacidade de atendimento" helpId="capacity" onHelp={setFormHelp} />
                    <input
                      className="input"
                      value={serviceCapacity}
                      onChange={(e) => setServiceCapacity(e.target.value)}
                    />
                  </label>

                  <label className="label" style={{ maxWidth: 280, margin: "0 auto" }}>
                    <HelpLabel label="Margem de lucro ideal (%)" helpId="margin" onHelp={setFormHelp} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={idealMargin}
                        onChange={(e) => setIdealMargin(e.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </label>

                  <label className="check">
                    <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
                    Marcar como registro atual
                  </label>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button type="button" className="btn-ghost" onClick={onClear}>
                      Limpar
                    </button>
                    <button type="submit" className="btn-primary" disabled={pending}>
                      {pending ? "Salvando…" : isNew ? "Salvar" : "Atualizar"}
                    </button>
                  </div>
                </form>
        </div>

        {!isNew && editId != null ? (
          <div className="auth-card auth-card--full" style={{ marginTop: "1.25rem" }}>
            <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
              Histórico de alterações
            </h2>
            <div className="grid2" style={{ marginBottom: "0.75rem" }}>
                <input
                  className="input"
                  placeholder="Filtrar por descrição…"
                  value={logFilterText}
                  onChange={(e) => setLogFilterText(e.target.value)}
                />
                <input
                  className="input"
                  type="date"
                  value={logFilterDate}
                  onChange={(e) => setLogFilterDate(e.target.value)}
                />
              </div>
              <div className="bd-table-wrap">
              <table className="bd-table">
                <thead>
                  <tr>
                    <th>Descrição da alteração</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="muted" style={{ padding: "1rem" }}>
                        {logs.length === 0 ? "Nenhuma alteração registrada." : "Nenhuma alteração encontrada com os filtros."}
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{log.change_description}</td>
                        <td>{new Date(log.created_at).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
              {filteredLogs.length > LOG_PAGE_SIZE ? (
                <div className="bd-pagination">
                  <span>
                    Página {logPageSafe} de {logTotalPages} ({filteredLogs.length} registros)
                  </span>
                  <ul className="bd-page-btns">
                    <li>
                      <button type="button" disabled={logPageSafe <= 1} onClick={() => setLogPage(1)}>
                        ««
                      </button>
                    </li>
                    <li>
                      <button type="button" disabled={logPageSafe <= 1} onClick={() => setLogPage((p) => Math.max(1, p - 1))}>
                        «
                      </button>
                    </li>
                    <li>
                      <span className="bd-page-active">{logPageSafe}</span>
                    </li>
                    <li>
                      <button
                        type="button"
                        disabled={logPageSafe >= logTotalPages}
                        onClick={() => setLogPage((p) => Math.min(logTotalPages, p + 1))}
                      >
                        »
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        disabled={logPageSafe >= logTotalPages}
                        onClick={() => setLogPage(logTotalPages)}
                      >
                        »»
                      </button>
                    </li>
                  </ul>
                </div>
              ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
