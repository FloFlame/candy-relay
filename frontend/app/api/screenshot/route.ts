export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Renders a lightweight SVG "site preview" for a given URL + score. Real pixel
// screenshots need a headless browser in production; this keeps the feature
// dependency-free while still visualising the prospect. Set SCREENSHOT_API_URL
// to proxy a real screenshot service if you have one.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  const score = searchParams.get("score");
  const host = safeHost(url);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" role="img" aria-label="Preview of ${escapeXml(host)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="1" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#bg)"/>
  <rect x="0" y="0" width="640" height="44" fill="#312e81"/>
  <circle cx="24" cy="22" r="6" fill="#f87171"/>
  <circle cx="46" cy="22" r="6" fill="#fbbf24"/>
  <circle cx="68" cy="22" r="6" fill="#34d399"/>
  <rect x="96" y="12" width="520" height="20" rx="10" fill="#4338ca"/>
  <text x="112" y="27" font-family="monospace" font-size="13" fill="#c7d2fe">${escapeXml(host || "no-website")}</text>
  <rect x="40" y="86" width="360" height="30" rx="6" fill="#818cf8"/>
  <rect x="40" y="132" width="560" height="14" rx="7" fill="#a5b4fc"/>
  <rect x="40" y="156" width="520" height="14" rx="7" fill="#a5b4fc"/>
  <rect x="40" y="180" width="480" height="14" rx="7" fill="#c7d2fe"/>
  <rect x="40" y="230" width="170" height="110" rx="10" fill="#ffffff"/>
  <rect x="235" y="230" width="170" height="110" rx="10" fill="#ffffff"/>
  <rect x="430" y="230" width="170" height="110" rx="10" fill="#ffffff"/>
  ${
    score != null
      ? `<circle cx="560" cy="70" r="34" fill="#ffffff"/><text x="560" y="66" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#4f46e5">${escapeXml(score)}</text><text x="560" y="84" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#64748b">OPP</text>`
      : ""
  }
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function safeHost(url: string) {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : "https://" + url).host;
  } catch {
    return url;
  }
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}
