export type Plan = "trial" | "starter" | "professional" | "lifetime";

export type LeadStatus = "new" | "contacted" | "replied" | "won" | "lost";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  plan: Plan;
  apiToken: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface AuditSignals {
  speed: number;
  mobile: number;
  seo: number;
  design: number;
  security: number;
}

export interface AuditResult {
  ok: boolean;
  finalUrl: string;
  statusCode: number | null;
  responseMs: number | null;
  health: number; // 0-100, higher = healthier site
  opportunity: number; // 0-100, higher = better prospect (weaker site)
  signals: AuditSignals;
  issues: string[]; // human-readable problems, used by the email generator
  meta: {
    title: string | null;
    https: boolean;
    hasViewport: boolean;
    hasDescription: boolean;
    hasH1: boolean;
    hasLang: boolean;
    bytes: number | null;
  };
  error?: string;
  auditedAt: string;
}

export interface Lead {
  id: string;
  userId: string;
  businessName: string;
  niche: string;
  city: string;
  address: string;
  website: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  status: LeadStatus;
  score: number | null; // opportunity score, mirrors audit.opportunity
  audit: AuditResult | null;
  emailDraft: string | null;
  notes: string;
  source: string; // "openstreetmap" | "sample" | "manual"
  createdAt: string;
  updatedAt: string;
}

export interface Db {
  users: User[];
  sessions: Session[];
  leads: Lead[];
}
