import { CheckIcon } from "./Icons";
import { plans } from "@/lib/content";

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-slate-200 py-20 sm:py-28 dark:border-slate-800">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Pricing</span>
          <h2 className="section-title mt-4">Simple plans, no surprises</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Start free for 14 days. Upgrade when Leadly is already booking you
            meetings.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.featured
                  ? "border-brand-600 bg-white shadow-xl shadow-brand-600/10 ring-1 ring-brand-600 dark:bg-slate-900"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.blurb}</p>

              <a
                href="#"
                className={`mt-6 ${plan.featured ? "btn-primary" : "btn-ghost"} w-full`}
              >
                {plan.cta}
              </a>

              <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enterprise strip */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 sm:flex-row dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Enterprise</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Unlimited devices, custom limits and a dedicated contact — available on request.
            </p>
          </div>
          <a href="mailto:sales@getleadly.net" className="btn-ghost shrink-0">
            Contact sales
          </a>
        </div>
      </div>
    </section>
  );
}
