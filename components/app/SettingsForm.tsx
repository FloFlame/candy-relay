"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/types";

const PLANS: { value: Plan; label: string; price: string }[] = [
  { value: "trial", label: "Trial", price: "€0" },
  { value: "starter", label: "Starter", price: "€25/mo" },
  { value: "professional", label: "Professional", price: "€65/mo" },
  { value: "lifetime", label: "Lifetime", price: "€375" },
];

export function SettingsForm({
  initial,
}: {
  initial: { name: string; email: string; plan: Plan; apiToken: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [plan, setPlan] = useState<Plan>(initial.plan);
  const [token, setToken] = useState(initial.apiToken);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, plan }),
    });
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
    setBusy(false);
  }

  async function regenerate() {
    if (!confirm("Regenerate your API token? The old one stops working immediately.")) return;
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ regenerateToken: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.user.apiToken);
      setRevealed(true);
    }
  }

  const masked = token.slice(0, 12) + "•".repeat(20);

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 dark:text-white">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input value={initial.email} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50" />
          </label>
        </div>
      </div>

      {/* Plan */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 dark:text-white">Plan</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Switch your simulated plan (demo — no billing is charged).</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {PLANS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlan(p.value)}
              className={`rounded-xl border p-4 text-left transition ${
                plan === p.value
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-950"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-white">{p.label}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{p.price}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
      </div>

      {/* API token */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 dark:text-white">API token</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use this as a Bearer token against the public API.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {revealed ? token : masked}
          </code>
          <button onClick={() => setRevealed((v) => !v)} className="btn-ghost px-3 py-2 text-sm">{revealed ? "Hide" : "Reveal"}</button>
          <button onClick={() => navigator.clipboard.writeText(token)} className="btn-ghost px-3 py-2 text-sm">Copy</button>
          <button onClick={regenerate} className="btn-ghost px-3 py-2 text-sm text-rose-600">Regenerate</button>
        </div>
      </div>
    </div>
  );
}
