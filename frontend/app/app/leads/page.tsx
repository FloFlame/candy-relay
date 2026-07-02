"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { opportunityTone, STATUS_STYLES, hostOf } from "@/lib/ui";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [auditingAll, setAuditingAll] = useState(false);
  const [progress, setProgress] = useState(0);

  async function load() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.leads || []);
  }
  useEffect(() => {
    load();
  }, []);

  const shown = (leads || []).filter((l) => filter === "all" || l.status === filter);
  const unaudited = (leads || []).filter((l) => !l.audit);

  async function auditAll() {
    if (!leads) return;
    setAuditingAll(true);
    setProgress(0);
    const targets = leads.filter((l) => !l.audit);
    for (let i = 0; i < targets.length; i++) {
      await fetch(`/api/leads/${targets[i].id}/audit`, { method: "POST" });
      setProgress(i + 1);
    }
    await load();
    setAuditingAll(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leads</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Every prospect and its status in one view.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unaudited.length > 0 && (
            <button onClick={auditAll} disabled={auditingAll} className="btn-ghost px-4 py-2 text-sm disabled:opacity-60">
              {auditingAll ? `Auditing ${progress}/${unaudited.length}…` : `Audit ${unaudited.length} pending`}
            </button>
          )}
          <a href="/api/leads/export" className="btn-ghost px-4 py-2 text-sm">Export CSV</a>
          <Link href="/app/finder" className="btn-primary px-4 py-2 text-sm">Find more</Link>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[{ value: "all", label: "All" }, ...LEAD_STATUSES].map((s) => {
          const count = s.value === "all" ? leads?.length ?? 0 : (leads || []).filter((l) => l.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value as LeadStatus | "all")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filter === s.value
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {s.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {leads === null ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="card mt-6 py-16 text-center">
          <p className="text-slate-500 dark:text-slate-400">No leads here yet.</p>
          <Link href="/app/finder" className="btn-primary mt-4 inline-flex">Find businesses</Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Website</th>
                <th className="px-4 py-3 font-medium">Opportunity</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((l) => {
                const tone = opportunityTone(l.score);
                return (
                  <tr key={l.id} className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <Link href={`/app/leads/${l.id}`} className="font-medium text-slate-900 hover:text-brand-600 dark:text-white">
                        {l.businessName}
                      </Link>
                      <div className="text-xs text-slate-400">{l.city}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell dark:text-slate-400">{hostOf(l.website)}</td>
                    <td className="px-4 py-3">
                      {l.score == null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${tone.text}`}>
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: tone.ring }} />
                          {l.score}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[l.status]}`}>
                        {LEAD_STATUSES.find((s) => s.value === l.status)?.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
