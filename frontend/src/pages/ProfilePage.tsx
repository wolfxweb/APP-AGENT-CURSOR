import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { UserMe } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

const ufs = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showMore, setShowMore] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [activityType, setActivityType] = useState("Serviços");
  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [married, setMarried] = useState(false);
  const [children, setChildren] = useState("");
  const [grandchildren, setGrandchildren] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [complement, setComplement] = useState("");
  const [companyActivity, setCompanyActivity] = useState("");
  const [specialtyArea, setSpecialtyArea] = useState("");
  const [idealMargin, setIdealMargin] = useState("");
  const [capacity, setCapacity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) nav("/auth/login", { replace: true });
    else if (!user.onboarding_completed)
      nav("/auth/onboarding", { replace: true });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setWhatsapp(user.whatsapp ?? "");
    setActivityType(user.activity_type);
    setGender(user.gender ?? "");
    setBirthDay(user.birth_day != null ? String(user.birth_day) : "");
    setBirthMonth(user.birth_month != null ? String(user.birth_month) : "");
    setMarried(user.married ?? false);
    setChildren(user.children != null ? String(user.children) : "");
    setGrandchildren(
      user.grandchildren != null ? String(user.grandchildren) : "",
    );
    setCep(user.cep ?? "");
    setStreet(user.street ?? "");
    setNeighborhood(user.neighborhood ?? "");
    setState(user.state ?? "");
    setCity(user.city ?? "");
    setComplement(user.complement ?? "");
    setCompanyActivity(user.company_activity ?? "");
    setSpecialtyArea(user.specialty_area ?? "");
    setIdealMargin(
      user.ideal_profit_margin != null ? String(user.ideal_profit_margin) : "",
    );
    setCapacity(user.service_capacity ?? "");
  }, [user]);

  useEffect(() => {
    if (!state || state.length !== 2) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setCitiesLoading(true);
    fetch(`/api/v1/geo/cities/${state}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: string[]) => {
        if (!cancelled) setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErr(null);
    setOk(null);
    setPending(true);
    const body: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      activity_type: activityType,
    };
    if (gender) body.gender = gender;
    if (birthDay !== "") body.birth_day = Number(birthDay);
    else body.birth_day = null;
    if (birthMonth !== "") body.birth_month = Number(birthMonth);
    else body.birth_month = null;
    body.married = married;
    if (children !== "") body.children = Number(children);
    else body.children = null;
    if (grandchildren !== "") body.grandchildren = Number(grandchildren);
    else body.grandchildren = null;
    body.cep = cep || null;
    body.street = street || null;
    body.neighborhood = neighborhood || null;
    body.state = state || null;
    body.city = city || null;
    body.complement = complement || null;
    body.company_activity = companyActivity || null;
    body.specialty_area = specialtyArea || null;
    if (idealMargin !== "") body.ideal_profit_margin = Number(idealMargin);
    else body.ideal_profit_margin = null;
    body.service_capacity = capacity || null;

    try {
      await apiJson<UserMe>("/profile/me", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      await refresh();
      setOk("Perfil atualizado.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao salvar");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user || !user.onboarding_completed) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <header className="dash-header">
        <div>
          <p className="muted small">
            <Link to="/">← Início</Link>
          </p>
          <h1 className="dash-greet">Meu perfil</h1>
        </div>
      </header>

      <div className="auth-card auth-card-wide" style={{ marginTop: "1rem" }}>
        <form onSubmit={onSubmit} className="stack">
          {err && (
            <div className="alert" role="alert">
              {err}
            </div>
          )}
          {ok && (
            <div
              className="alert"
              style={{
                background: "rgba(1, 57, 44, 0.08)",
                color: "rgb(1, 57, 44)",
              }}
              role="status"
            >
              {ok}
            </div>
          )}
          <div className="grid2">
            <label className="label">
              Nome
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="label">
              E-mail
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="label">
              WhatsApp
              <input
                className="input"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
            </label>
            <label className="label">
              Tipo de atividade
              <select
                className="input"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="Serviços">Serviços</option>
                <option value="Comércio">Comércio</option>
                <option value="Indústria">Indústria</option>
              </select>
            </label>
            <label className="label">
              Margem ideal (%)
              <input
                className="input"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={idealMargin}
                onChange={(e) => setIdealMargin(e.target.value)}
              />
            </label>
            <label className="label">
              Capacidade de atendimento
              <input
                className="input"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? "Ocultar endereço e dados pessoais" : "Mostrar mais"}
          </button>

          {showMore && (
            <div className="grid2 reveal">
              <label className="label">
                Gênero
                <select
                  className="input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">—</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Prefiro não informar">Prefiro não informar</option>
                </select>
              </label>
              <label className="label">
                Dia / mês nascimento
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="dia"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                  />
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={12}
                    placeholder="mês"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                  />
                </div>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={married}
                  onChange={(e) => setMarried(e.target.checked)}
                />
                Casado(a)
              </label>
              <label className="label">
                Filhos
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                />
              </label>
              <label className="label">
                Netos
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={grandchildren}
                  onChange={(e) => setGrandchildren(e.target.value)}
                />
              </label>
              <label className="label">
                CEP
                <input
                  className="input"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                />
              </label>
              <label className="label">
                Rua
                <input
                  className="input"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </label>
              <label className="label">
                Bairro
                <input
                  className="input"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </label>
              <label className="label">
                UF
                <select
                  className="input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">—</option>
                  {ufs.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                Cidade
                {state && cities.length > 0 ? (
                  <select
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={citiesLoading}
                  >
                    <option value="">
                      {citiesLoading ? "Carregando…" : "Selecione"}
                    </option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                )}
              </label>
              <label className="label">
                Complemento
                <input
                  className="input"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </label>
              <label className="label">
                Atividade da empresa
                <input
                  className="input"
                  value={companyActivity}
                  onChange={(e) => setCompanyActivity(e.target.value)}
                />
              </label>
              <label className="label">
                Área de especialidade
                <input
                  className="input"
                  value={specialtyArea}
                  onChange={(e) => setSpecialtyArea(e.target.value)}
                />
              </label>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}
