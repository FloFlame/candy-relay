import { ProxyAgent } from "undici";

// Server-side fetch that honours HTTPS_PROXY when present (needed in sandboxed
// build environments) and always sends a descriptive User-Agent so services
// like Nominatim don't reject us. Falls back to plain fetch in normal hosting.
const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export async function fetchWithTimeout(url: string, opts: FetchOptions = {}) {
  const { timeoutMs = 8000, ...rest } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "LeadlyBot/1.0 (+https://getleadly.net; website audit tool)",
        ...rest.headers,
      },
      // @ts-expect-error - dispatcher is a valid undici option on Node fetch
      dispatcher,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
