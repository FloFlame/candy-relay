"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authApi.reset(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8"><Logo /></Link>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Choose a new password</h1>
        {done ? (
          <p className="mt-4 text-sm text-emerald-600">Password updated ✓ Redirecting to sign in…</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Reset token" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 8)" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? "Saving…" : "Reset password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>}>
      <ResetInner />
    </Suspense>
  );
}
