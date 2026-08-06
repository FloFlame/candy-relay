"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { authApi } from "@/lib/api";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await authApi.forgot(email);
      setSent(true);
      if (d.token) setDevToken(d.token); // dev only: no email provider configured
    } catch {}
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8"><Logo /></Link>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
        {sent ? (
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            <p>If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
            {devToken && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Dev mode (no email provider): <Link href={`/reset?token=${devToken}`} className="font-semibold underline">continue to reset →</Link>
              </p>
            )}
            <Link href="/login" className="mt-4 inline-block font-medium text-brand-600 hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send a reset link.</p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? "Sending…" : "Send reset link"}</button>
            <Link href="/login" className="block text-center text-sm font-medium text-brand-600 hover:underline">Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
}
