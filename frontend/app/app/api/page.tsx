"use client";

import { useEffect, useState } from "react";
import { accountApi, download } from "@/lib/api";

export default function ApiUsagePage() {
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => { accountApi.usage().then(setUsage).catch(() => {}); }, []);

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API &amp; exports</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Track your plan usage, export leads, and read the API docs.</p>

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Today&apos;s usage</h2>
        {!usage ? (
          <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Object.entries(usage.used).map(([k, v]) => {
              const limit = usage.limits?.[k];
              return (
                <div key={k} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="text-xs capitalize text-slate-500 dark:text-slate-400">{k.replace("_", " ")}</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{String(v)} <span className="text-sm font-normal text-slate-400">/ {String(limit ?? "∞")}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">CSV export</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Download every lead with its scores and status (streamed).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => download("/exports/leads.csv", "leadly-all.csv")} className="btn-primary">All leads</button>
          <button onClick={() => download("/exports/leads.csv?priority=high", "leadly-high.csv")} className="btn-ghost">High priority</button>
          <button onClick={() => download("/exports/leads.csv?status=won", "leadly-won.csv")} className="btn-ghost">Won</button>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Public API</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The backend exposes a REST API documented with OpenAPI.</p>
        <div className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100 dark:bg-black">
          <pre className="font-mono">{`# Interactive docs
${base.replace("/api", "")}/docs

# Example: list your leads
curl ${base}/leads -H "Authorization: Bearer <access_token>"`}</pre>
        </div>
      </div>
    </div>
  );
}
