import type { LeadStatus } from "./types";

export function healthTone(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 45) return "#f59e0b";
  return "#f43f5e";
}

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  audited: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  contacted: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  replied: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  ignored: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

// Priority band → colour (from the backend's 0-45/46-70/71-100 bands).
export function priorityTone(priority: string | null | undefined) {
  if (priority === "high") return { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950", ring: "#f43f5e", label: "High priority" };
  if (priority === "medium") return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", ring: "#f59e0b", label: "Medium priority" };
  if (priority === "low") return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", ring: "#10b981", label: "Low priority" };
  return { text: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", ring: "#cbd5e1", label: "Not audited" };
}

export const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  info: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

export function hostOf(url: string): string {
  if (!url) return "—";
  try {
    return new URL(/^https?:\/\//.test(url) ? url : "https://" + url).host;
  } catch {
    return url;
  }
}

// Inline SVG site-preview as a data URI (Playwright screenshots are a later phase).
export function previewDataUri(url: string, opportunity: number | null): string {
  const host = hostOf(url) || "no-website";
  const score = opportunity == null ? "" :
    `<circle cx="560" cy="70" r="34" fill="#fff"/><text x="560" y="66" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#4f46e5">${opportunity}</text><text x="560" y="84" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#64748b">OPP</text>`;
  const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#eef2ff"/><rect width="640" height="44" fill="#312e81"/><circle cx="24" cy="22" r="6" fill="#f87171"/><circle cx="46" cy="22" r="6" fill="#fbbf24"/><circle cx="68" cy="22" r="6" fill="#34d399"/><rect x="96" y="12" width="520" height="20" rx="10" fill="#4338ca"/><text x="112" y="27" font-family="monospace" font-size="13" fill="#c7d2fe">${esc(host)}</text><rect x="40" y="86" width="360" height="30" rx="6" fill="#818cf8"/><rect x="40" y="132" width="560" height="14" rx="7" fill="#a5b4fc"/><rect x="40" y="156" width="520" height="14" rx="7" fill="#a5b4fc"/><rect x="40" y="230" width="170" height="110" rx="10" fill="#fff"/><rect x="235" y="230" width="170" height="110" rx="10" fill="#fff"/><rect x="430" y="230" width="170" height="110" rx="10" fill="#fff"/>${score}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
