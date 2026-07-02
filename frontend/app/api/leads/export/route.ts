import { getCurrentUser } from "@/lib/auth";
import { listLeads } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const leads = listLeads(user.id);
  const headers = [
    "business_name",
    "niche",
    "city",
    "website",
    "phone",
    "address",
    "status",
    "opportunity_score",
    "health_score",
    "audited_at",
  ];
  const rows = leads.map((l) =>
    [
      l.businessName,
      l.niche,
      l.city,
      l.website,
      l.phone,
      l.address,
      l.status,
      l.audit?.opportunity ?? "",
      l.audit?.health ?? "",
      l.audit?.auditedAt ?? "",
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leadly-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
