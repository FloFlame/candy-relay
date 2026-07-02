import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  findSession,
  findUserById,
  insertSession,
  deleteSession,
} from "./store";
import type { User } from "./types";

export const SESSION_COOKIE = "leadly_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string, salt?: string) {
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { hash, salt: useSalt };
}

export function verifyPassword(password: string, salt: string, expected: string) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

export function newApiToken() {
  return `lk_live_${crypto.randomBytes(20).toString("hex")}`;
}

export function createSession(userId: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  insertSession({ token, userId, expiresAt });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  cookies().delete(SESSION_COOKIE);
}

/** Returns the logged-in user or null. Safe to call in server components/routes. */
export function getCurrentUser(): User | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = findSession(token);
  if (!session) return null;
  return findUserById(session.userId) ?? null;
}

export function publicUser(user: User) {
  const { passwordHash, passwordSalt, ...rest } = user;
  return rest;
}
