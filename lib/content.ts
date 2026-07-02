// Central content source for the Leadly marketing site.
// Copy is derived from the getleadly.net audit spec.

export type IconName =
  | "search"
  | "gauge"
  | "target"
  | "mail"
  | "camera"
  | "swords"
  | "layout"
  | "download";

export const journey = [
  {
    step: "01",
    title: "Find",
    icon: "search" as IconName,
    body: "Pull local businesses by niche and city straight from open map data — no scraping, no guesswork.",
  },
  {
    step: "02",
    title: "Analyse",
    icon: "gauge" as IconName,
    body: "Audit every site across speed, mobile, SEO, design and security, then score it 0–100.",
  },
  {
    step: "03",
    title: "Connect",
    icon: "mail" as IconName,
    body: "Reach out with personalised, honest emails built from the real issues Leadly found.",
  },
  {
    step: "04",
    title: "Close",
    icon: "target" as IconName,
    body: "Track every prospect through a clean pipeline until they become a paying client.",
  },
];

export const features = [
  {
    icon: "search" as IconName,
    title: "Business finder",
    body: "Pulls local businesses by niche and city straight from open map data.",
  },
  {
    icon: "gauge" as IconName,
    title: "Website audits",
    body: "Automatically checks sites across speed, mobile, SEO, design and security.",
  },
  {
    icon: "target" as IconName,
    title: "Opportunity scoring",
    body: "Ranks prospects 0–100 so you can contact the best ones first.",
  },
  {
    icon: "mail" as IconName,
    title: "AI email generator",
    body: "Writes honest outreach based on the issues actually found on each site.",
  },
  {
    icon: "camera" as IconName,
    title: "Website screenshots",
    body: "Captures the prospect's current site so you can show exactly what's wrong.",
  },
  {
    icon: "swords" as IconName,
    title: "Competitor analysis",
    body: "Compares a business against others in the same trade and city.",
  },
  {
    icon: "layout" as IconName,
    title: "Lead dashboard",
    body: "One clear view of every prospect and its status across your pipeline.",
  },
  {
    icon: "download" as IconName,
    title: "CSV exports & public API",
    body: "Take your leads elsewhere or build on top of Leadly's public API.",
  },
];

export type Plan = {
  name: string;
  price: string;
  period: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

export const plans: Plan[] = [
  {
    name: "Trial",
    price: "€0",
    period: "14 days free",
    blurb: "Kick the tyres on real leads before you pay a cent.",
    cta: "Start free",
    features: [
      "Business search",
      "Website audits",
      "Opportunity scoring",
      "Lead dashboard",
    ],
  },
  {
    name: "Starter",
    price: "€25",
    period: "per month",
    blurb: "For freelancers who want outreach on autopilot.",
    cta: "Start free",
    features: [
      "Everything in Trial",
      "AI email generator",
      "CSV exports",
      "Website screenshots",
    ],
  },
  {
    name: "Professional",
    price: "€65",
    period: "per month",
    blurb: "For agencies scaling their pipeline.",
    cta: "Start free",
    featured: true,
    features: [
      "Everything in Starter",
      "Competitor analysis",
      "Public API access",
      "Priority support",
    ],
  },
  {
    name: "Lifetime",
    price: "€375",
    period: "one-time",
    blurb: "Every feature, forever. No recurring fees.",
    cta: "Get lifetime",
    features: [
      "Everything in Professional",
      "All future updates",
      "No monthly billing",
      "Founder's badge",
    ],
  },
];

export const testimonials = [
  {
    quote:
      "I booked three web-design retainers in my first fortnight. The audit screenshots do the selling for me — prospects can't argue with their own broken site.",
    name: "Marta Kowalski",
    role: "Freelance web designer, Kraków",
    initials: "MK",
  },
  {
    quote:
      "We swapped a spreadsheet and two interns for Leadly. Opportunity scoring means my team only ever calls the leads worth calling.",
    name: "Devon Reyes",
    role: "Founder, Northlight Digital",
    initials: "DR",
  },
  {
    quote:
      "The honest-outreach angle just works. Reply rates went from 4% to 19% because the emails actually reference what's wrong with their site.",
    name: "Aisha Bello",
    role: "Growth lead, Studio Fern",
    initials: "AB",
  },
];

export const stats = [
  { value: "12k+", label: "Sites audited monthly" },
  { value: "0–100", label: "Opportunity score" },
  { value: "5", label: "Signals per audit" },
  { value: "19%", label: "Avg. reply rate" },
];

export const faqs = [
  {
    q: "Where does Leadly get its business data?",
    a: "Leadly pulls local businesses by niche and city straight from open map data. There's no scraping of private sources — everything comes from publicly available listings.",
  },
  {
    q: "What exactly does the website audit check?",
    a: "Each audit scores a site across five signals: speed, mobile-friendliness, SEO, design and security. Those roll up into a single 0–100 opportunity score so you know who to contact first.",
  },
  {
    q: "Is the AI outreach actually personalised?",
    a: "Yes. The AI email generator writes each message from the real issues found in that prospect's audit, so you're referencing genuine problems — not sending a generic blast.",
  },
  {
    q: "Can I get my data out of Leadly?",
    a: "Always. Every plan from Starter up includes CSV exports, and Professional adds full access to our public API so you can pipe leads into your own tools.",
  },
  {
    q: "Do you offer an enterprise plan?",
    a: "Yes — enterprise is available on request with unlimited devices, custom limits and a dedicated point of contact. Reach out to sales@getleadly.net.",
  },
  {
    q: "Is Leadly GDPR compliant?",
    a: "We only process publicly available business information and handle any personal data in line with the GDPR. See our Privacy page for how we store, use and delete data.",
  },
];

export const resources = [
  {
    tag: "Playbook",
    title: "How to audit a local business site in 90 seconds",
    excerpt:
      "The five signals that tell you instantly whether a local site is worth a pitch — and how to frame each one in outreach.",
    read: "6 min read",
  },
  {
    tag: "Local SEO",
    title: "Why 'honest outreach' out-converts every cold template",
    excerpt:
      "Referencing a prospect's real problems beats flattery every time. Here's the psychology and the exact structure we use.",
    read: "8 min read",
  },
  {
    tag: "Agency growth",
    title: "Turning a 0–100 score into a repeatable sales pipeline",
    excerpt:
      "How to build a prioritised outreach workflow around opportunity scoring so your team only ever works the best leads.",
    read: "5 min read",
  },
];

export const nav = [
  { label: "How it works", href: "#journey" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Resources", href: "#resources" },
];
