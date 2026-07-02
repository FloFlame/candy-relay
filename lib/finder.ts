import { fetchWithTimeout } from "./http";

export interface FoundBusiness {
  businessName: string;
  address: string;
  website: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  source: "openstreetmap" | "sample";
}

// Map common niche words to OpenStreetMap tag filters.
const NICHE_TAGS: Record<string, string[]> = {
  dentist: ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
  restaurant: ['["amenity"="restaurant"]'],
  cafe: ['["amenity"="cafe"]'],
  bar: ['["amenity"="bar"]', '["amenity"="pub"]'],
  plumber: ['["craft"="plumber"]', '["shop"="trade"]'],
  electrician: ['["craft"="electrician"]'],
  lawyer: ['["office"="lawyer"]', '["amenity"="lawyer"]'],
  accountant: ['["office"="accountant"]'],
  hairdresser: ['["shop"="hairdresser"]'],
  salon: ['["shop"="hairdresser"]', '["shop"="beauty"]'],
  gym: ['["leisure"="fitness_centre"]', '["amenity"="gym"]'],
  bakery: ['["shop"="bakery"]'],
  florist: ['["shop"="florist"]'],
  mechanic: ['["shop"="car_repair"]'],
  roofer: ['["craft"="roofer"]'],
  builder: ['["craft"="builder"]', '["office"="construction_company"]'],
  photographer: ['["craft"="photographer"]', '["shop"="photo"]'],
  veterinary: ['["amenity"="veterinary"]'],
  optician: ['["shop"="optician"]'],
  pharmacy: ['["amenity"="pharmacy"]'],
  hotel: ['["tourism"="hotel"]'],
  realestate: ['["office"="estate_agent"]'],
};

function tagsForNiche(niche: string): string[] {
  const key = niche.toLowerCase().replace(/[^a-z]/g, "");
  for (const k of Object.keys(NICHE_TAGS)) {
    if (key.includes(k)) return NICHE_TAGS[k];
  }
  // Generic fallback: fuzzy name match across shops & offices.
  const safe = niche.replace(/["\\]/g, "");
  return [
    `["shop"]["name"~"${safe}",i]`,
    `["office"]["name"~"${safe}",i]`,
    `["amenity"]["name"~"${safe}",i]`,
  ];
}

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`,
      { headers: { accept: "application/json" }, timeoutMs: 8000 }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function findBusinesses(
  niche: string,
  city: string,
  limit = 20
): Promise<{ results: FoundBusiness[]; source: "openstreetmap" | "sample" }> {
  const geo = await geocodeCity(city);
  if (geo) {
    try {
      const radius = 12000; // metres
      const filters = tagsForNiche(niche)
        .map(
          (t) =>
            `node${t}(around:${radius},${geo.lat},${geo.lng});way${t}(around:${radius},${geo.lat},${geo.lng});`
        )
        .join("");
      const query = `[out:json][timeout:20];(${filters});out center ${limit};`;
      const res = await fetchWithTimeout("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        timeoutMs: 20000,
      });
      const data = (await res.json()) as { elements: any[] };
      const results = (data.elements || [])
        .map((el) => mapElement(el))
        .filter((b): b is FoundBusiness => b !== null)
        .slice(0, limit);
      if (results.length) return { results, source: "openstreetmap" };
    } catch {
      // fall through to sample
    }
  }
  return { results: sampleBusinesses(niche, city, limit), source: "sample" };
}

function mapElement(el: any): FoundBusiness | null {
  const t = el.tags || {};
  const name = t.name || t["name:en"];
  if (!name) return null;
  const addr = [t["addr:housenumber"], t["addr:street"], t["addr:city"], t["addr:postcode"]]
    .filter(Boolean)
    .join(", ");
  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;
  return {
    businessName: name,
    address: addr,
    website: (t.website || t["contact:website"] || t.url || "").trim(),
    phone: (t.phone || t["contact:phone"] || "").trim(),
    lat,
    lng,
    source: "openstreetmap",
  };
}

// Deterministic sample generator so the finder always returns believable
// results when open-map data is unavailable (offline/sandboxed environments).
function sampleBusinesses(niche: string, city: string, limit: number): FoundBusiness[] {
  const nicheClean = niche.trim() || "Local business";
  const cityClean = city.trim() || "Town";
  const prefixes = ["Sunrise", "Elm Street", "Premier", "Harbour", "Oakwood", "Cornerstone", "Bright", "Maple", "Riverside", "Golden", "Summit", "Ironclad", "Blue Sky", "Evergreen", "Downtown", "Heritage", "Anchor", "Crestview", "Willow", "Pioneer"];
  const suffixes = ["Co.", "& Sons", "Group", "Studio", "Services", "Ltd", "Practice", "Collective", "Partners", "Works"];
  // Some deliberately have no / weak websites — these become the best leads.
  const out: FoundBusiness[] = [];
  for (let i = 0; i < Math.min(limit, prefixes.length); i++) {
    const hasSite = i % 3 !== 0; // ~1/3 have no website at all
    const slug = prefixes[i].toLowerCase().replace(/[^a-z]/g, "");
    out.push({
      businessName: `${prefixes[i]} ${titleCase(nicheClean)} ${suffixes[i % suffixes.length]}`,
      address: `${100 + i * 7} ${prefixes[i]} Road, ${cityClean}`,
      website: hasSite ? `http://${slug}${slug.length % 2 ? "" : "-"}${cityClean.toLowerCase().replace(/[^a-z]/g, "")}.com` : "",
      phone: `+1 555 0${(100 + i).toString().slice(-3)} ${(2000 + i * 13).toString().slice(-4)}`,
      lat: null,
      lng: null,
      source: "sample",
    });
  }
  return out;
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
