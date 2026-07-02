"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hostOf } from "@/lib/ui";

interface Found {
  businessName: string;
  address: string;
  website: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  source: string;
}

export default function FinderPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Found[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResults(null);
    setSelected({});
    try {
      const res = await fetch("/api/finder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ niche, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
      setSource(data.source);
      // pre-select all
      const all: Record<number, boolean> = {};
      data.results.forEach((_: Found, i: number) => (all[i] = true));
      setSelected(all);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function addSelected() {
    if (!results) return;
    setSaving(true);
    const items = results
      .filter((_, i) => selected[i])
      .map((r) => ({ ...r, niche, city }));
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Could not save leads");
      router.push("/app/leads");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business finder</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Pull local businesses by niche and city straight from open map data.
      </p>

      <form onSubmit={search} className="card mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Niche</span>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            required
            placeholder="e.g. dentist, plumber, restaurant"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            placeholder="e.g. Austin, Manchester, Lyon"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </label>
        <button type="submit" disabled={loading} className="btn-primary shrink-0 disabled:opacity-60">
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}

      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {results.length} results
              {source === "sample" && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  sample data — open-map source unreachable
                </span>
              )}
              {source === "openstreetmap" && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  live OpenStreetMap data
                </span>
              )}
            </p>
            <button
              onClick={addSelected}
              disabled={selectedCount === 0 || saving}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? "Adding…" : `Add ${selectedCount} to leads`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            {results.map((r, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-center gap-4 border-b border-slate-100 bg-white p-4 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={!!selected[i]}
                  onChange={(e) => setSelected({ ...selected, [i]: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{r.businessName}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{r.address || "No address"}</p>
                </div>
                <div className="hidden text-right sm:block">
                  {r.website ? (
                    <span className="text-sm text-slate-600 dark:text-slate-300">{hostOf(r.website)}</span>
                  ) : (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">no website</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
