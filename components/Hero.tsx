import { CheckIcon } from "./Icons";

function ScoreRing() {
  const score = 34; // a "weak" site — the opportunity
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          stroke="#f43f5e"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-slate-900 dark:text-white">{score}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">/ 100</div>
      </div>
    </div>
  );
}

const signals = [
  { label: "Speed", value: "Poor", tone: "bad" },
  { label: "Mobile", value: "Fail", tone: "bad" },
  { label: "SEO", value: "Weak", tone: "warn" },
  { label: "Security", value: "No HTTPS", tone: "bad" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/30" />
      </div>

      <div className="container-tight grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-8">
        <div className="animate-fade-up">
          <span className="eyebrow">Lead engine for agencies &amp; freelancers</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            Find weak local websites.{" "}
            <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
              Turn them into paying clients.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Leadly pulls local businesses by niche and city, audits their sites
            automatically, scores them as opportunities and writes honest
            outreach based on what&apos;s actually broken.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#pricing" className="btn-primary text-base">
              Start free — 14 days
            </a>
            <a href="#journey" className="btn-ghost text-base">
              See how it works
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            {["No card required", "Cancel anytime", "GDPR-friendly"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-accent-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Audit preview card */}
        <div className="animate-fade-up [animation-delay:120ms]">
          <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit result</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Sunrise Dental — Austin</p>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                High opportunity
              </span>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <ScoreRing />
              <div className="grid flex-1 grid-cols-2 gap-2">
                {signals.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="text-[11px] font-medium text-slate-400">{s.label}</div>
                    <div
                      className={`text-sm font-semibold ${
                        s.tone === "bad"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                AI outreach draft
              </p>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                &ldquo;Hi Sunrise Dental — your site loads in 6.4s on mobile and
                isn&apos;t on HTTPS, which is likely costing you booked
                appointments. I put together a quick fix list…&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
