import { Chart, registerables } from "chart.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson, ApiError } from "../api/http";
import type { BasicData, Categoria, Produto } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import BasicDataScreenNav from "../components/basicData/ScreenNav";
import { calcularCamposComBasic } from "../lib/produtoCalculos";
import { computeCurvaAbc, produtosNaClasse, type AbcClasse, type CurvaAbcResult } from "../lib/produtoCurvaAbc";

Chart.register(...registerables);

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type ProdForm = {
  nome: string;
  categoriaId: string;
  basicDataId: string;
  faturamento_por_mercadoria: string;
  preco_venda: string;
  custo_aquisicao: string;
  percentual_faturamento: string;
  quantidade_vendas: string;
  gastos_com_vendas: string;
  gastos_com_compras: string;
  margem_contribuicao_informada: string;
  margem_contribuicao_corrigida: string;
  margem_contribuicao_valor: string;
  custos_fixos: string;
  ponto_equilibrio: string;
  margem_operacional: string;
};

function emptyProdForm(): ProdForm {
  return {
    nome: "",
    categoriaId: "",
    basicDataId: "",
    faturamento_por_mercadoria: "",
    preco_venda: "",
    custo_aquisicao: "",
    percentual_faturamento: "",
    quantidade_vendas: "",
    gastos_com_vendas: "",
    gastos_com_compras: "",
    margem_contribuicao_informada: "",
    margem_contribuicao_corrigida: "",
    margem_contribuicao_valor: "",
    custos_fixos: "",
    ponto_equilibrio: "",
    margem_operacional: "",
  };
}

function formFromProd(p: Produto): ProdForm {
  const s = (n: number | null | undefined) => (n == null ? "" : String(n));
  return {
    nome: p.nome,
    categoriaId: p.categoria_id == null ? "" : String(p.categoria_id),
    basicDataId: p.basic_data_id == null ? "" : String(p.basic_data_id),
    faturamento_por_mercadoria: s(p.faturamento_por_mercadoria),
    preco_venda: s(p.preco_venda),
    custo_aquisicao: s(p.custo_aquisicao),
    percentual_faturamento: s(p.percentual_faturamento),
    quantidade_vendas: s(p.quantidade_vendas),
    gastos_com_vendas: s(p.gastos_com_vendas),
    gastos_com_compras: s(p.gastos_com_compras),
    margem_contribuicao_informada: s(p.margem_contribuicao_informada),
    margem_contribuicao_corrigida: s(p.margem_contribuicao_corrigida),
    margem_contribuicao_valor: s(p.margem_contribuicao_valor),
    custos_fixos: s(p.custos_fixos),
    ponto_equilibrio: s(p.ponto_equilibrio),
    margem_operacional: s(p.margem_operacional),
  };
}

function optionalId(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function optionalFloat(v: string): number | null {
  const t = v.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function optionalInt(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseMoneyInput(v: string): number {
  const t = v.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return NaN;
  return Number(t);
}

function buildProdutoPayload(f: ProdForm): Record<string, unknown> {
  return {
    nome: f.nome.trim(),
    categoria_id: optionalId(f.categoriaId),
    basic_data_id: optionalId(f.basicDataId),
    faturamento_por_mercadoria: optionalFloat(f.faturamento_por_mercadoria),
    preco_venda: optionalFloat(f.preco_venda),
    custo_aquisicao: optionalFloat(f.custo_aquisicao),
    percentual_faturamento: optionalFloat(f.percentual_faturamento),
    quantidade_vendas: optionalInt(f.quantidade_vendas),
    gastos_com_vendas: optionalFloat(f.gastos_com_vendas),
    gastos_com_compras: optionalFloat(f.gastos_com_compras),
    margem_contribuicao_informada: optionalFloat(f.margem_contribuicao_informada),
    margem_contribuicao_corrigida: optionalFloat(f.margem_contribuicao_corrigida),
    margem_contribuicao_valor: optionalFloat(f.margem_contribuicao_valor),
    custos_fixos: optionalFloat(f.custos_fixos),
    ponto_equilibrio: optionalFloat(f.ponto_equilibrio),
    margem_operacional: optionalFloat(f.margem_operacional),
  };
}

function fmtBrl(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function fmtNum2(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return String(Math.round(n));
}

type TabId = "dashboard" | "produto" | "categoria";

function totaisCategoria(prods: Produto[]) {
  const faturamento = prods.reduce((s, p) => s + (p.faturamento_por_mercadoria ?? 0), 0);
  const gastosVendas = prods.reduce((s, p) => s + (p.gastos_com_vendas ?? 0), 0);
  const gastosCompras = prods.reduce((s, p) => s + (p.gastos_com_compras ?? 0), 0);
  const custosFixos = prods.reduce((s, p) => s + (p.custos_fixos ?? 0), 0);
  const totalGastos = gastosVendas + gastosCompras + custosFixos;
  const margemOperacional = faturamento > 0 ? ((faturamento - totalGastos) / faturamento) * 100 : 0;
  return {
    faturamento,
    quantidadeVendas: prods.reduce((s, p) => s + (p.quantidade_vendas ?? 0), 0),
    gastosVendas,
    gastosCompras,
    margemContribValor: prods.reduce((s, p) => s + (p.margem_contribuicao_valor ?? 0), 0),
    custosFixos,
    pontoEquilibrio: prods.reduce((s, p) => s + (p.ponto_equilibrio ?? 0), 0),
    margemOperacional,
  };
}

function ProdutoRowCells({
  p,
  pending,
  onEdit,
  onDelete,
}: {
  p: Produto;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <td className="bd-td-num">{fmtBrl(p.faturamento_por_mercadoria)}</td>
      <td className="bd-td-num">{fmtBrl(p.preco_venda)}</td>
      <td className="bd-td-num">{fmtBrl(p.custo_aquisicao)}</td>
      <td className="bd-td-num">{fmtInt(p.quantidade_vendas)}</td>
      <td className="bd-td-num">{fmtBrl(p.gastos_com_vendas)}</td>
      <td className="bd-td-num">{fmtBrl(p.gastos_com_compras)}</td>
      <td className="bd-td-num">{fmtPct(p.margem_contribuicao_informada)}</td>
      <td className="bd-td-num">{fmtPct(p.margem_contribuicao_corrigida)}</td>
      <td className="bd-td-num">{fmtBrl(p.margem_contribuicao_valor)}</td>
      <td className="bd-td-num">{fmtBrl(p.custos_fixos)}</td>
      <td className="bd-td-num">{fmtNum2(p.ponto_equilibrio)}</td>
      <td className="bd-td-num">{fmtPct(p.margem_operacional)}</td>
      <td>
        <div className="produtos-row-actions">
          <button type="button" className="btn-ghost btn--compact" disabled={pending} onClick={onEdit}>
            Editar
          </button>
          <button type="button" className="btn-ghost btn--compact btn-ghost--danger" disabled={pending} onClick={onDelete}>
            Excluir
          </button>
        </div>
      </td>
    </>
  );
}

export default function ProdutosPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [basicRows, setBasicRows] = useState<BasicData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [expandedAbc, setExpandedAbc] = useState<AbcClasse | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditingId, setCatEditingId] = useState<number | null>(null);
  const [catNome, setCatNome] = useState("");

  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState<ProdForm>(() => emptyProdForm());

  const curvaChartRef = useRef<{ destroy: () => void } | null>(null);
  const distChartRef = useRef<{ destroy: () => void } | null>(null);
  const curvaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const distCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const basicById = useMemo(() => {
    const m = new Map<number, BasicData>();
    for (const b of basicRows) m.set(b.id, b);
    return m;
  }, [basicRows]);

  const curvaData = useMemo(() => computeCurvaAbc(produtos), [produtos]);

  const loadAll = useCallback(async () => {
    setErr(null);
    try {
      const [cats, prods, basics] = await Promise.all([
        apiJson<Categoria[]>("/categorias"),
        apiJson<Produto[]>("/produtos"),
        apiJson<BasicData[]>("/basic-data"),
      ]);
      setCategorias(cats);
      setProdutos(prods);
      setBasicRows(basics);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao carregar");
    }
  }, []);

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
    void loadAll();
  }, [loading, user, nav, loadAll]);

  /* Recalcular campos derivados no modal de produto (espelho do legado). */
  useEffect(() => {
    if (!prodModalOpen) return;
    const preco = parseMoneyInput(prodForm.preco_venda);
    const custo = parseMoneyInput(prodForm.custo_aquisicao);
    const percRaw = prodForm.percentual_faturamento.trim().replace(",", ".");
    const perc = percRaw === "" ? 0 : Number(percRaw);
    const bid = prodForm.basicDataId.trim();
    const basic = bid ? basicById.get(Number(bid)) : undefined;

    const precoOk = Number.isFinite(preco) ? preco : 0;
    const custoOk = Number.isFinite(custo) ? custo : 0;
    const margemVal = precoOk - custoOk;

    const calc = calcularCamposComBasic(precoOk, custoOk, Number.isFinite(perc) ? perc : 0, basic, margemVal);

    setProdForm((prev) => ({
      ...prev,
      margem_contribuicao_valor: calc.margem_contribuicao_valor,
      margem_contribuicao_informada: calc.margem_contribuicao_informada,
      margem_contribuicao_corrigida: calc.margem_contribuicao_corrigida,
      faturamento_por_mercadoria: calc.faturamento_por_mercadoria,
      quantidade_vendas: calc.quantidade_vendas,
      gastos_com_vendas: calc.gastos_com_vendas,
      gastos_com_compras: calc.gastos_com_compras,
      custos_fixos: calc.custos_fixos,
      ponto_equilibrio: calc.ponto_equilibrio,
      margem_operacional: calc.margem_operacional,
    }));
  }, [prodModalOpen, prodForm.preco_venda, prodForm.custo_aquisicao, prodForm.percentual_faturamento, prodForm.basicDataId, basicById]);

  useEffect(() => {
    if (activeTab !== "dashboard" || !curvaData) {
      curvaChartRef.current?.destroy();
      curvaChartRef.current = null;
      distChartRef.current?.destroy();
      distChartRef.current = null;
      return;
    }

    const { curva_abc, resumo } = curvaData;
    const canvasBar = curvaCanvasRef.current;
    const canvasDonut = distCanvasRef.current;
    if (!canvasBar || !canvasDonut || curva_abc.length === 0) return;

    curvaChartRef.current?.destroy();
    distChartRef.current?.destroy();

    const labels = curva_abc.map((p) => (p.nome.length > 22 ? `${p.nome.slice(0, 22)}…` : p.nome));
    const faturamentos = curva_abc.map((p) => p.faturamento);
    const pctAcum = curva_abc.map((p) => p.percentual_acumulado);

    const ctxBar = canvasBar.getContext("2d");
    if (ctxBar) {
      curvaChartRef.current = new Chart(ctxBar, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Faturamento (R$)",
              data: faturamentos,
              backgroundColor: curva_abc.map((p) =>
                p.classe === "A" ? "rgba(40, 167, 69, 0.7)" : p.classe === "B" ? "rgba(255, 193, 7, 0.7)" : "rgba(220, 53, 69, 0.7)",
              ),
              borderColor: curva_abc.map((p) =>
                p.classe === "A" ? "rgba(40, 167, 69, 1)" : p.classe === "B" ? "rgba(255, 193, 7, 1)" : "rgba(220, 53, 69, 1)",
              ),
              borderWidth: 1,
            },
            {
              label: "% acumulado",
              data: pctAcum,
              type: "line",
              borderColor: "rgba(0, 123, 255, 1)",
              backgroundColor: "rgba(0, 123, 255, 0.08)",
              yAxisID: "y1",
              tension: 0.35,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: "Curva ABC — faturamento por produto" },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "Faturamento (R$)" } },
            y1: {
              type: "linear",
              position: "right",
              max: 100,
              title: { display: true, text: "% acumulado" },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    }

    const ctxDonut = canvasDonut.getContext("2d");
    if (ctxDonut) {
      const fatT = curvaData.faturamento_total || 1;
      distChartRef.current = new Chart(ctxDonut, {
        type: "doughnut",
        data: {
          labels: ["Classe A", "Classe B", "Classe C"],
          datasets: [
            {
              data: [resumo.classe_a.faturamento, resumo.classe_b.faturamento, resumo.classe_c.faturamento],
              backgroundColor: ["rgba(40, 167, 69, 0.75)", "rgba(255, 193, 7, 0.75)", "rgba(220, 53, 69, 0.75)"],
              borderColor: ["rgba(40, 167, 69, 1)", "rgba(255, 193, 7, 1)", "rgba(220, 53, 69, 1)"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: "Distribuição do faturamento por classe" },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const v = Number(c.parsed);
                  const pct = fatT > 0 ? (v / fatT) * 100 : 0;
                  return `${c.label}: ${fmtBrl(v)} (${pct.toFixed(2)}%)`;
                },
              },
            },
          },
        },
      });
    }

    return () => {
      curvaChartRef.current?.destroy();
      curvaChartRef.current = null;
      distChartRef.current?.destroy();
      distChartRef.current = null;
    };
  }, [activeTab, curvaData]);

  function openCatModal(c?: Categoria) {
    if (c) {
      setCatEditingId(c.id);
      setCatNome(c.nome);
    } else {
      setCatEditingId(null);
      setCatNome("");
    }
    setCatModalOpen(true);
  }

  async function saveCategoriaModal(e: React.FormEvent) {
    e.preventDefault();
    const nome = catNome.trim();
    if (!nome) return;
    setPending(true);
    setErr(null);
    try {
      if (catEditingId == null) {
        const c = await apiJson<Categoria>("/categorias", { method: "POST", body: JSON.stringify({ nome }) });
        setCategorias((prev) => [...prev, c].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      } else {
        const c = await apiJson<Categoria>(`/categorias/${catEditingId}`, {
          method: "PATCH",
          body: JSON.stringify({ nome }),
        });
        setCategorias((prev) => prev.map((x) => (x.id === catEditingId ? c : x)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      }
      setCatModalOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar categoria");
    } finally {
      setPending(false);
    }
  }

  async function removeCategoria(id: number) {
    if (!window.confirm("Excluir esta categoria? Reatribua ou exclua os produtos vinculados antes.")) return;
    setPending(true);
    setErr(null);
    try {
      await apiJson<undefined>(`/categorias/${id}`, { method: "DELETE" });
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      setProdutos((prev) => prev.map((p) => (p.categoria_id === id ? { ...p, categoria_id: null } : p)));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Erro ao excluir";
      setErr(msg);
    } finally {
      setPending(false);
    }
  }

  function openProdutoModal(p?: Produto) {
    if (p) {
      setEditingProdId(p.id);
      setProdForm(formFromProd(p));
    } else {
      setEditingProdId(null);
      setProdForm(emptyProdForm());
    }
    setProdModalOpen(true);
  }

  async function saveProdutoModal(e: React.FormEvent) {
    e.preventDefault();
    const nome = prodForm.nome.trim();
    if (!nome) {
      setErr("Informe o nome do produto.");
      return;
    }
    const pv = parseMoneyInput(prodForm.preco_venda);
    const ca = parseMoneyInput(prodForm.custo_aquisicao);
    if (!Number.isFinite(pv) || !Number.isFinite(ca)) {
      setErr("Informe preço de venda e custo de aquisição válidos.");
      return;
    }
    setPending(true);
    setErr(null);
    try {
      const payload = buildProdutoPayload(prodForm);
      if (editingProdId == null) {
        const created = await apiJson<Produto>("/produtos", { method: "POST", body: JSON.stringify(payload) });
        setProdutos((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      } else {
        const updated = await apiJson<Produto>(`/produtos/${editingProdId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setProdutos((prev) =>
          prev.map((p) => (p.id === editingProdId ? updated : p)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        );
      }
      setProdModalOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar produto");
    } finally {
      setPending(false);
    }
  }

  async function removeProduto(id: number, nome: string) {
    if (!window.confirm(`Excluir permanentemente “${nome}”?`)) return;
    setPending(true);
    setErr(null);
    try {
      await apiJson<undefined>(`/produtos/${id}`, { method: "DELETE" });
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setPending(false);
    }
  }

  const produtosPorCategoria = useMemo(() => {
    const map = new Map<number, Produto[]>();
    const sem: Produto[] = [];
    for (const p of produtos) {
      if (p.categoria_id != null) {
        const arr = map.get(p.categoria_id) ?? [];
        arr.push(p);
        map.set(p.categoria_id, arr);
      } else sem.push(p);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    sem.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const sortedCats = [...categorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const ordenadas = sortedCats.map((c) => ({ c, prods: map.get(c.id) ?? [] }));
    const knownIds = new Set(sortedCats.map((c) => c.id));
    for (const id of map.keys()) {
      if (!knownIds.has(id)) {
        ordenadas.push({
          c: {
            id,
            user_id: 0,
            nome: `Categoria #${id}`,
            created_at: "",
            updated_at: "",
          },
          prods: map.get(id) ?? [],
        });
      }
    }
    return { ordenadas, sem };
  }, [produtos, categorias]);

  const basicOptions = useMemo(
    () => [...basicRows].sort((a, b) => b.year - a.year || b.month - a.month),
    [basicRows],
  );

  const calcDicaQtd =
    prodModalOpen &&
    parseMoneyInput(prodForm.percentual_faturamento) > 0 &&
    prodForm.basicDataId.trim() !== "";

  const percNum = parseMoneyInput(prodForm.percentual_faturamento);
  const basicSel = prodForm.basicDataId.trim() ? basicById.get(Number(prodForm.basicDataId)) : undefined;
  let qtdCalculada = 0;
  if (basicSel && Number.isFinite(percNum) && percNum > 0) {
    qtdCalculada = Math.round((percNum / 100) * (basicSel.clients_served || 0));
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
            <h1 className="bd-card-heading">Produtos e categorias</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Curva ABC, cadastro de produtos e categorias — integrado ao restante do SuccessWay.
            </p>
          </div>
        </header>

        <BasicDataScreenNav />

        {err ? (
          <div className="alert" role="alert" style={{ marginBottom: "1rem" }}>
            {err}
          </div>
        ) : null}

        <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
          <div className="bd-tablist" role="tablist" aria-label="Seções de produto">
            {(
              [
                ["dashboard", "Dashboard"],
                ["produto", "Produto"],
                ["categoria", "Categoria"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={`bd-tab ${activeTab === id ? "bd-tab--active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bd-tab-panel">
              {activeTab === "dashboard" ? (
                <DashboardTab
                  curvaData={curvaData}
                  expandedAbc={expandedAbc}
                  setExpandedAbc={setExpandedAbc}
                  curvaCanvasRef={curvaCanvasRef}
                  distCanvasRef={distCanvasRef}
                />
              ) : null}

              {activeTab === "produto" ? (
                <div>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <button type="button" className="btn-primary" disabled={pending} onClick={() => openProdutoModal()}>
                      + Adicionar produto
                    </button>
                  </div>
                  <div className="bd-table-wrap">
                    <table className="bd-table produtos-table" id="produtosTable">
                      <thead>
                        <tr>
                          <th>Nome do produto</th>
                          <th>Faturamento por mercadoria</th>
                          <th>Preço de venda</th>
                          <th>Custo de aquisição</th>
                          <th>Qtd. vendas</th>
                          <th>Gastos com vendas</th>
                          <th>Gastos com compras</th>
                          <th>Margem contrib. informada (%)</th>
                          <th>Margem contrib. corrigida (%)</th>
                          <th>Margem contrib. (R$)</th>
                          <th>Custos fixos</th>
                          <th>Ponto de equilíbrio</th>
                          <th>Margem operacional</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtos.length === 0 ? (
                          <tr>
                            <td colSpan={14} className="muted">
                              Nenhum produto cadastrado.
                            </td>
                          </tr>
                        ) : (
                          <>
                            {produtosPorCategoria.ordenadas.map(({ c, prods }) =>
                              prods.length ? (
                                <FragmentGroupedCategory
                                  key={c.id}
                                  titulo={c.nome}
                                  prods={prods}
                                  totais={totaisCategoria(prods)}
                                  pending={pending}
                                  onEdit={openProdutoModal}
                                  onDelete={removeProduto}
                                />
                              ) : null,
                            )}
                            {produtosPorCategoria.sem.length ? (
                              <FragmentGroupedCategory
                                key="sem"
                                titulo="Sem categoria"
                                prods={produtosPorCategoria.sem}
                                totais={totaisCategoria(produtosPorCategoria.sem)}
                                pending={pending}
                                onEdit={openProdutoModal}
                                onDelete={removeProduto}
                              />
                            ) : null}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {activeTab === "categoria" ? (
                <div>
                  <div style={{ marginBottom: "0.85rem" }}>
                    <button type="button" className="btn-primary" disabled={pending} onClick={() => openCatModal()}>
                      + Adicionar categoria
                    </button>
                  </div>
                  <div className="bd-table-wrap">
                    <table className="bd-table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Nome</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorias.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="muted">
                              Nenhuma categoria cadastrada.
                            </td>
                          </tr>
                        ) : (
                          [...categorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((c) => (
                            <tr key={c.id}>
                              <td>
                                <strong>{c.id}</strong>
                              </td>
                              <td>{c.nome}</td>
                              <td>
                                <div className="produtos-row-actions">
                                  <button type="button" className="btn-ghost btn--compact" disabled={pending} onClick={() => openCatModal(c)}>
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-ghost btn--compact btn-ghost--danger"
                                    disabled={pending}
                                    onClick={() => void removeCategoria(c.id)}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
          </div>
        </div>
      </div>

      {catModalOpen ? (
        <div className="bd-modal-root" role="presentation" onClick={() => !pending && setCatModalOpen(false)}>
          <div className="bd-modal-panel" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <header className="bd-modal-header">
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{catEditingId == null ? "Adicionar categoria" : "Editar categoria"}</h2>
              <button type="button" className="bd-modal-close" aria-label="Fechar" disabled={pending} onClick={() => setCatModalOpen(false)}>
                ×
              </button>
            </header>
            <form onSubmit={(e) => void saveCategoriaModal(e)} className="bd-modal-body stack">
              <label className="label">
                Nome da categoria
                <input className="input" value={catNome} onChange={(e) => setCatNome(e.target.value)} required />
              </label>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" className="btn-ghost" disabled={pending} onClick={() => setCatModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={pending}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {prodModalOpen ? (
        <div className="bd-modal-root" role="presentation" onClick={() => !pending && setProdModalOpen(false)}>
          <div className="bd-modal-panel bd-modal-panel--lg" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <header className="bd-modal-header">
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{editingProdId == null ? "Adicionar produto" : "Editar produto"}</h2>
              <button type="button" className="bd-modal-close" aria-label="Fechar" disabled={pending} onClick={() => setProdModalOpen(false)}>
                ×
              </button>
            </header>
            <form onSubmit={(e) => void saveProdutoModal(e)} className="bd-modal-body stack" style={{ maxHeight: "min(78vh, 620px)", overflowY: "auto" }}>
              <h3 className="bd-card-heading" style={{ fontSize: "1.05rem", margin: "0.25rem 0 0.5rem" }}>
                Informações básicas
              </h3>
              <label className="label">
                <span className="label-caption">
                  Nome do produto <span className="label-req">*</span>
                </span>
                <input
                  className="input"
                  value={prodForm.nome}
                  onChange={(e) => setProdForm((f) => ({ ...f, nome: e.target.value }))}
                  required
                />
              </label>
              <div className="grid2">
                <label className="label">
                  Categoria
                  <select className="input" value={prodForm.categoriaId} onChange={(e) => setProdForm((f) => ({ ...f, categoriaId: e.target.value }))}>
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Dados básicos
                  <select
                    className="input"
                    value={prodForm.basicDataId}
                    onChange={(e) => setProdForm((f) => ({ ...f, basicDataId: e.target.value }))}
                  >
                    <option value="">Selecione um período</option>
                    {basicOptions.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {MONTHS_PT[b.month - 1]}/{b.year}
                        {b.is_current ? " (atual)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid2">
                <label className="label">
                  <span className="label-caption">
                    Preço de venda (R$) <span className="label-req">*</span>
                  </span>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={prodForm.preco_venda}
                    onChange={(e) => setProdForm((f) => ({ ...f, preco_venda: e.target.value }))}
                    required
                  />
                </label>
                <label className="label">
                  <span className="label-caption">
                    Custo de aquisição (R$) <span className="label-req">*</span>
                  </span>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={prodForm.custo_aquisicao}
                    onChange={(e) => setProdForm((f) => ({ ...f, custo_aquisicao: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label className="label">
                Percentual que o produto representa no faturamento (%)
                <input
                  className="input"
                  inputMode="decimal"
                  value={prodForm.percentual_faturamento}
                  onChange={(e) => setProdForm((f) => ({ ...f, percentual_faturamento: e.target.value }))}
                />
              </label>
              {calcDicaQtd ? (
                <div className="bd-hint-soft">
                  Com base nesta participação, as vendas teriam sido de <strong>{qtdCalculada}</strong> unidades. Caso não concorde, reveja o %
                  informado.
                </div>
              ) : null}

              <h3 className="bd-card-heading" style={{ fontSize: "1.05rem", margin: "0.85rem 0 0.35rem" }}>
                Campos calculados
              </h3>
              <p className="muted small">Atualizados automaticamente a partir de preço, custo, % e dados básicos.</p>
              <div className="grid2" style={{ marginTop: "0.5rem" }}>
                <ReadonlyField label="Faturamento por mercadoria (R$)" value={prodForm.faturamento_por_mercadoria} />
                <ReadonlyField label="Quantidade de vendas" value={prodForm.quantidade_vendas} />
                <ReadonlyField label="Gastos com vendas (R$)" value={prodForm.gastos_com_vendas} />
                <ReadonlyField label="Gastos com compras (R$)" value={prodForm.gastos_com_compras} />
                <ReadonlyField label="Margem contribuição (R$)" value={prodForm.margem_contribuicao_valor} />
                <ReadonlyField label="Margem contribuição informada (%)" value={prodForm.margem_contribuicao_informada} />
                <ReadonlyField label="Margem contribuição corrigida (%)" value={prodForm.margem_contribuicao_corrigida} />
                <ReadonlyField label="Custos fixos (R$)" value={prodForm.custos_fixos} />
                <ReadonlyField label="Ponto de equilíbrio" value={prodForm.ponto_equilibrio} />
                <ReadonlyField label="Margem operacional (%)" value={prodForm.margem_operacional} />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                <button type="button" className="btn-ghost" disabled={pending} onClick={() => setProdModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={pending}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="label">
      {label}
      <input className="input bd-input-muted" readOnly value={value} tabIndex={-1} />
    </label>
  );
}

function FragmentGroupedCategory({
  titulo,
  prods,
  totais,
  pending,
  onEdit,
  onDelete,
}: {
  titulo: string;
  prods: Produto[];
  totais: ReturnType<typeof totaisCategoria>;
  pending: boolean;
  onEdit: (p: Produto) => void;
  onDelete: (id: number, nome: string) => void;
}) {
  return (
    <>
      <tr className="bd-tr-produtos-cat-total">
        <td>
          <strong>{titulo}</strong> <small>(Total)</small>
        </td>
        <td className="bd-td-num">{fmtBrl(totais.faturamento)}</td>
        <td className="bd-td-num">—</td>
        <td className="bd-td-num">—</td>
        <td className="bd-td-num">{fmtInt(totais.quantidadeVendas)}</td>
        <td className="bd-td-num">{fmtBrl(totais.gastosVendas)}</td>
        <td className="bd-td-num">{fmtBrl(totais.gastosCompras)}</td>
        <td className="bd-td-num">—</td>
        <td className="bd-td-num">—</td>
        <td className="bd-td-num">{fmtBrl(totais.margemContribValor)}</td>
        <td className="bd-td-num">{fmtBrl(totais.custosFixos)}</td>
        <td className="bd-td-num">{fmtNum2(totais.pontoEquilibrio)}</td>
        <td className="bd-td-num">{fmtPct(totais.margemOperacional)}</td>
        <td>—</td>
      </tr>
      {prods.map((p) => (
        <tr key={p.id}>
          <td style={{ paddingLeft: "1.25rem" }}>{p.nome}</td>
          <ProdutoRowCells p={p} pending={pending} onEdit={() => onEdit(p)} onDelete={() => void onDelete(p.id, p.nome)} />
        </tr>
      ))}
    </>
  );
}

function DashboardTab({
  curvaData,
  expandedAbc,
  setExpandedAbc,
  curvaCanvasRef,
  distCanvasRef,
}: {
  curvaData: CurvaAbcResult | null;
  expandedAbc: AbcClasse | null;
  setExpandedAbc: (c: AbcClasse | null) => void;
  curvaCanvasRef: React.RefObject<HTMLCanvasElement>;
  distCanvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  if (!curvaData) {
    return (
      <div className="bd-filter-section" style={{ marginBottom: 0 }}>
        <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
          Análise Curva ABC
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Nenhum produto com faturamento por mercadoria cadastrado. Inclua valores na aba Produto para visualizar a curva.
        </p>
      </div>
    );
  }

  const { resumo, curva_abc, faturamento_total, quantidade_total } = curvaData;

  return (
    <div className="bd-filter-section" style={{ marginBottom: 0 }}>
      <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 1rem" }}>
        Análise Curva ABC
      </h2>
      <div className="bd-chart-grid-produtos">
        <div className="bd-chart-box-produtos">
          <canvas ref={curvaCanvasRef} aria-label="Gráfico curva ABC" />
        </div>
        <div className="bd-chart-box-produtos">
          <canvas ref={distCanvasRef} aria-label="Gráfico distribuição por classe" />
        </div>
      </div>
      <div className="bd-table-wrap" style={{ marginTop: "0.75rem" }}>
        <table className="bd-table">
          <thead>
            <tr>
              <th style={{ width: "2rem" }} />
              <th>Classe</th>
              <th>Quantidade</th>
              <th>Faturamento (R$)</th>
              <th>% do total</th>
            </tr>
          </thead>
          <tbody>
            {(["A", "B", "C"] as const).map((cl) => {
              const r = resumo[`classe_${cl.toLowerCase()}` as "classe_a" | "classe_b" | "classe_c"];
              const open = expandedAbc === cl;
              return (
                <FragmentAbcRow
                  key={cl}
                  classe={cl}
                  resumo={r}
                  open={open}
                  onToggle={() => setExpandedAbc(open ? null : cl)}
                  items={produtosNaClasse(curvaData, cl)}
                />
              );
            })}
            <tr className="bd-tr-abc-total">
              <td />
              <td>
                <strong>Total</strong>
              </td>
              <td>{quantidade_total}</td>
              <td>{fmtBrl(faturamento_total)}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      {curva_abc.length === 0 ? null : (
        <p className="muted small" style={{ marginTop: "0.75rem" }}>
          Classificação ABC por faixas acumuladas de faturamento (80% / 95%), como no painel clássico.
        </p>
      )}
    </div>
  );
}

function FragmentAbcRow({
  classe,
  resumo,
  open,
  onToggle,
  items,
}: {
  classe: AbcClasse;
  resumo: { quantidade: number; faturamento: number; percentual: number };
  open: boolean;
  onToggle: () => void;
  items: { id: number; nome: string; faturamento: number; percentual_produto: number; quantidade_vendas: number | null }[];
}) {
  const label = classe === "A" ? "Classe A" : classe === "B" ? "Classe B" : "Classe C";
  return (
    <>
      <tr className="bd-tr-abc" onClick={onToggle}>
        <td>{open ? "▼" : "▶"}</td>
        <td>
          <strong>{label}</strong>
        </td>
        <td>{resumo.quantidade}</td>
        <td>{fmtBrl(resumo.faturamento)}</td>
        <td>{resumo.percentual.toFixed(2)}%</td>
      </tr>
      {open
        ? items.map((it) => (
            <tr key={it.id} className="bd-tr-abc-detail">
              <td />
              <td style={{ paddingLeft: "1.5rem" }}>
                <small>{it.nome}</small>
              </td>
              <td>
                <small>{it.quantidade_vendas ?? "—"}</small>
              </td>
              <td>
                <small>{fmtBrl(it.faturamento)}</small>
              </td>
              <td>
                <small>{it.percentual_produto.toFixed(2)}%</small>
              </td>
            </tr>
          ))
        : null}
    </>
  );
}
