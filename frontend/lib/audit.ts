import { fetchWithTimeout } from "./http";
import type { AuditResult, AuditSignals } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeUrl(input: string) {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

// Weighting reflects how strongly each signal predicts a "weak" site.
const WEIGHTS: AuditSignals = {
  speed: 0.2,
  mobile: 0.25,
  seo: 0.25,
  design: 0.15,
  security: 0.15,
};

/**
 * Really fetches the target site and scores it across five signals. Returns a
 * health score (higher = healthier) and its inverse opportunity score (higher =
 * better prospect), plus a list of concrete issues used for outreach.
 */
export async function auditSite(rawUrl: string): Promise<AuditResult> {
  const auditedAt = new Date().toISOString();
  if (!rawUrl || !rawUrl.trim()) {
    return unreachable("", "No website on file", auditedAt);
  }

  const url = normalizeUrl(rawUrl);
  const start = Date.now();
  let res: Response;
  try {
    res = await fetchWithTimeout(url, { timeoutMs: 9000 });
  } catch {
    // Retry over http if https failed outright.
    try {
      res = await fetchWithTimeout(url.replace(/^https:/i, "http:"), {
        timeoutMs: 9000,
      });
    } catch (e) {
      return unreachable(url, "Site did not respond", auditedAt);
    }
  }
  const responseMs = Date.now() - start;
  const finalUrl = res.url || url;
  const https = finalUrl.startsWith("https://");

  let html = "";
  try {
    html = (await res.text()).slice(0, 500_000);
  } catch {
    html = "";
  }
  const bytes = html.length;
  const lower = html.toLowerCase();

  // --- Signal extraction ---
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")
    .replace(/\s+/g, " ")
    .trim();
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasDescription = /<meta[^>]+name=["']description["'][^>]*content=/i.test(html);
  const hasH1 = /<h1[\b >]/i.test(html);
  const hasLang = /<html[^>]+lang=/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasOg = /<meta[^>]+property=["']og:/i.test(html);
  const hasFavicon = /<link[^>]+rel=["'][^"']*icon/i.test(html);
  const hasStylesheet = /<link[^>]+rel=["']stylesheet["']/i.test(lower) || /<style[\b >]/i.test(lower);
  const isHtml5 = /<!doctype html>/i.test(html.slice(0, 200));
  const insecureRefs = https && /(src|href)=["']http:\/\//i.test(html);
  const hsts = res.headers.get("strict-transport-security");

  // --- Scoring ---
  // Speed: response time + payload size.
  let speed = 100;
  if (responseMs > 500) speed -= Math.min(60, (responseMs - 500) / 60);
  if (bytes > 150_000) speed -= Math.min(20, (bytes - 150_000) / 25_000);
  speed = clamp(speed);

  // Mobile: viewport is the dominant factor.
  let mobile = hasViewport ? 92 : 28;
  if (hasViewport && /width=device-width/i.test(html)) mobile += 8;
  mobile = clamp(mobile);

  // SEO: title, description, h1, lang, canonical, og.
  let seo = 0;
  seo += title ? 28 : 0;
  seo += title && title.length >= 10 && title.length <= 65 ? 6 : 0;
  seo += hasDescription ? 24 : 0;
  seo += hasH1 ? 16 : 0;
  seo += hasLang ? 8 : 0;
  seo += hasCanonical ? 9 : 0;
  seo += hasOg ? 9 : 0;
  seo = clamp(seo);

  // Design: modern doctype, stylesheet, favicon, responsive, images.
  let design = 40;
  if (isHtml5) design += 15;
  if (hasStylesheet) design += 20;
  if (hasFavicon) design += 10;
  if (hasViewport) design += 15;
  design = clamp(design);

  // Security: https, HSTS, no mixed content, ok status.
  let security = https ? 80 : 20;
  if (https && hsts) security += 15;
  if (insecureRefs) security -= 15;
  if (res.status >= 400) security -= 20;
  security = clamp(security);

  const signals: AuditSignals = { speed, mobile, seo, design, security };
  const health = clamp(
    signals.speed * WEIGHTS.speed +
      signals.mobile * WEIGHTS.mobile +
      signals.seo * WEIGHTS.seo +
      signals.design * WEIGHTS.design +
      signals.security * WEIGHTS.security
  );
  const opportunity = clamp(100 - health);

  // --- Human-readable issues (drive the outreach email) ---
  const issues: string[] = [];
  if (!https) issues.push("The site isn't served over HTTPS, so browsers flag it as 'Not secure'.");
  else if (!hsts) issues.push("HTTPS is on but HSTS isn't set, leaving a downgrade gap.");
  if (insecureRefs) issues.push("Some resources still load over insecure http://, causing mixed-content warnings.");
  if (!hasViewport) issues.push("There's no mobile viewport tag, so the site won't scale on phones.");
  if (responseMs > 2500) issues.push(`The homepage took ${(responseMs / 1000).toFixed(1)}s to respond — slow enough to lose visitors.`);
  if (bytes > 250_000) issues.push("The page weight is heavy, which hurts load time on mobile data.");
  if (!title) issues.push("The page is missing a <title>, which search engines rely on.");
  if (!hasDescription) issues.push("There's no meta description, so search snippets are auto-generated.");
  if (!hasH1) issues.push("No H1 heading was found, weakening on-page SEO structure.");
  if (!hasFavicon) issues.push("No favicon is set, which looks unpolished in browser tabs.");
  if (res.status >= 400) issues.push(`The homepage returned an HTTP ${res.status} error.`);
  if (issues.length === 0) issues.push("The site is broadly healthy — position your pitch around growth, not fixes.");

  return {
    ok: true,
    finalUrl,
    statusCode: res.status,
    responseMs,
    health,
    opportunity,
    signals,
    issues,
    meta: { title: title || null, https, hasViewport, hasDescription, hasH1, hasLang, bytes },
    auditedAt,
  };
}

function unreachable(url: string, error: string, auditedAt: string): AuditResult {
  // An unreachable / broken site is itself a strong signal of opportunity.
  return {
    ok: false,
    finalUrl: url,
    statusCode: null,
    responseMs: null,
    health: 8,
    opportunity: 92,
    signals: { speed: 5, mobile: 5, seo: 5, design: 10, security: 15 },
    issues: [
      url
        ? "The website couldn't be reached at all — it may be down, misconfigured, or nonexistent."
        : "This business has no website on file — a prime opportunity to build one.",
    ],
    meta: {
      title: null,
      https: false,
      hasViewport: false,
      hasDescription: false,
      hasH1: false,
      hasLang: false,
      bytes: null,
    },
    error,
    auditedAt,
  };
}
