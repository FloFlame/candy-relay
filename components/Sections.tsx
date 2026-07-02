import { Icon, CheckIcon } from "./Icons";
import {
  journey,
  features,
  testimonials,
  stats,
  resources,
} from "@/lib/content";

export function TrustBar() {
  return (
    <section aria-label="Key numbers" className="border-y border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="container-tight grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Journey() {
  return (
    <section id="journey" className="py-20 sm:py-28">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">The journey</span>
          <h2 className="section-title mt-4">Find, Analyse, Connect, Close</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            One logical workflow that takes you from an unknown local business
            all the way to a signed client.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {journey.map((s) => (
            <li key={s.step} className="card relative">
              <span className="absolute right-5 top-5 text-4xl font-black text-slate-100 dark:text-slate-800">
                {s.step}
              </span>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon name={s.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="border-y border-slate-200 bg-slate-50/60 py-20 sm:py-28 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Inside Leadly</span>
          <h2 className="section-title mt-4">Everything you need, in one platform</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            From lead discovery through outreach to CRM export — no stitching
            five tools together.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-28">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Social proof</span>
          <h2 className="section-title mt-4">Agencies and freelancers ship with Leadly</h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="card flex h-full flex-col">
              <div className="flex gap-0.5 text-amber-400" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-slate-700 dark:text-slate-200">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About() {
  const values = [
    "Only public, open-map business data — no shady scraping.",
    "Honest outreach over spam. We help you lead with real value.",
    "Your leads are yours: export to CSV or the public API anytime.",
  ];
  return (
    <section id="about" className="border-y border-slate-200 bg-slate-50/60 py-20 sm:py-28 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="container-tight grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow">About Leadly</span>
          <h2 className="section-title mt-4">Built by people who cold-emailed for a living</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Leadly started as an internal tool at a small web studio that was
            tired of hunting for prospects in spreadsheets. We wanted a single
            place to find local businesses, prove why their site was losing them
            money, and reach out with something genuinely useful.
          </p>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Today that tool is a full platform used by agencies and freelancers
            to build a predictable pipeline — without the guesswork or the guilt
            of generic spam.
          </p>
        </div>
        <ul className="space-y-4">
          {values.map((v) => (
            <li key={v} className="card flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-500" />
              <span className="text-slate-700 dark:text-slate-200">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Resources() {
  return (
    <section id="resources" className="py-20 sm:py-28">
      <div className="container-tight">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="eyebrow">Resources</span>
            <h2 className="section-title mt-4">Learn to win local clients</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Playbooks on auditing sites, writing outreach that converts, and
              turning scores into a repeatable pipeline.
            </p>
          </div>
          <a href="#" className="btn-ghost">Visit the blog</a>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {resources.map((r) => (
            <a
              key={r.title}
              href="#"
              className="card group flex h-full flex-col"
            >
              <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {r.tag}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-brand-600 dark:text-white">
                {r.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">{r.excerpt}</p>
              <span className="mt-4 text-xs font-medium text-slate-400">{r.read}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-tight">
        <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-10 top-0 h-64 w-64 rounded-full bg-accent-400/40 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-brand-300/40 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your next client already has a broken website.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
              Start auditing local businesses today and send outreach that
              actually gets replies.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#pricing" className="btn bg-white text-brand-700 hover:bg-brand-50">
                Start free — 14 days
              </a>
              <a href="mailto:sales@getleadly.net" className="btn border border-white/30 text-white hover:bg-white/10">
                Talk to sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
