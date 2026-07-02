import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLead, updateLead } from "@/lib/store";
import { auditSite } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lead = getLead(user.id, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const audit = await auditSite(lead.website);
  const updated = updateLead(user.id, params.id, {
    audit,
    score: audit.opportunity,
  });
  return NextResponse.json({ lead: updated });
}
