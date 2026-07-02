import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteLead, getLead, updateLead } from "@/lib/store";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lead = getLead(user.id, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    if (!LEAD_STATUSES.some((s) => s.value === body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status as LeadStatus;
  }
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.emailDraft === "string") patch.emailDraft = body.emailDraft;
  if (typeof body.website === "string") patch.website = body.website;

  const lead = updateLead(user.id, params.id, patch);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!getLead(user.id, params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  deleteLead(user.id, params.id);
  return NextResponse.json({ ok: true });
}
