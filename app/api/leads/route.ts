import { NextResponse } from "next/server";
import { getCurrentUser, newId } from "@/lib/auth";
import { insertLead, listLeads } from "@/lib/store";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ leads: listLeads(user.id) });
}

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [body];
  const now = new Date().toISOString();
  const created: Lead[] = [];

  for (const it of items) {
    if (!it || !it.businessName) continue;
    const lead: Lead = {
      id: newId("lead"),
      userId: user.id,
      businessName: String(it.businessName),
      niche: String(it.niche || ""),
      city: String(it.city || ""),
      address: String(it.address || ""),
      website: String(it.website || ""),
      phone: String(it.phone || ""),
      lat: it.lat ?? null,
      lng: it.lng ?? null,
      status: "new",
      score: null,
      audit: null,
      emailDraft: null,
      notes: "",
      source: String(it.source || "manual"),
      createdAt: now,
      updatedAt: now,
    };
    insertLead(lead);
    created.push(lead);
  }

  return NextResponse.json({ created: created.length, leads: created }, { status: 201 });
}
