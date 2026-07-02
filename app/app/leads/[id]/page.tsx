"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { opportunityTone, healthTone, STATUS_STYLES, hostOf } from "@/lib/ui";
import { ScoreRing } from "@/components/app/ScoreRing";

type Tone = "friendly" | "direct" | "formal";
interface Competitor { businessName: string; website: string; health: number; opportunity: number }
interface CompResult { self: { businessName: string; health: number | null }; competitors: Competitor[]; marketAverageHealth: number | null; beatsMarket: boolean | null }

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<string>("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [comp, setComp] = useState<CompResult | null>(null);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch(`/api/leads/${id}`);
    if (res.status === 404) return setNotFound(true);
    const data = await res.json();
    setLead(data.lead);
    setNotes(data.lead.notes || "");
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runAudit() {
    setBusy("audit");
    const res = await fetch(`/api/leads/${id}/audit`, { method: "POST" });
    const data = await res.json();
    setLead(data.lead);
    setBusy("");
  }

  async function genEmail() {
    setBusy("email");
    const res = await fetch(`/api/leads/${id}/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tone }),
    });
    const data = await res.json();
    setLead(data.lead);
    setBusy("");
  }

  async function runCompetitors() {
    setBusy("comp");
    const res = await fetch(`/api/leads/${id}/competitors`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setComp(data);
    setBusy("");
  }

  async function setStatus(status: LeadStatus) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setLead(data.lead);
  }

  async function saveNotes() {
    setBusy("notes");
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setBusy("");
  }

  async function remove() {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    router.push("/app/leads");
    router.refresh();
  }

  function copyEmail() {
    if (lead?.emailDraft) {
      navigator.clipboard.writeText(lead.emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (notFound) {
    return (
      <div className="card py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">Lead not found.</p>
        <Link href="/app/leads" className="btn-primary mt-4 inline-flex">Back to leads</Link>
      </div>
    );
  }
  if (!lead) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />;
  }

  const tone_ = opportunityTone(lead.score);
  const audit = lead.audit;

  return (
    <div>
      <Link href="/app/leads" className="text-sm font-medium text-brand-600 hover:underline">← All leads</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lead.businessName}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {[lead.niche, lead.city].filter(Boolean).join(" · ") || "No category"}
            {lead.website && (
              <>
                {" · "}
                <a href={/^https?:\/\//.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  {hostOf(lead.website)}
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className={`rounded-xl border-0 px-3 py-2 text-sm font-medium ${STATUS_STYLES[lead.status]}`}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button onClick={remove} className="btn-ghost px-3 py-2 text-sm text-rose-600">Delete</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: audit */}
        <div className="space-y-6 lg:col-span-2">
          {/* Audit card */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Website audit</h2>
              <button onClick={runAudit} disabled={busy === "audit"} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-60">
                {busy === "audit" ? "Auditing…" : audit ? "Re-audit" : "Run audit"}
              </button>
            </div>

            {!audit ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Run an audit to score this site across speed, mobile, SEO, design and security.
              </p>
            ) : (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <ScoreRing value={lead.score ?? 0} color={tone_.ring} size={92} label="opp" />
                    <div className={`mt-1 text-xs font-semibold ${tone_.text}`}>{tone_.label}</div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {(["speed", "mobile", "seo", "design", "security"] as const).map((k) => (
                      <div key={k}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium capitalize text-slate-600 dark:text-slate-300">{k}</span>
                          <span className="text-slate-400">{audit.signals[k]}/100</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full" style={{ width: `${audit.signals[k]}%`, background: healthTone(audit.signals[k]) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {audit.error && (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {audit.error}. {audit.finalUrl ? "" : "No website was on file."}
                  </p>
                )}

                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Issues found</h3>
                  <ul className="mt-2 space-y-1.5">
                    {audit.issues.map((iss, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        {iss}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot */}
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Current site</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/screenshot?url=${encodeURIComponent(lead.website)}&score=${lead.score ?? ""}`}
                    alt={`Preview of ${lead.businessName}'s website`}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Email generator */}
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-slate-900 dark:text-white">AI outreach email</h2>
              <div className="flex items-center gap-2">
                <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <option value="friendly">Friendly</option>
                  <option value="direct">Direct</option>
                  <option value="formal">Formal</option>
                </select>
                <button onClick={genEmail} disabled={busy === "email"} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-60">
                  {busy === "email" ? "Writing…" : "Generate"}
                </button>
              </div>
            </div>
            {lead.emailDraft ? (
              <div className="mt-4">
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">{lead.emailDraft}</pre>
                <button onClick={copyEmail} className="btn-ghost mt-3 px-3 py-1.5 text-sm">{copied ? "Copied!" : "Copy to clipboard"}</button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Generate honest outreach built from the real issues found in the audit. Pick a tone and click Generate.
              </p>
            )}
          </div>
        </div>

        {/* Right: competitors + notes */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Competitors</h2>
              <button onClick={runCompetitors} disabled={busy === "comp"} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-60">
                {busy === "comp" ? "Comparing…" : "Compare"}
              </button>
            </div>
            {!comp ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Audit a handful of businesses in the same trade and city to see how this one ranks.
              </p>
            ) : (
              <div className="mt-4">
                {comp.marketAverageHealth != null && (
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                    Market avg health <strong>{comp.marketAverageHealth}</strong>
                    {comp.self.health != null && (
                      <> · this lead <strong>{comp.self.health}</strong>{" "}
                        <span className={comp.beatsMarket ? "text-emerald-600" : "text-rose-600"}>
                          ({comp.beatsMarket ? "above" : "below"} average)
                        </span>
                      </>
                    )}
                  </p>
                )}
                <ul className="space-y-2">
                  {comp.competitors.map((c) => (
                    <li key={c.website} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
                      <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{c.businessName}</span>
                      <span className="ml-2 font-semibold" style={{ color: healthTone(c.health) }}>{c.health}</span>
                    </li>
                  ))}
                  {comp.competitors.length === 0 && (
                    <li className="text-sm text-slate-500 dark:text-slate-400">No competitors with websites found nearby.</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-900 dark:text-white">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Call outcomes, follow-up dates…"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button onClick={saveNotes} disabled={busy === "notes"} className="btn-ghost mt-2 px-3 py-1.5 text-sm disabled:opacity-60">
              {busy === "notes" ? "Saving…" : "Save notes"}
            </button>
          </div>

          <div className="card text-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white">Details</h2>
            <dl className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Phone</dt><dd className="text-right">{lead.phone || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Address</dt><dd className="text-right">{lead.address || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Source</dt><dd className="text-right capitalize">{lead.source}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
