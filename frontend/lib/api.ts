// Typed client for the Leadly FastAPI backend.
//
// The frontend is being migrated from its built-in Next API routes to this
// backend (see docs/FEATURES.md → "Next phases"). New pages should call these
// helpers; tokens are kept in localStorage and refreshed on 401.

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const ACCESS_KEY = "leadly_access";
const REFRESH_KEY = "leadly_refresh";

export function getAccess(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refresh(): Promise<boolean> {
  const rt = typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
  if (!rt) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: rt }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return true;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; raw?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, raw = false } = opts;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    const token = getAccess();
    if (auth && token) headers["authorization"] = `Bearer ${token}`;
    return fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401 && auth && (await refresh())) {
    res = await doFetch();
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail || detail;
    } catch {}
    throw new Error(detail);
  }
  if (raw) return res as unknown as T;
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// Convenience wrappers
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api("/auth/register", { method: "POST", body: { email, password, name }, auth: false }),
  login: (email: string, password: string) =>
    api("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => api("/auth/me"),
};

export const leadsApi = {
  list: (params = "") => api(`/leads${params}`),
  get: (id: string) => api(`/leads/${id}`),
  audit: (id: string) => api(`/leads/${id}/audit`, { method: "POST" }),
  outreach: (id: string, variant: string, language?: string) =>
    api(`/leads/${id}/outreach`, { method: "POST", body: { variant, language } }),
  patch: (id: string, body: unknown) => api(`/leads/${id}`, { method: "PATCH", body }),
};

export const finderApi = {
  search: (niche: string, city: string, limit = 20) =>
    api("/finder/search", { method: "POST", body: { niche, city, limit } }),
  import: (items: unknown[]) => api("/finder/import", { method: "POST", body: { items } }),
};
