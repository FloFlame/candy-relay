"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "./Logo";
import { authApi, setTokens, isAuthed } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthed()) router.replace("/app");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = isSignup
        ? await authApi.register(email, password, name)
        : await authApi.login(email, password);
      setTokens(data.access_token, data.refresh_token);
      router.push("/app");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8"><Logo /></Link>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {isSignup ? "Start your free trial" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? "14 days free. No card required." : "Sign in to your Leadly account."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isSignup && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} placeholder={isSignup ? "At least 8 characters" : ""} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        {!isSignup && (
          <p className="mt-4 text-center text-sm">
            <Link href="/forgot" className="font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400">Forgot password?</Link>
          </p>
        )}

        {isSignup && (
          <p className="mt-4 text-center text-xs text-slate-400">
            By continuing you agree to our{" "}
            <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? (
            <>Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link></>
          ) : (
            <>New to Leadly? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Start free</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
