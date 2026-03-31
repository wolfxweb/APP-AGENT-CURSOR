import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const LOGO_PUBLIC = "/logo-successway.png";

export default function AppNavBar() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const onOnboardingPath = location.pathname.startsWith("/auth/onboarding");
  const [hasLogo, setHasLogo] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasLogo(true);
    img.onerror = () => setHasLogo(false);
    img.src = LOGO_PUBLIC;
  }, []);

  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <Link to="/" className="app-nav-brand" title="Início">
          <div className="app-nav-brand-stack">
            {hasLogo ? (
              <img src={LOGO_PUBLIC} alt="SuccessWay" className="app-nav-logo" decoding="async" />
            ) : (
              <span className="app-nav-wordmark app-nav-wordmark--fx">SuccessWay</span>
            )}
            <span className="app-nav-tag">Gestão descomplicada</span>
          </div>
        </Link>

        <nav className="app-nav-actions" aria-label="Conta">
          {loading ? (
            <span className="muted small">Carregando…</span>
          ) : user?.onboarding_completed ? (
            <>
              <Link to="/profile" className="btn-ghost app-nav-btn">
                Perfil
              </Link>
              <button type="button" className="btn-ghost app-nav-btn" onClick={() => void logout()}>
                Sair
              </button>
            </>
          ) : user ? (
            onOnboardingPath ? (
              <button type="button" className="btn-ghost app-nav-btn" onClick={() => void logout()}>
                Sair
              </button>
            ) : (
              <Link to="/auth/onboarding" className="btn-ghost app-nav-btn">
                Continuar cadastro
              </Link>
            )
          ) : (
            <Link to="/auth/login" className="btn-ghost app-nav-btn">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
