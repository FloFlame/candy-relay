"use client";

import { useEffect, useState } from "react";
import { accountApi, licenseApi } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [savedProfile, setSavedProfile] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [license, setLicense] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [activateKey, setActivateKey] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (user) setName(user.name);
    licenseApi.mine().then(setLicense).catch(() => {});
    licenseApi.devices().then(setDevices).catch(() => {});
  }, [user]);

  async function saveProfile() {
    setBusy("profile");
    await accountApi.updateProfile(name);
    await refresh();
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
    setBusy("");
  }

  async function changePassword() {
    setPwdMsg("");
    setBusy("pwd");
    try {
      await accountApi.changePassword(pwd.current, pwd.next);
      setPwd({ current: "", next: "" });
      setPwdMsg("Password updated ✓");
    } catch (e) { setPwdMsg((e as Error).message); }
    setBusy("");
  }

  async function activate() {
    setBusy("activate");
    try {
      const deviceId = `web-${navigator.userAgent.slice(0, 24).replace(/\W/g, "")}`;
      await licenseApi.activate(activateKey, deviceId, "Browser", navigator.platform || "web");
      setDevices(await licenseApi.devices());
      setLicense(await licenseApi.mine());
      setActivateKey("");
    } catch (e) { alert((e as Error).message); }
    setBusy("");
  }

  async function deactivate(deviceId: string) {
    await licenseApi.deactivate(deviceId);
    setDevices(await licenseApi.devices());
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your profile, license and devices.</p>

      <div className="mt-6 space-y-6">
        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
              <input value={user?.email || ""} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50" />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={saveProfile} disabled={busy === "profile"} className="btn-primary disabled:opacity-60">Save</button>
            {savedProfile && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white">Change password</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="password" placeholder="Current password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input type="password" placeholder="New password (min 8)" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={changePassword} disabled={busy === "pwd" || !pwd.current || pwd.next.length < 8} className="btn-ghost disabled:opacity-60">Update password</button>
            {pwdMsg && <span className={`text-sm font-medium ${pwdMsg.includes("✓") ? "text-emerald-600" : "text-rose-600"}`}>{pwdMsg}</span>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white">License</h2>
          {license ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold capitalize text-brand-700 dark:bg-brand-950 dark:text-brand-300">{license.type}</span>
              <span className={`rounded-full px-3 py-1 font-medium capitalize ${license.status === "active" || license.status === "trial" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>{license.status}</span>
              <span className="text-slate-500 dark:text-slate-400">{license.audits_per_day} audits/day · {license.max_devices} device(s)</span>
              <code className="text-xs text-slate-400">{license.key}</code>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No license on this account.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <input value={activateKey} onChange={(e) => setActivateKey(e.target.value)} placeholder="LEADLY-XXXX-XXXX-XXXX-XXXX" className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button onClick={activate} disabled={busy === "activate" || !activateKey} className="btn-ghost disabled:opacity-60">Activate key</button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white">Devices</h2>
          {devices.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No devices activated yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{d.name || d.device_id}</span>
                    <span className="ml-2 text-xs text-slate-400">{d.os}</span>
                    {!d.active && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">inactive</span>}
                  </div>
                  {d.active && <button onClick={() => deactivate(d.id)} className="text-xs font-medium text-rose-600 hover:underline">Deactivate</button>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
