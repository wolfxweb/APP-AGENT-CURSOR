import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { UserMe } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import {
  ACTIVITY_TYPE_OPTIONS,
  type ActivityTypeOption,
  SPECIALTY_BY_ACTIVITY,
} from "../data/specialtyAreas";

type ViaCepJson = { erro?: boolean; uf?: string; localidade?: string };

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function formatCepDisplay(d8: string): string {
  if (d8.length <= 5) return d8;
  return `${d8.slice(0, 5)}-${d8.slice(5, 8)}`;
}

function maskWhatsAppInput(raw: string): string {
  let v = onlyDigits(raw).slice(0, 11);
  if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
  return v;
}

function progressBadge(step: number): string | null {
  if (step === 1) return "1 de 6";
  if (step === 2) return "2 de 6";
  if (step === 3) return "4 a 6 de 6";
  return null;
}

async function fetchViaCep(cep8: string): Promise<{ ok: boolean; uf: string; city: string }> {
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep8}/json/`);
    const data = (await r.json()) as ViaCepJson;
    if (!r.ok || data.erro) return { ok: false, uf: "", city: "" };
    return { ok: true, uf: data.uf ?? "", city: data.localidade ?? "" };
  } catch {
    return { ok: false, uf: "", city: "" };
  }
}

export default function RegisterPage() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  /** 0 = intro João, 1 = nome+termos, 2 = setor+ramo+CEP, 3 = credenciais, 4 = chave */
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cepLookupPending, setCepLookupPending] = useState(false);

  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [activityType, setActivityType] = useState<ActivityTypeOption | "">("");
  const [specialtyArea, setSpecialtyArea] = useState("");
  const [cep, setCep] = useState("");
  const [cepUf, setCepUf] = useState("");
  const [cepCity, setCepCity] = useState("");

  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [activationKey, setActivationKey] = useState("");

  const nameTrim = name.trim();
  const showPrazer = nameTrim.length > 0;
  const specialties =
    activityType && activityType in SPECIALTY_BY_ACTIVITY
      ? [...SPECIALTY_BY_ACTIVITY[activityType as ActivityTypeOption]]
      : [];

  function onActivityChange(v: ActivityTypeOption | "") {
    setActivityType(v);
    setSpecialtyArea("");
  }

  function onTermsCheck(checked: boolean) {
    setTerms(checked);
    if (checked) {
      if (!nameTrim) {
        setErr("Por favor, informe como gostaria de ser chamado(a).");
        setTerms(false);
        return;
      }
      setErr(null);
      setStep(2);
    }
  }

  async function goSectorContinue() {
    setErr(null);
    if (!activityType) {
      setErr("Selecione o setor de atuação.");
      return;
    }
    if (!specialtyArea) {
      setErr("Selecione o ramo de atuação.");
      return;
    }
    const d = onlyDigits(cep);
    if (d.length !== 8) {
      setErr("Informe um CEP válido com 8 dígitos.");
      return;
    }
    let uf = cepUf;
    let city = cepCity;
    if (!uf || !city) {
      setCepLookupPending(true);
      const res = await fetchViaCep(d);
      setCepLookupPending(false);
      if (!res.ok) {
        setErr("CEP não encontrado. Verifique os números digitados.");
        return;
      }
      uf = res.uf;
      city = res.city;
      setCepUf(uf);
      setCepCity(city);
    }
    if (!uf || !city) {
      setErr("Não foi possível obter UF e cidade a partir do CEP.");
      return;
    }
    setStep(3);
  }

  function goCredentialsContinue() {
    setErr(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr("Informe um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      setErr("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setErr("As senhas não coincidem.");
      return;
    }
    const w = onlyDigits(whatsapp);
    if (whatsapp.trim() !== "" && w.length < 8) {
      setErr("WhatsApp inválido ou deixe em branco.");
      return;
    }
    setStep(4);
  }

  function goBack() {
    setErr(null);
    if (step === 1) setStep(0);
    else if (step === 2) {
      setTerms(false);
      setStep(1);
    } else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  async function onCepBlur() {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepLookupPending(true);
    const res = await fetchViaCep(d);
    setCepLookupPending(false);
    if (res.ok) {
      setCepUf(res.uf);
      setCepCity(res.city);
    } else {
      setCepUf("");
      setCepCity("");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!activityType || !specialtyArea) {
      setErr("Dados incompletos. Volte e preencha setor e ramo de atuação.");
      return;
    }
    const k = activationKey.trim();
    if (!k) {
      setErr("Informe a chave de ativação.");
      return;
    }
    const d = onlyDigits(cep);
    const wDig = onlyDigits(whatsapp);
    setPending(true);
    const body: Record<string, unknown> = {
      name: nameTrim,
      email: email.trim(),
      password,
      terms_accepted: true,
      activation_key: k,
      activity_type: activityType as ActivityTypeOption,
      specialty_area: specialtyArea,
      cep: d,
      state: cepUf || undefined,
      city: cepCity || undefined,
    };
    if (wDig.length > 0) body.whatsapp = wDig;

    try {
      await apiJson<UserMe>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await refresh();
      nav("/auth/onboarding", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Não foi possível cadastrar");
    } finally {
      setPending(false);
    }
  }

  const badge = progressBadge(step);

  return (
    <div className="register-flow fade-in">
      <div className="register-card">
        <div className="register-card-header">
          <div className="register-brand">
            <span className="register-brand-name">SuccessWay</span>
            <span className="register-brand-tag">Gestão descomplicada</span>
          </div>
          {badge ? <span className="register-progress-pill">{badge}</span> : null}
        </div>

        <div className="register-body">
          <div className="register-guide-photo" aria-hidden="true" title="Personagem fictício (João)">
            <span className="register-guide-initial">J</span>
          </div>

          <div className="register-main">
            {err ? (
              <div className="alert" role="alert">
                {err}
              </div>
            ) : null}

            {step === 0 ? (
              <div className="stack register-step-copy">
                <p className="register-lead">
                  Olá! Eu sou o João.
                  <br />
                  Especialista em gestão comercial.
                </p>
                <p>
                  Se você tem uma loja sabe o quanto é preciso trabalhar para vender bem.
                  <br />
                  Aqui no SuccessWay estarei ao seu lado para ajudar a transformar seus números em decisões
                  que tragam mais lucro para sua loja.
                </p>
                <p className="register-lead">Vamos começar?</p>
                <div className="register-actions-center">
                  <button
                    type="button"
                    className="btn-primary btn-primary-lg"
                    onClick={() => {
                      setErr(null);
                      setStep(1);
                    }}
                  >
                    Sim, vamos
                  </button>
                </div>
                <p className="text-center muted small register-subtle">É rápido e prático!</p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="stack">
                <p className="register-step-title">Como posso te chamar?</p>
                <p className="muted small">Primeiro nome ou apelido</p>
                <input
                  type="text"
                  className="input input-register input-lg"
                  placeholder="Digite seu nome"
                  maxLength={50}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (terms) setTerms(false);
                  }}
                  autoComplete="given-name"
                  autoFocus
                />
                {showPrazer ? (
                  <div className="stack reveal">
                    <p className="register-step-title">
                      Prazer, {nameTrim}!
                    </p>
                    <p>Você já leu o termo de uso e confidencialidade do SuccessWay?</p>
                    <label className="check check-register">
                      <input
                        type="checkbox"
                        checked={terms}
                        onChange={(e) => onTermsCheck(e.target.checked)}
                      />
                      <span>
                        Li e aceito os{" "}
                        <Link to="/termos" className="link-terms" target="_blank" rel="noopener noreferrer">
                          termos e condições
                        </Link>
                      </span>
                    </label>
                  </div>
                ) : null}
                <div className="register-actions">
                  <button type="button" className="btn-ghost" onClick={goBack}>
                    Voltar
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void goSectorContinue();
                }}
              >
                <p className="register-step-title">
                  Ótimo, {nameTrim}!
                </p>
                <p className="muted small register-paragraph-gap">
                  Como você viu, o SuccessWay não acessa dados pessoais nem a identidade da sua loja.
                </p>
                <p className="register-paragraph-tight">Porém, precisamos de algumas informações:</p>
                <label className="label">
                  Em qual setor sua loja atua?
                  <select
                    className="input input-register input-lg"
                    value={activityType}
                    onChange={(e) =>
                      onActivityChange((e.target.value || "") as ActivityTypeOption | "")
                    }
                  >
                    <option value="">Selecione o setor</option>
                    {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Qual o seu ramo de atuação?
                  <select
                    className="input input-register input-lg"
                    value={specialtyArea}
                    onChange={(e) => setSpecialtyArea(e.target.value)}
                    disabled={!activityType}
                  >
                    <option value="">Selecione o ramo de atuação</option>
                    {specialties.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Informe o CEP da loja
                  <span className="muted small block register-hint-tight">
                    Utilizamos o CEP apenas para identificar sua região. Digite os 8 dígitos e clique
                    em Continuar.
                  </span>
                  <input
                    type="text"
                    className="input input-register input-lg"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="00000-000"
                    value={formatCepDisplay(onlyDigits(cep).slice(0, 8))}
                    onChange={(e) => {
                      setCep(onlyDigits(e.target.value).slice(0, 8));
                      setCepUf("");
                      setCepCity("");
                    }}
                    onBlur={() => void onCepBlur()}
                  />
                </label>
                {cepLookupPending ? (
                  <p className="muted small">Consultando CEP…</p>
                ) : cepUf && cepCity ? (
                  <p className="muted small">
                    Região: {cepCity} — {cepUf}
                  </p>
                ) : null}
                <div className="register-actions">
                  <button type="button" className="btn-ghost" onClick={goBack}>
                    Voltar
                  </button>
                  <button type="submit" className="btn-primary" disabled={cepLookupPending}>
                    Continuar
                  </button>
                </div>
              </form>
            ) : null}

            {step === 3 ? (
              <div className="stack">
                <p className="register-step-title">Porém, precisamos de algumas informações:</p>
                <label className="label">
                  Por favor, informe seu e-mail <span className="muted small">(4 de 6)</span>
                  <input
                    type="email"
                    className="input input-register input-lg"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
                <p className="muted small">Importante para recuperar sua senha e receber atualizações.</p>
                <label className="label">
                  O seu WhatsApp <span className="muted small">(5 de 6 — opcional)</span>
                  <input
                    type="text"
                    className="input input-register input-lg"
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(maskWhatsAppInput(e.target.value))}
                    autoComplete="tel"
                  />
                </label>
                <p className="muted small">Não é obrigatório. Além disso, você sempre poderá atualizar depois.</p>
                <label className="label">
                  Cadastre uma senha de acesso <span className="muted small">(6 de 6)</span>
                  <input
                    type="password"
                    className="input input-register input-lg"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <label className="label">
                  Confirmar senha
                  <input
                    type="password"
                    className="input input-register input-lg"
                    minLength={8}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <p className="muted small">
                  Recomendações para senha forte: use letras, números e símbolos.
                </p>
                <div className="register-actions">
                  <button type="button" className="btn-ghost" onClick={goBack}>
                    Voltar
                  </button>
                  <button type="button" className="btn-primary" onClick={goCredentialsContinue}>
                    Continuar
                  </button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <form className="stack" onSubmit={onSubmit}>
                <p className="register-step-title">Perfeito, {nameTrim}!</p>
                <p className="muted small register-paragraph-gap">
                  Esta etapa foi concluída com sucesso.
                  <br />
                  Agora é só digitar sua chave de ativação.
                </p>
                <label className="label">
                  Chave de ativação
                  <input
                    type="text"
                    className="input input-register input-lg"
                    placeholder="Chave de ativação"
                    autoComplete="off"
                    maxLength={64}
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                  />
                </label>
                <p className="muted small">
                  Em ambiente de testes você pode usar qualquer texto neste campo. Em produção, a chave
                  válida será fornecida pelo administrador.
                </p>
                <div className="register-actions">
                  <button type="button" className="btn-ghost" onClick={goBack} disabled={pending}>
                    Voltar
                  </button>
                  <button type="submit" className="btn-primary" disabled={pending}>
                    {pending ? "Enviando…" : "Finalizar cadastro"}
                  </button>
                </div>
              </form>
            ) : null}

            <p className="auth-footer register-login-link">
              <Link to="/auth/login">Já tenho conta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
