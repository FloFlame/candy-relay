import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/store";
import { createSession, verifyPassword, publicUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(String(password), user.passwordSalt, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
