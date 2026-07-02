import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/apiauth";
import { auditSite } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// GET /api/v1/audit?url=example.com — runs a live audit and returns the score.
export async function GET(req: Request) {
  const user = userFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid API token. Send 'Authorization: Bearer <token>'." },
      { status: 401 }
    );
  }
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Provide a ?url= query parameter." }, { status: 400 });
  }
  const audit = await auditSite(url);
  return NextResponse.json({
    url: audit.finalUrl,
    reachable: audit.ok,
    health_score: audit.health,
    opportunity_score: audit.opportunity,
    signals: audit.signals,
    issues: audit.issues,
    audited_at: audit.auditedAt,
  });
}
