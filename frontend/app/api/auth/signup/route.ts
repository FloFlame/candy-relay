import { NextResponse } from "next/server";
import { findUserByEmail, insertUser } from "@/lib/store";
import {
  createSession,
  hashPassword,
  newApiToken,
  newId,
  publicUser,
} from "@/lib/auth";
import type { User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(String(password));
  const user: User = {
    id: newId("usr"),
    email: String(email).trim(),
    name: String(name || email.split("@")[0]).trim(),
    passwordHash: hash,
    passwordSalt: salt,
    plan: "trial",
    apiToken: newApiToken(),
    createdAt: new Date().toISOString(),
  };
  insertUser(user);
  createSession(user.id);
  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
