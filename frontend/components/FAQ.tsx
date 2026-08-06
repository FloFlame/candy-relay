"use client";

import { useState } from "react";
import { faqs } from "@/lib/content";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-slate-200 py-20 sm:py-28 dark:border-slate-800">
      <div className="container-tight max-w-3xl">
        <div className="text-center">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-title mt-4">Questions, answered</h2>
        </div>

        <dl className="mt-12 divide-y divide-slate-200 dark:divide-slate-800">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="py-2">
                <dt>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 rounded-lg py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{item.q}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </dt>
                <dd
                  className={`grid overflow-hidden text-slate-600 transition-all duration-300 dark:text-slate-300 ${
                    isOpen ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="pr-9">{item.a}</p>
                  </div>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
