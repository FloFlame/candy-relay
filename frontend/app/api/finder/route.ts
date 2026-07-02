import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findBusinesses } from "@/lib/finder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { niche, city } = await req.json().catch(() => ({}));
  if (!niche || !city) {
    return NextResponse.json({ error: "Please provide both a niche and a city." }, { status: 400 });
  }
  const { results, source } = await findBusinesses(String(niche), String(city), 20);
  return NextResponse.json({ results, source });
}
