import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLead, updateLead } from "@/lib/store";
import { generateEmail, type Tone } from "@/lib/email";
import { auditSite } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TONES: Tone[] = ["friendly", "direct", "formal"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let lead = getLead(user.id, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tone } = await req.json().catch(() => ({}));
  const chosen: Tone = TONES.includes(tone) ? tone : "friendly";

  // Auto-audit first if we don't have findings yet — the email is built from them.
  if (!lead.audit) {
    const audit = await auditSite(lead.website);
    lead = updateLead(user.id, params.id, { audit, score: audit.opportunity }) ?? lead;
  }

  const emailDraft = generateEmail(lead, chosen);
  const updated = updateLead(user.id, params.id, { emailDraft });
  return NextResponse.json({ lead: updated, tone: chosen });
}
