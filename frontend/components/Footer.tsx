import { Logo } from "./Logo";
import { nav } from "@/lib/content";

const cols = [
  {
    title: "Product",
    links: nav,
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Resources", href: "/#resources" },
      { label: "Contact sales", href: "mailto:sales@getleadly.net" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy & GDPR", href: "/privacy" },
      { label: "Terms", href: "/privacy#terms" },
      { label: "Cookie policy", href: "/privacy#cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-tight grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Find weak local websites and turn them into paying clients. The lead
            engine for agencies and freelancers.
          </p>
          <a
            href="mailto:sales@getleadly.net"
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            sales@getleadly.net
          </a>
        </div>

        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-slate-200 py-6 dark:border-slate-800">
        <div className="container-tight flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row dark:text-slate-400">
          <p>© {new Date().getFullYear()} Leadly. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-500" />
            GDPR-friendly · Data processed in the EU
          </p>
        </div>
      </div>
    </footer>
  );
}
