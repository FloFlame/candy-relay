"use client";

import { useEffect, useState } from "react";

// Lightweight, dependency-free consent notice (audit flagged the missing banner).
export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie-consent")) setShow(true);
    } catch {}
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      localStorage.setItem("cookie-consent", value);
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <div className="container-tight flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          We use a few essential cookies to keep Leadly running and, with your
          consent, to understand how the site is used. See our{" "}
          <a href="/privacy" className="font-semibold text-brand-600 underline">
            Privacy &amp; Cookie policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => decide("declined")} className="btn-ghost px-4 py-2 text-sm">
            Decline
          </button>
          <button type="button" onClick={() => decide("accepted")} className="btn-primary px-4 py-2 text-sm">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
