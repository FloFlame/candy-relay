import { NextResponse } from "next/server";
import { getCurrentUser, newApiToken, publicUser } from "@/lib/auth";
import { updateUser, findUserById } from "@/lib/store";
import type { Plan } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS: Plan[] = ["trial", "starter", "professional", "lifetime"];

export async function PATCH(req: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.plan === "string" && PLANS.includes(body.plan)) patch.plan = body.plan;
  if (body.regenerateToken === true) patch.apiToken = newApiToken();

  updateUser(user.id, patch);
  const fresh = findUserById(user.id)!;
  return NextResponse.json({ user: publicUser(fresh) });
}
