import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/apiauth";
import { listLeads } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/leads — returns the authenticated user's leads.
export async function GET(req: Request) {
  const user = userFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid API token. Send 'Authorization: Bearer <token>'." },
      { status: 401 }
    );
  }
  const leads = listLeads(user.id).map((l) => ({
    id: l.id,
    business_name: l.businessName,
    niche: l.niche,
    city: l.city,
    website: l.website,
    phone: l.phone,
    status: l.status,
    opportunity_score: l.audit?.opportunity ?? null,
    health_score: l.audit?.health ?? null,
  }));
  return NextResponse.json({ object: "list", count: leads.length, data: leads });
}
