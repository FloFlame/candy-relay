import type { LeadStatus } from "./types";

// Opportunity score → colour band (higher opportunity = weaker site = hotter lead).
export function opportunityTone(score: number | null | undefined): {
  text: string;
  bg: string;
  ring: string;
  label: string;
} {
  if (score == null)
    return { text: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", ring: "#cbd5e1", label: "Not audited" };
  if (score >= 60)
    return { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950", ring: "#f43f5e", label: "High opportunity" };
  if (score >= 35)
    return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", ring: "#f59e0b", label: "Medium opportunity" };
  return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", ring: "#10b981", label: "Low opportunity" };
}

export function healthTone(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 45) return "#f59e0b";
  return "#f43f5e";
}

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  contacted: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  replied: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function hostOf(url: string): string {
  if (!url) return "—";
  try {
    return new URL(/^https?:\/\//.test(url) ? url : "https://" + url).host;
  } catch {
    return url;
  }
}
