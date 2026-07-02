import fs from "node:fs";
import path from "node:path";
import type { Db, Lead, Session, User } from "./types";

// Simple JSON-file-backed store. Genuinely persistent for a single-process
// deployment (npm run start); swap for Postgres/SQLite for multi-instance.
const DATA_DIR = process.env.LEADLY_DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "leadly.json");

const empty: Db = { users: [], sessions: [], leads: [] };

// Cache in module scope so reads are cheap within a process.
let cache: Db | null = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(): Db {
  if (cache) return cache;
  try {
    ensureDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      cache = { ...empty, ...JSON.parse(raw) };
    } else {
      cache = structuredClone(empty);
    }
  } catch {
    cache = structuredClone(empty);
  }
  return cache!;
}

function write(db: Db) {
  cache = db;
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

export function getDb(): Db {
  return read();
}

export function saveDb(mutate: (db: Db) => void) {
  const db = read();
  mutate(db);
  write(db);
}

// ---- Users ----
export function findUserByEmail(email: string): User | undefined {
  return read().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return read().users.find((u) => u.id === id);
}

export function findUserByToken(token: string): User | undefined {
  return read().users.find((u) => u.apiToken === token);
}

export function insertUser(user: User) {
  saveDb((db) => {
    db.users.push(user);
  });
}

export function updateUser(id: string, patch: Partial<User>) {
  saveDb((db) => {
    const u = db.users.find((x) => x.id === id);
    if (u) Object.assign(u, patch);
  });
}

// ---- Sessions ----
export function insertSession(session: Session) {
  saveDb((db) => {
    db.sessions.push(session);
  });
}

export function findSession(token: string): Session | undefined {
  const s = read().sessions.find((x) => x.token === token);
  if (!s) return undefined;
  if (new Date(s.expiresAt).getTime() < Date.now()) return undefined;
  return s;
}

export function deleteSession(token: string) {
  saveDb((db) => {
    db.sessions = db.sessions.filter((x) => x.token !== token);
  });
}

// ---- Leads ----
export function listLeads(userId: string): Lead[] {
  return read()
    .leads.filter((l) => l.userId === userId)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export function getLead(userId: string, id: string): Lead | undefined {
  return read().leads.find((l) => l.id === id && l.userId === userId);
}

export function insertLead(lead: Lead) {
  saveDb((db) => {
    db.leads.push(lead);
  });
}

export function updateLead(userId: string, id: string, patch: Partial<Lead>): Lead | undefined {
  let updated: Lead | undefined;
  saveDb((db) => {
    const l = db.leads.find((x) => x.id === id && x.userId === userId);
    if (l) {
      Object.assign(l, patch, { updatedAt: new Date().toISOString() });
      updated = l;
    }
  });
  return updated;
}

export function deleteLead(userId: string, id: string) {
  saveDb((db) => {
    db.leads = db.leads.filter((l) => !(l.id === id && l.userId === userId));
  });
}
