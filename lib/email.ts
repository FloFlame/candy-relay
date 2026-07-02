import type { Lead } from "./types";

export type Tone = "friendly" | "direct" | "formal";

// Generates honest outreach from the real issues found in the audit. This is
// deterministic and needs no API key; to swap in an LLM, replace the body of
// this function with a call to your provider using `lead.audit.issues`.
export function generateEmail(lead: Lead, tone: Tone = "friendly"): string {
  const name = lead.businessName;
  const audit = lead.audit;
  const issues = audit?.issues?.slice(0, 3) ?? [];
  const firstName = "there";
  const opp = audit?.opportunity ?? lead.score ?? 0;

  const bullets = issues.map((i) => `  • ${i}`).join("\n");

  const openings: Record<Tone, string> = {
    friendly: `Hi ${firstName},\n\nI came across ${name} while looking at ${lead.niche || "local"} businesses in ${lead.city || "your area"}, and I took a quick look at your website.`,
    direct: `Hi ${firstName},\n\nI audited ${name}'s website today and found a few things that are likely costing you customers.`,
    formal: `Dear ${name} team,\n\nI recently reviewed your website as part of research into ${lead.niche || "local"} businesses in ${lead.city || "the area"}.`,
  };

  const middle =
    issues.length > 0
      ? `\n\nA few specifics I noticed:\n${bullets}\n`
      : "\n\nOverall it's in decent shape, but there's room to convert more of your visitors.\n";

  const value: Record<Tone, string> = {
    friendly: `These are the kinds of things that quietly turn visitors away before they ever call. I help ${lead.niche || "local"} businesses fix exactly this, and I'd be happy to put together a short, no-obligation walkthrough of what I'd change.`,
    direct: `Each of these is a direct leak in your enquiries. I fix these for ${lead.niche || "local"} businesses and can show you the before/after in 15 minutes.`,
    formal: `Addressing these items would improve both your search visibility and the experience for prospective customers. I would welcome the opportunity to discuss a proposal at your convenience.`,
  };

  const closings: Record<Tone, string> = {
    friendly: `\n\nWorth a quick chat this week?\n\nBest,\nYour name`,
    direct: `\n\nWant me to send the full audit?\n\nCheers,\nYour name`,
    formal: `\n\nKind regards,\nYour name`,
  };

  const subject = subjectLine(lead, tone);
  return `Subject: ${subject}\n\n${openings[tone]}${middle}\n${value[tone]}${closings[tone]}`;
}

export function subjectLine(lead: Lead, tone: Tone): string {
  const name = lead.businessName;
  const opp = lead.audit?.opportunity ?? lead.score ?? 0;
  if (tone === "direct") return `${name}: 3 quick fixes for your website`;
  if (tone === "formal") return `Website review for ${name}`;
  if (opp >= 60) return `Quick note about ${name}'s website`;
  return `Loved what ${name} is doing — one small idea`;
}
