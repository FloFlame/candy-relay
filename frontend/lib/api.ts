// Typed client for the Leadly FastAPI backend.
// Tokens live in localStorage; a 401 transparently refreshes once.

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
export function isAuthed(): boolean {
  return !!getAccess();
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

async function rawFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const token = getAccess();
  if (token) headers["authorization"] = `Bearer ${token}`;
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = opts;
  let res = await rawFetch(path, method, body);
  if (res.status === 401 && (await refresh())) {
    res = await rawFetch(path, method, body);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** Fetch an authenticated file and trigger a browser download. */
export async function download(path: string, filename: string) {
  let res = await rawFetch(path, "GET");
  if (res.status === 401 && (await refresh())) res = await rawFetch(path, "GET");
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api("/auth/register", { method: "POST", body: { email, password, name } }),
  login: (email: string, password: string) =>
    api("/auth/login", { method: "POST", body: { email, password } }),
  me: () => api("/auth/me"),
};

export const finderApi = {
  search: (niche: string, city: string, limit = 20) =>
    api("/finder/search", { method: "POST", body: { niche, city, limit } }),
  import: (items: unknown[]) => api("/finder/import", { method: "POST", body: { items } }),
};

export const leadsApi = {
  list: (query = "") => api(`/leads${query}`),
  get: (id: string) => api(`/leads/${id}`),
  patch: (id: string, body: unknown) => api(`/leads/${id}`, { method: "PATCH", body }),
  remove: (id: string) => api(`/leads/${id}`, { method: "DELETE" }),
  audit: (id: string) => api(`/leads/${id}/audit`, { method: "POST" }),
  outreach: (id: string, variant: string, language?: string, sender?: string) =>
    api(`/leads/${id}/outreach`, { method: "POST", body: { variant, language, sender } }),
  competitors: (id: string) => api(`/leads/${id}/competitors`, { method: "POST" }),
};

export const accountApi = {
  usage: () => api("/account/usage"),
  updateProfile: (name: string) => api("/account/profile", { method: "PATCH", body: { name } }),
  changePassword: (current_password: string, new_password: string) =>
    api("/account/password", { method: "POST", body: { current_password, new_password } }),
};

export const licenseApi = {
  mine: () => api("/licenses/mine"),
  devices: () => api("/licenses/devices"),
  activate: (key: string, device_id: string, device_name: string, os: string) =>
    api("/licenses/activate", { method: "POST", body: { key, device_id, device_name, os } }),
  deactivate: (id: string) => api(`/licenses/devices/${id}`, { method: "DELETE" }),
};

export const adminApi = {
  stats: () => api("/admin/stats"),
  users: (q = "") => api(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  patchUser: (id: string, body: unknown) => api(`/admin/users/${id}`, { method: "PATCH", body }),
  licenses: () => api("/admin/licenses"),
  createLicense: (type: string, user_email?: string) =>
    api("/admin/licenses", { method: "POST", body: { type, user_email } }),
  licenseAction: (id: string, action: string) =>
    api(`/admin/licenses/${id}/${action}`, { method: "POST" }),
};
