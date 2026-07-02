import { findUserByToken } from "./store";
import type { User } from "./types";

// Resolves the API user from an `Authorization: Bearer <token>` header.
export function userFromRequest(req: Request): User | null {
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim();
  if (!token) return null;
  return findUserByToken(token) ?? null;
}
