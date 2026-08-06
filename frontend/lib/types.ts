// Frontend types mirroring the FastAPI backend's JSON responses (snake_case).

export type Role = "owner" | "admin" | "user";
export type Plan = "trial" | "monthly" | "annual" | "lifetime" | "enterprise";

export type LeadStatus = "new" | "audited" | "contacted" | "replied" | "won" | "lost" | "ignored";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "audited", label: "Audited" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "ignored", label: "Ignored" },
];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  business_name: string;
  website: string;
  domain: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  category: string;
  google_rating: number | null;
  review_count: number | null;
  status: LeadStatus;
  overall_score: number | null;
  priority: "high" | "medium" | "low" | null;
  language: string;
  notes: string;
  last_audited_at: string | null;
  created_at: string;
  source?: string;
}

export interface Finding {
  category: string;
  issue: string;
  weight: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  reason: string;
  fix: string;
}

export interface Audit {
  id: string;
  reachable: boolean;
  final_url: string;
  status_code: number | null;
  response_ms: number | null;
  overall_score: number;
  opportunity_score: number;
  priority: "high" | "medium" | "low";
  category_scores: Record<string, number>;
  findings: Finding[];
  meta: Record<string, any>;
  created_at: string;
}

export interface OutreachMsg {
  id?: string;
  variant: string;
  language: string;
  subject: string;
  body: string;
  generated_by: string;
  created_at?: string;
}

export interface FoundBusiness {
  business_name: string;
  website: string;
  domain: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  category: string;
  google_rating: number | null;
  review_count: number | null;
  source: string;
  [k: string]: any;
}

export const OUTREACH_VARIANTS: { value: string; label: string }[] = [
  { value: "soft_email", label: "Soft email" },
  { value: "direct_email", label: "Direct email" },
  { value: "whatsapp", label: "WhatsApp / SMS" },
  { value: "linkedin", label: "LinkedIn DM" },
  { value: "follow_up_1", label: "Follow-up 1" },
  { value: "follow_up_2", label: "Follow-up 2" },
];

export const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "pl", label: "Polski" },
  { value: "tr", label: "Türkçe" },
];
