import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicData, EventoVenda, MesImportancia } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import BasicDataScreenNav from "../components/basicData/ScreenNav";

const MESES_CAB = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

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

function cloneEventos(evs: EventoVenda[]): EventoVenda[] {
  return JSON.parse(JSON.stringify(evs)) as EventoVenda[];
}

function mesesIguais(a: number[] | null, b: number[] | null): boolean {
  const aa = [...(a ?? [])].sort((x, y) => x - y).join(",");
  const bb = [...(b ?? [])].sort((x, y) => x - y).join(",");
  return aa === bb;
}

function eventoChanged(a: EventoVenda, b: EventoVenda): boolean {
  return (
    a.nota !== b.nota ||
    a.aumenta_vendas !== b.aumenta_vendas ||
    a.diminui_vendas !== b.diminui_vendas ||
    !mesesIguais(a.meses_afetados, b.meses_afetados)
  );
}

export default function ImportanciaMesesCadastroPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [basicRows, setBasicRows] = useState<BasicData[]>([]);
  const [selectedBasicId, setSelectedBasicId] = useState("");
  const [eventos, setEventos] = useState<EventoVenda[]>([]);
  const initialRef = useRef<EventoVenda[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [basicInit, setBasicInit] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [evNome, setEvNome] = useState("");
  const [evNota, setEvNota] = useState("0");
  const [evAum, setEvAum] = useState(true);
  const [evDim, setEvDim] = useState(false);
  const [evMeses, setEvMeses] = useState<boolean[]>(() => Array(12).fill(false));
  const [modalSaving, setModalSaving] = useState(false);
  const [importYear, setImportYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    void (async () => {
      try {
        const rows = await apiJson<BasicData[]>("/basic-data");
        setBasicRows(rows);
      } catch {
        setErr("Não foi possível carregar dados básicos.");
      }
    })();
  }, [loading, user]);

  useEffect(() => {
    if (!basicRows.length || basicInit) return;
    setBasicInit(true);
    const cur = basicRows.find((r) => r.is_current);
    setSelectedBasicId(String((cur ?? basicRows[0]).id));
  }, [basicRows, basicInit]);

  useEffect(() => {
    const b = basicRows.find((x) => String(x.id) === selectedBasicId);
    if (b) setImportYear(b.year);
  }, [selectedBasicId, basicRows]);

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    let c = false;
    void (async () => {
      setPending(true);
      setErr(null);
      try {
        const evs = await apiJson<EventoVenda[]>("/eventos-venda");
        if (!c) {
          const copy = cloneEventos(evs);
          setEventos(copy);
          initialRef.current = cloneEventos(evs);
        }
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : "Erro ao carregar eventos");
      } finally {
        if (!c) setPending(false);
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

  function updateEvento(id: number, patch: Partial<EventoVenda>) {
    setEventos((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function toggleMesEv(id: number, month: number) {
    setEventos((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        const meses = [...(ev.meses_afetados ?? [])];
        const ix = meses.indexOf(month);
        if (ix >= 0) meses.splice(ix, 1);
        else meses.push(month);
        meses.sort((a, b) => a - b);
        return { ...ev, meses_afetados: meses };
      }),
    );
  }

  async function excluirEvento(id: number) {
    if (!window.confirm("Remover este evento personalizado?")) return;
    setErr(null);
    try {
      await apiJson(`/eventos-venda/${id}`, { method: "DELETE" });
      const fresh = await apiJson<EventoVenda[]>("/eventos-venda");
      setEventos(cloneEventos(fresh));
      initialRef.current = cloneEventos(fresh);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao remover");
    }
  }

  async function salvarModalEvento(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const nome = evNome.trim();
    if (!nome) {
      setErr("Informe o nome do evento.");
      return;
    }
    if (!evAum && !evDim) {
      setErr("Marque pelo menos um efeito (aumentam ou diminuem vendas).");
      return;
    }
    const mesesAfetados = evMeses.map((on, i) => (on ? i + 1 : 0)).filter((m) => m > 0);
    if (!mesesAfetados.length) {
      setErr("Selecione ao menos um mês.");
      return;
    }
    const nota = Number(String(evNota).replace(",", "."));
    if (!Number.isFinite(nota)) {
      setErr("Nota inválida.");
      return;
    }
    setModalSaving(true);
    try {
      await apiJson<EventoVenda>("/eventos-venda", {
        method: "POST",
        body: JSON.stringify({
          nome_evento: nome,
          nota,
          aumenta_vendas: evAum,
          diminui_vendas: evDim,
          meses_afetados: mesesAfetados,
        }),
      });
      const fresh = await apiJson<EventoVenda[]>("/eventos-venda");
      setEventos(cloneEventos(fresh));
      initialRef.current = cloneEventos(fresh);
      setEvNome("");
      setEvNota("0");
      setEvMeses(Array(12).fill(false));
      setModalOpen(false);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao criar evento");
    } finally {
      setModalSaving(false);
    }
  }

  async function salvarTudo() {
    const y = importYear;
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      setErr("Informe um ano válido entre 2000 e 2100.");
      return;
    }
    setErr(null);
    setSavePending(true);
    try {
      const baseline = initialRef.current;
      for (const ev of eventos) {
        const orig = baseline.find((o) => o.id === ev.id);
        if (!orig || eventoChanged(ev, orig)) {
          await apiJson<EventoVenda>(`/eventos-venda/${ev.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              nota: ev.nota,
              aumenta_vendas: ev.aumenta_vendas,
              diminui_vendas: ev.diminui_vendas,
              meses_afetados: ev.meses_afetados ?? [],
            }),
          });
        }
      }
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        nota_atribuida: null as number | null,
      }));
      await apiJson<MesImportancia[]>("/importancia-meses", {
        method: "PUT",
        body: JSON.stringify({ year: y, months }),
      });
      const fresh = await apiJson<EventoVenda[]>("/eventos-venda");
      setEventos(cloneEventos(fresh));
      initialRef.current = cloneEventos(fresh);
      nav("/importancia-meses");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Erro ao salvar.");
    } finally {
      setSavePending(false);
    }
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
        <Link to="/importancia-meses" className="muted small importancia-back-link" style={{ textDecoration: "none" }}>
          ← Voltar à visualização
        </Link>

        <header className="dash-header" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
          <div>
            <h1 className="bd-card-heading">Cadastrar importâncias dos meses</h1>
            <p className="muted" style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}>
              Ajuste notas, impacto nas vendas e meses afetados para cada evento (incluindo os 22 padrão). Escolha o{" "}
              <strong>ano da importância</strong> ao salvar (pode ser um ano novo, mesmo sem dados básicos daquele ano
              ainda). Opcionalmente use um dado básico para copiar o ano automaticamente.
            </p>
          </div>
        </header>

        <BasicDataScreenNav />

        {err ? (
          <div className="alert" role="alert" style={{ marginTop: "1rem" }}>
            {err}
          </div>
        ) : null}

        {basicRows.length === 0 ? (
          <div className="shortcut-card" style={{ marginTop: "1rem" }}>
            <p className="shortcut-hint" style={{ marginBottom: "0.85rem" }}>
              Você pode salvar a importância para qualquer ano abaixo. Para preencher <strong>vendas reais</strong> por
              mês na visualização, cadastre dados básicos daquele ano.
            </p>
            <Link to="/basic-data/new" className="btn-primary inline-block">
              Novo registro de dados básicos
            </Link>
          </div>
        ) : null}

        <>
            <div className="bd-filter-section" style={{ marginTop: "1rem" }}>
              <div className="bd-filter-grid">
                <label className="label" style={{ maxWidth: 420 }}>
                  Dado básico (opcional — copia o ano para o campo ao lado)
                  <select
                    className="input"
                    value={selectedBasicId}
                    onChange={(e) => setSelectedBasicId(e.target.value)}
                  >
                    <option value="">Nenhum — usar só o ano informado</option>
                    {basicRows.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {MONTHS_PT[r.month - 1]} / {r.year}
                        {r.is_current ? " (atual)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label" style={{ maxWidth: 140 }}>
                  Ano da importância
                  <input
                    className="input"
                    type="number"
                    min={2000}
                    max={2100}
                    value={importYear}
                    onChange={(e) => setImportYear(Number(e.target.value))}
                  />
                </label>
                <div style={{ justifySelf: "end", alignSelf: "end" }}>
                  <button type="button" className="btn-primary inline-block" onClick={() => setModalOpen(true)}>
                    Adicionar novo evento
                  </button>
                </div>
              </div>
              <p className="muted small" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                Ao salvar, a importância dos 12 meses de <strong>{importYear}</strong> é recalculada com base nos
                eventos (vendas reais só aparecem se existir dado básico naquele mês/ano).
              </p>
            </div>

            <div className="auth-card auth-card--full" style={{ marginTop: "1rem" }}>
              <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: "0 0 0.75rem" }}>
                Eventos que influenciam as vendas
              </h2>
              <p className="muted small" style={{ marginBottom: "0.85rem", maxWidth: "42rem" }}>
                Eventos padrão podem ser ajustados (nome fixo). Linhas extras podem ser excluídas. Ao salvar, a
                importância do ano é recalculada a partir dos eventos.
              </p>
              {pending ? (
                <p className="muted">Carregando eventos…</p>
              ) : (
                <div className="importancia-spreadsheet-wrap bd-table-wrap">
                  <table className="bd-table importancia-eventos-sheet">
                    <thead>
                      <tr>
                        <th>Nome do evento</th>
                        <th>Nota</th>
                        <th>AUMENTAM</th>
                        <th>DIMINUEM</th>
                        {MESES_CAB.map((abbr) => (
                          <th key={abbr}>{abbr}</th>
                        ))}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map((ev) => (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600, maxWidth: 220 }}>{ev.nome_evento}</td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className="input"
                              style={{ width: "5.5rem", padding: "0.35rem 0.45rem", fontSize: "0.82rem" }}
                              value={ev.nota}
                              onChange={(e) => {
                                const n = Number(e.target.value.replace(",", "."));
                                updateEvento(ev.id, { nota: Number.isFinite(n) ? n : 0 });
                              }}
                              aria-label={`Nota ${ev.nome_evento}`}
                            />
                          </td>
                          <td className="importancia-sheet-center">
                            <input
                              type="checkbox"
                              checked={ev.aumenta_vendas}
                              onChange={(e) => updateEvento(ev.id, { aumenta_vendas: e.target.checked })}
                              aria-label={`Aumentam vendas — ${ev.nome_evento}`}
                            />
                          </td>
                          <td className="importancia-sheet-center">
                            <input
                              type="checkbox"
                              checked={ev.diminui_vendas}
                              onChange={(e) => updateEvento(ev.id, { diminui_vendas: e.target.checked })}
                              aria-label={`Diminuem vendas — ${ev.nome_evento}`}
                            />
                          </td>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <td key={m} className="importancia-sheet-center">
                              <input
                                type="checkbox"
                                checked={(ev.meses_afetados ?? []).includes(m)}
                                onChange={() => toggleMesEv(ev.id, m)}
                                aria-label={`${ev.nome_evento} — ${MESES_CAB[m - 1]}`}
                              />
                            </td>
                          ))}
                          <td className="importancia-sheet-center">
                            {!ev.is_padrao ? (
                              <button
                                type="button"
                                className="btn-ghost btn-ghost--danger"
                                style={{ fontSize: "0.75rem", padding: "0.25rem 0.45rem" }}
                                onClick={() => void excluirEvento(ev.id)}
                              >
                                Excluir
                              </button>
                            ) : (
                              <span className="muted" style={{ fontSize: "0.72rem" }}>
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={savePending || pending}
                  onClick={() => void salvarTudo()}
                >
                  {savePending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
        </>

        {modalOpen ? (
          <div className="bd-modal-root" role="presentation" onClick={() => !modalSaving && setModalOpen(false)}>
            <div className="bd-modal-panel" role="dialog" onClick={(ev) => ev.stopPropagation()} style={{ maxWidth: 520 }}>
              <header className="bd-modal-header">
                <h2 className="bd-card-heading" style={{ fontSize: "1.2rem", margin: 0 }}>
                  Adicionar novo evento
                </h2>
                <button
                  type="button"
                  className="bd-modal-close"
                  aria-label="Fechar"
                  disabled={modalSaving}
                  onClick={() => setModalOpen(false)}
                >
                  ×
                </button>
              </header>
              <div className="bd-modal-body">
                <form onSubmit={(ev) => void salvarModalEvento(ev)}>
                  <label className="label">
                    Nome do evento
                    <input className="input" value={evNome} onChange={(e) => setEvNome(e.target.value)} autoComplete="off" />
                  </label>
                  <label className="label">
                    Nota
                    <input className="input" inputMode="decimal" value={evNota} onChange={(e) => setEvNota(e.target.value)} />
                    <span className="muted small">Peso numérico no cálculo do mês</span>
                  </label>
                  <fieldset style={{ border: "none", padding: 0, margin: "0 0 1rem" }}>
                    <legend className="importancia-divider-title" style={{ padding: 0 }}>
                      Tipo de impacto
                    </legend>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={evAum} onChange={(e) => setEvAum(e.target.checked)} />
                      Aumentam vendas
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", marginTop: "0.35rem" }}>
                      <input type="checkbox" checked={evDim} onChange={(e) => setEvDim(e.target.checked)} />
                      Diminuem vendas
                    </label>
                  </fieldset>
                  <p className="importancia-divider-title">Meses afetados</p>
                  <div className="importancia-mes-toggle-grid" role="group">
                    {MESES_CAB.map((abbr, i) => (
                      <button
                        key={abbr}
                        type="button"
                        className="importancia-mes-toggle"
                        aria-pressed={evMeses[i]}
                        onClick={() => {
                          const next = [...evMeses];
                          next[i] = !next[i];
                          setEvMeses(next);
                        }}
                      >
                        {abbr}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                    <button type="button" className="btn-ghost" disabled={modalSaving} onClick={() => setModalOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={modalSaving}>
                      {modalSaving ? "Salvando…" : "Salvar evento"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
