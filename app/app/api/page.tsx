import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function Endpoint({ method, path, children }: { method: string; path: string; children: React.ReactNode }) {
  const color =
    method === "GET" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${color}`}>{method}</span>
        <code className="font-mono text-sm text-slate-800 dark:text-slate-200">{path}</code>
      </div>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  );
}

export default function ApiPage() {
  const user = getCurrentUser()!;
  const base = "https://getleadly.net";
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API &amp; exports</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Take your leads elsewhere with CSV, or build on Leadly&apos;s public API.
      </p>

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">CSV export</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Download every lead with its scores and status.</p>
        <a href="/api/leads/export" className="btn-primary mt-4 inline-flex">Download CSV</a>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900 dark:text-white">Public API</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Authenticate with your token from Settings using a Bearer header.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-100 dark:bg-black">
        <pre className="font-mono">{`curl ${base}/api/v1/audit?url=example.com \\
  -H "Authorization: Bearer ${user.apiToken.slice(0, 16)}…"`}</pre>
      </div>

      <div className="mt-6 space-y-4">
        <Endpoint method="GET" path="/api/v1/leads">
          Returns all of your leads with opportunity and health scores.
        </Endpoint>
        <Endpoint method="GET" path="/api/v1/audit?url=<website>">
          Runs a live audit of any URL and returns the 0–100 scores, per-signal
          breakdown and the list of issues found.
        </Endpoint>
      </div>
    </div>
  );
}
