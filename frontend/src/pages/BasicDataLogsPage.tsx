import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiJson } from "../api/http";
import type { BasicDataLog } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export default function BasicDataLogsPage() {
  const { id } = useParams<{ id: string }>();
  const basicId = id ? Number(id) : NaN;
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<BasicDataLog[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user?.onboarding_completed) return;
    if (Number.isNaN(basicId)) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson<BasicDataLog[]>(`/basic-data/${basicId}/logs`);
        if (!cancelled) setLogs(data);
      } catch (ex) {
        if (!cancelled) {
          setErr(ex instanceof Error ? ex.message : "Falha ao carregar histórico");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, basicId]);

  if (loading || !user) {
    return (
      <div className="dash-wrap">
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  if (!user.onboarding_completed) {
    nav("/auth/onboarding", { replace: true });
    return null;
  }

  if (Number.isNaN(basicId)) {
    return (
      <div className="dash-wrap">
        <p className="alert">Registro inválido.</p>
        <Link to="/basic-data">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="dash-wrap bd-shell-wide fade-in">
      <Link to="/basic-data" className="muted small" style={{ textDecoration: "none" }}>
        ← Dados básicos
      </Link>
      <h1 className="dash-greet" style={{ marginTop: "0.75rem" }}>
        Histórico de alterações
      </h1>
      <p className="muted">Registro #{basicId}</p>

      {err && (
        <div className="alert" role="alert">
          {err}
        </div>
      )}

      {logs.length === 0 ? (
        <p className="muted">Nenhuma alteração registrada ainda.</p>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {logs.map((log) => (
            <li key={log.id} className="shortcut-card">
              <span className="shortcut-hint">
                {new Date(log.created_at).toLocaleString("pt-BR")}
              </span>
              <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                {log.change_description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
