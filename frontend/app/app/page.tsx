import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listLeads } from "@/lib/store";
import { LEAD_STATUSES } from "@/lib/types";
import { opportunityTone, STATUS_STYLES, hostOf } from "@/lib/ui";
import { ScoreRing } from "@/components/app/ScoreRing";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const user = getCurrentUser()!;
  const leads = listLeads(user.id);
  const audited = leads.filter((l) => l.audit);
  const avgOpp = audited.length
    ? Math.round(audited.reduce((a, l) => a + (l.audit!.opportunity || 0), 0) / audited.length)
    : 0;
  const won = leads.filter((l) => l.status === "won").length;
  const hot = leads.filter((l) => (l.score ?? 0) >= 60).length;

  const statusCounts = LEAD_STATUSES.map((s) => ({
    ...s,
    count: leads.filter((l) => l.status === s.value).length,
  }));

  const top = [...audited].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);

  const stats = [
    { label: "Total leads", value: leads.length },
    { label: "Hot (60+)", value: hot },
    { label: "Avg. opportunity", value: audited.length ? avgOpp : "—" },
    { label: "Won", value: won },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Here&apos;s your pipeline at a glance.</p>
        </div>
        <Link href="/app/finder" className="btn-primary">Find new businesses</Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
            <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Pipeline */}
          <div className="card lg:col-span-1">
            <h2 className="font-semibold text-slate-900 dark:text-white">Pipeline</h2>
            <ul className="mt-4 space-y-3">
              {statusCounts.map((s) => {
                const pct = leads.length ? Math.round((s.count / leads.length) * 100) : 0;
                return (
                  <li key={s.value}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.value]}`}>{s.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Top opportunities */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Top opportunities</h2>
              <Link href="/app/leads" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            {top.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Run an audit on your leads to see opportunities ranked here.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {top.map((l) => {
                  const tone = opportunityTone(l.score);
                  return (
                    <li key={l.id}>
                      <Link href={`/app/leads/${l.id}`} className="flex items-center gap-4 py-3">
                        <ScoreRing value={l.score ?? 0} color={tone.ring} size={48} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{l.businessName}</p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{hostOf(l.website)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>{tone.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card mt-6 flex flex-col items-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No leads yet</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Use the business finder to pull local businesses by niche and city, then audit and reach out.
      </p>
      <Link href="/app/finder" className="btn-primary mt-6">Find your first leads</Link>
    </div>
  );
}
