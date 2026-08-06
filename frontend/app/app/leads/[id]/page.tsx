"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { leadsApi } from "@/lib/api";
import type { Lead, Audit, OutreachMsg, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES, OUTREACH_VARIANTS, LANGUAGES } from "@/lib/types";
import { priorityTone, healthTone, STATUS_STYLES, SEVERITY_STYLES, hostOf, previewDataUri } from "@/lib/ui";
import { ScoreRing } from "@/components/app/ScoreRing";

interface Competitor { business_name: string; website: string; health: number; priority: string }
interface CompResult { self: { business_name: string; health: number | null }; competitors: Competitor[]; market_average_health: number | null; beats_market: boolean | null }

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [outreach, setOutreach] = useState<OutreachMsg[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState("");
  const [variant, setVariant] = useState("soft_email");
  const [language, setLanguage] = useState("en");
  const [comp, setComp] = useState<CompResult | null>(null);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    try {
      const d = await leadsApi.get(id);
      setLead(d.lead); setAudit(d.audit); setOutreach(d.outreach || []);
      setNotes(d.lead.notes || ""); setLanguage(d.lead.language || "en");
    } catch { setNotFound(true); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function runAudit() { setBusy("audit"); const d = await leadsApi.audit(id); setLead(d.lead); setAudit(d.audit); setBusy(""); }
  async function genOutreach() {
    setBusy("out");
    try {
      const d = await leadsApi.outreach(id, variant, language);
      setOutreach((prev) => [...d.outreach, ...prev]);
    } catch (e) { alert((e as Error).message); }
    setBusy("");
  }
  async function runCompetitors() { setBusy("comp"); try { setComp(await leadsApi.competitors(id)); } catch (e) { alert((e as Error).message); } setBusy(""); }
  async function setStatus(status: LeadStatus) { const d = await leadsApi.patch(id, { status }); setLead(d); }
  async function saveNotes() { setBusy("notes"); await leadsApi.patch(id, { notes }); setBusy(""); }
  async function remove() { if (!confirm("Delete this lead?")) return; await leadsApi.remove(id); router.push("/app/leads"); }
  function copy(text: string, key: string) { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); }

  if (notFound) return <div className="card py-16 text-center"><p className="text-slate-500 dark:text-slate-400">Lead not found.</p><Link href="/app/leads" className="btn-primary mt-4 inline-flex">Back to leads</Link></div>;
  if (!lead) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />;

  const tone = priorityTone(lead.priority);
  const opp = lead.overall_score != null ? 100 - lead.overall_score : 0;
  const cats = audit ? Object.entries(audit.category_scores) : [];

  return (
    <div>
      <Link href="/app/leads" className="text-sm font-medium text-brand-600 hover:underline">← All leads</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lead.business_name}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {[lead.category, lead.city].filter(Boolean).join(" · ") || "No category"}
            {lead.website && <>{" · "}<a href={/^https?:\/\//.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{hostOf(lead.website)}</a></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={lead.status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={`rounded-xl border-0 px-3 py-2 text-sm font-medium ${STATUS_STYLES[lead.status]}`}>
            {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={remove} className="btn-ghost px-3 py-2 text-sm text-rose-600">Delete</button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Website audit</h2>
              <button onClick={runAudit} disabled={busy === "audit"} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-60">{busy === "audit" ? "Auditing…" : audit ? "Re-audit" : "Run audit"}</button>
            </div>
            {!audit ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Run an audit to score this site across 9 categories with concrete fixes.</p>
            ) : (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <ScoreRing value={opp} color={tone.ring} size={92} label="opp" />
                    <div className={`mt-1 text-xs font-semibold ${tone.text}`}>{tone.label}</div>
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    {cats.map(([k, v]) => (
                      <div key={k}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium capitalize text-slate-600 dark:text-slate-300">{k.replace("_", " ")}</span>
                          <span className="text-slate-400">{v}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full" style={{ width: `${v}%`, background: healthTone(v as number) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Issues &amp; fixes ({audit.findings.length})</h3>
                  <ul className="mt-3 space-y-2.5">
                    {audit.findings.map((f, i) => (
                      <li key={i} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{f.issue}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_STYLES[f.severity]}`}>{f.severity}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{f.reason}</p>
                        <p className="mt-1.5 text-sm text-emerald-700 dark:text-emerald-400"><span className="font-medium">Fix:</span> {f.fix}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Current site</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewDataUri(lead.website, opp)} alt={`Preview of ${lead.business_name}`} className="w-full rounded-xl border border-slate-200 dark:border-slate-800" />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-slate-900 dark:text-white">AI outreach</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select value={variant} onChange={(e) => setVariant(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                  {OUTREACH_VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                  <option value="all">All variants</option>
                </select>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button onClick={genOutreach} disabled={busy === "out"} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-60">{busy === "out" ? "Writing…" : "Generate"}</button>
              </div>
            </div>
            {outreach.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Generate honest outreach built from the real audit findings. Pick a variant and language.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {outreach.map((o, i) => (
                  <div key={o.id || i} className="rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs dark:border-slate-800">
                      <span className="font-semibold uppercase tracking-wide text-slate-500">{o.variant.replace("_", " ")} · {o.language} · {o.generated_by}</span>
                      <button onClick={() => copy((o.subject ? `Subject: ${o.subject}\n\n` : "") + o.body, o.id || String(i))} className="font-medium text-brand-600 hover:underline">{copied === (o.id || String(i)) ? "Copied!" : "Copy"}</button>
                    </div>
                    <div className="p-4">
                      {o.subject && <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{o.subject}</p>}
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 dark:text-slate-300">{o.body}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Competitors</h2>
              <button onClick={runCompetitors} disabled={busy === "comp"} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-60">{busy === "comp" ? "Comparing…" : "Compare"}</button>
            </div>
            {!comp ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Audit nearby businesses in the same trade + city to see how this one ranks.</p>
            ) : (
              <div className="mt-4">
                {comp.market_average_health != null && (
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                    Market avg <strong>{comp.market_average_health}</strong>
                    {comp.self.health != null && <> · this lead <strong>{comp.self.health}</strong> <span className={comp.beats_market ? "text-emerald-600" : "text-rose-600"}>({comp.beats_market ? "above" : "below"})</span></>}
                  </p>
                )}
                <ul className="space-y-2">
                  {comp.competitors.map((c) => (
                    <li key={c.website} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
                      <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{c.business_name}</span>
                      <span className="ml-2 font-semibold" style={{ color: healthTone(c.health) }}>{c.health}</span>
                    </li>
                  ))}
                  {comp.competitors.length === 0 && <li className="text-sm text-slate-500 dark:text-slate-400">No competitors with websites found nearby.</li>}
                </ul>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-900 dark:text-white">Notes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Call outcomes, follow-up dates…" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button onClick={saveNotes} disabled={busy === "notes"} className="btn-ghost mt-2 px-3 py-1.5 text-sm disabled:opacity-60">{busy === "notes" ? "Saving…" : "Save notes"}</button>
          </div>

          <div className="card text-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white">Details</h2>
            <dl className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Phone</dt><dd className="text-right">{lead.phone || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Rating</dt><dd className="text-right">{lead.google_rating != null ? `★ ${lead.google_rating} (${lead.review_count ?? 0})` : "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Address</dt><dd className="text-right">{lead.address || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-400">Source</dt><dd className="text-right capitalize">{lead.source || "—"}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
