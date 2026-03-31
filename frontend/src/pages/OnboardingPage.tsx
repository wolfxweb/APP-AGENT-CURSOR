import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiJson } from "../api/http";
import type { UserMe } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

const ANA_PUBLIC_IMAGE = "/ana.png";

export default function OnboardingPage() {
  const nav = useNavigate();
  const { refresh, user, loading } = useAuth();
  const [margin, setMargin] = useState("");
  const [capacity, setCapacity] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** null = ainda verificando; true = usar foto em /ana.png; false = placeholder */
  const [anaPhotoOk, setAnaPhotoOk] = useState<boolean | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAnaPhotoOk(true);
    img.onerror = () => setAnaPhotoOk(false);
    img.src = ANA_PUBLIC_IMAGE;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await apiJson<UserMe>("/auth/onboarding", {
        method: "POST",
        body: JSON.stringify({
          ideal_profit_margin: margin === "" ? null : Number(margin),
          service_capacity: capacity || null,
        }),
      });
      await refresh();
      nav("/", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao salvar");
    } finally {
      setPending(false);
    }
  }

  async function skip() {
    setPending(true);
    setErr(null);
    try {
      await apiJson<UserMe>("/auth/onboarding", {
        method: "POST",
        body: JSON.stringify({
          ideal_profit_margin: null,
          service_capacity: null,
        }),
      });
      await refresh();
      nav("/", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Falha ao salvar");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) nav("/auth/login", { replace: true });
    else if (user.onboarding_completed) nav("/", { replace: true });
  }, [loading, user, nav]);

  if (loading || !user || user.onboarding_completed) {
    return (
      <div className="auth-shell">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="auth-shell fade-in">
      <div className="auth-card auth-card-wide">
        <h1 className="auth-title">Quase lá</h1>
        <div className="register-body">
          <div
            className="register-guide-photo register-guide-photo--ana"
            aria-hidden="true"
            title={anaPhotoOk ? "Ana" : "Personagem fictício (Ana)"}
          >
            {anaPhotoOk === true ? (
              <img src={ANA_PUBLIC_IMAGE} alt="" className="onboarding-ana-photo" />
            ) : (
              <span className="register-guide-initial">A</span>
            )}
          </div>
          <div className="register-main">
            <p className="auth-sub" style={{ marginTop: 0 }}>
              Olá! Sou a Ana. Se quiser, conte um pouco sobre sua meta de margem e sua capacidade de
              atendimento — isso ajuda o SuccessWay a personalizar diagnósticos. Tudo opcional.
            </p>
            <form onSubmit={onSubmit} className="stack">
              {err && (
                <div className="alert" role="alert">
                  {err}
                </div>
              )}
              <label className="label">
                Margem de lucro ideal (%)
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  placeholder="ex.: 25"
                />
              </label>
              <label className="label">
                Capacidade de atendimento (texto)
                <input
                  className="input"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="ex.: 40 clientes por mês"
                />
              </label>
              <button className="btn-primary" type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Concluir onboarding"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void skip()}
                disabled={pending}
              >
                Pular por agora
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
