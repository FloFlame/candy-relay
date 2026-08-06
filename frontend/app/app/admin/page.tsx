"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const LICENSE_TYPES = ["trial", "monthly", "annual", "lifetime", "enterprise"];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [newLic, setNewLic] = useState({ type: "monthly", email: "" });
  const [tab, setTab] = useState<"licenses" | "users">("licenses");

  useEffect(() => {
    if (!loading && user && user.role !== "owner" && user.role !== "admin") router.replace("/app");
  }, [loading, user, router]);

  async function loadAll() {
    setStats(await adminApi.stats().catch(() => null));
    setLicenses(await adminApi.licenses().catch(() => []));
    setUsers(await adminApi.users().catch(() => []));
  }
  useEffect(() => { loadAll(); }, []);

  async function createLicense() {
    try {
      await adminApi.createLicense(newLic.type, newLic.email || undefined);
      setNewLic({ type: "monthly", email: "" });
      setLicenses(await adminApi.licenses());
    } catch (e) { alert((e as Error).message); }
  }
  async function licAction(id: string, action: string) {
    await adminApi.licenseAction(id, action);
    setLicenses(await adminApi.licenses());
  }
  async function toggleUser(id: string, is_active: boolean) {
    await adminApi.patchUser(id, { is_active });
    setUsers(await adminApi.users(q));
  }

  if (user && user.role !== "owner" && user.role !== "admin") return null;

  const statTiles = stats ? [
    { label: "Users", value: stats.users },
    { label: "Licenses", value: stats.licenses },
    { label: "Active", value: stats.active_licenses },
    { label: "Devices", value: stats.devices },
    { label: "Leads", value: stats.leads },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Manage licenses, users and see platform usage.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {statTiles.map((s) => (
          <div key={s.label} className="card"><div className="text-sm text-slate-500 dark:text-slate-400">{s.label}</div><div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div></div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        {(["licenses", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-brand-600 text-white" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>{t}</button>
        ))}
      </div>

      {tab === "licenses" && (
        <div className="mt-4">
          <div className="card">
            <h2 className="font-semibold text-slate-900 dark:text-white">Create license</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <select value={newLic.type} onChange={(e) => setNewLic({ ...newLic, type: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newLic.email} onChange={(e) => setNewLic({ ...newLic, email: e.target.value })} placeholder="assign to email (optional)" className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              <button onClick={createLicense} className="btn-primary px-4 py-2 text-sm">Create</button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400"><tr><th className="px-4 py-3">Key</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {licenses.map((l) => (
                  <tr key={l.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.key}</td>
                    <td className="px-4 py-3 capitalize">{l.type}</td>
                    <td className="px-4 py-3"><span className="capitalize">{l.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => licAction(l.id, "suspend")} className="text-amber-600 hover:underline">Suspend</button>
                        <button onClick={() => licAction(l.id, "revoke")} className="text-rose-600 hover:underline">Revoke</button>
                        <button onClick={() => licAction(l.id, "activate")} className="text-emerald-600 hover:underline">Activate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-4">
          <div className="mb-3 flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…" className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button onClick={async () => setUsers(await adminApi.users(q))} className="btn-ghost px-4 py-2 text-sm">Search</button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Active</th><th className="px-4 py-3"></th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">{u.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u.id, !u.is_active)} className="text-xs font-medium text-brand-600 hover:underline">{u.is_active ? "Deactivate" : "Activate"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
