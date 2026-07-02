import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLead } from "@/lib/store";
import { findBusinesses } from "@/lib/finder";
import { auditSite } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

// Compares a lead against other businesses in the same niche + city by auditing
// a handful of them and ranking health scores.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lead = getLead(user.id, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!lead.niche || !lead.city) {
    return NextResponse.json(
      { error: "This lead needs a niche and city to compare competitors." },
      { status: 400 }
    );
  }

  const { results } = await findBusinesses(lead.niche, lead.city, 12);
  const withSites = results
    .filter((r) => r.website && r.businessName !== lead.businessName)
    .slice(0, 4);

  const competitors = await Promise.all(
    withSites.map(async (c) => {
      const audit = await auditSite(c.website);
      return {
        businessName: c.businessName,
        website: c.website,
        health: audit.health,
        opportunity: audit.opportunity,
      };
    })
  );

  const selfHealth = lead.audit?.health ?? null;
  const peers = competitors.map((c) => c.health);
  const avg = peers.length ? Math.round(peers.reduce((a, b) => a + b, 0) / peers.length) : null;
  const ranked = [...competitors].sort((a, b) => b.health - a.health);

  return NextResponse.json({
    self: { businessName: lead.businessName, health: selfHealth },
    competitors: ranked,
    marketAverageHealth: avg,
    beatsMarket: selfHealth != null && avg != null ? selfHealth >= avg : null,
  });
}
