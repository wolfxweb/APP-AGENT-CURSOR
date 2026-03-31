const apiBase = "/api/v1";

/** Evita vários redirects se várias chamadas falharem com 401 ao mesmo tempo. */
let authRedirectScheduled = false;

function normalizeApiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const q = p.indexOf("?");
  return q === -1 ? p : p.slice(0, q);
}

/**
 * 401 em /auth/me = visitante (AuthProvider trata).
 * 401 em POST /auth/login = senha errada (não redirecionar).
 */
function shouldRedirectOn401(path: string, init?: RequestInit): boolean {
  const pathname = normalizeApiPath(path);
  const method = (init?.method ?? "GET").toUpperCase();
  if (pathname === "/auth/me") return false;
  if (pathname === "/auth/login" && method === "POST") return false;
  return true;
}

function scheduleLoginRedirect(): void {
  if (typeof window === "undefined" || authRedirectScheduled) return;
  if (window.location.pathname.startsWith("/auth/login")) return;
  authRedirectScheduled = true;
  window.location.replace("/auth/login");
}

/** Erro de API com status HTTP (ex.: 409 conflito). */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Evita tela “travada” se a API estiver fora ou o proxy não alcançar o backend (padrão 45s). */
const DEFAULT_TIMEOUT_MS = 45_000;

export function apiUrl(path: string): string {
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = DEFAULT_TIMEOUT_MS;
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  let r: Response;
  try {
    r = await fetch(apiUrl(path), {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      credentials: "include",
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(
        "Tempo esgotado ao falar com o servidor. Confira: (1) API no ar — no projeto, na raiz: `docker compose up --build` ou `cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000`; (2) use o front em http://localhost:5173 para o proxy `/api` apontar para o backend; (3) teste http://127.0.0.1:8000/api/v1/health no navegador.",
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar à API. Verifique sua rede e se o servidor está no ar.",
      );
    }
    throw e;
  } finally {
    clearTimeout(tid);
  }

  if (!r.ok) {
    let msg = r.status === 401 ? "Sessão expirada ou não autenticado" : `Erro ${r.status}`;
    try {
      const body = await r.json();
      if (typeof body.detail === "string") msg = body.detail;
      else if (Array.isArray(body.detail)) {
        const parts = body.detail
          .map((d: { loc?: unknown[]; msg?: string }) =>
            d?.msg ? `${Array.isArray(d.loc) ? d.loc.filter((x) => x !== "body").join(".") : ""}: ${d.msg}`.replace(/^: /, "") : "",
          )
          .filter(Boolean);
        if (parts.length) msg = parts.join("; ");
        else {
          const first = body.detail[0];
          if (first?.msg) msg = `${first.loc?.join(".")}: ${first.msg}`;
        }
      }
    } catch {
      /* ignore */
    }
    if (r.status === 401 && shouldRedirectOn401(path, init)) {
      scheduleLoginRedirect();
    }
    throw new ApiError(msg, r.status);
  }

  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}
