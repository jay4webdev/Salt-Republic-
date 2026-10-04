import { getSubscribers } from "@/lib/queries";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | Date): string {
  const s = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const rows = await getSubscribers();
  const header = ["ID", "WhatsApp Number", "Source", "Joined At"];
  const lines = [
    header.join(","),
    ...rows.map((r: any) =>
      [r.id, r.whatsapp, r.source, r.createdAt].map(csvEscape).join(",")
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=salt-republic-whatsapp-community.csv",
    },
  });
}
