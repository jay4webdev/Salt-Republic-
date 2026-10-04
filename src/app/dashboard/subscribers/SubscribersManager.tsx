"use client";

import { useState } from "react";
import type { subscribers } from "@/db/schema";
import { deleteSubscriber } from "./actions";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";

type Subscriber = typeof subscribers.$inferSelect;

export default function SubscribersManager({
  subscribers: initial,
}: {
  subscribers: Subscriber[];
}) {
  const [rows, setRows] = useState(initial);

  async function remove(row: Subscriber) {
    const previous = rows;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    const res = await deleteSubscriber(row.id);
    if (!res?.ok) setRows(previous);
  }

  return (
    <>
      <PageHeader
        title="WhatsApp Community"
        description="Numbers collected from the website for upcoming group trips, offers and new experiences. Export as CSV to connect a WhatsApp Community workflow."
        action={
          rows.length > 0 ? (
            <a href="/api/admin/subscribers/export" className="btn btn-dark">
              Export CSV
            </a>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No community members yet"
          body="Visitors who join the WhatsApp Community from the website will appear here."
        />
      ) : (
        <div className="overflow-x-auto border border-navy-900/10 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-900/10 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                <th className="px-5 py-4 font-bold">WhatsApp Number</th>
                <th className="px-5 py-4 font-bold">Source</th>
                <th className="px-5 py-4 font-bold">Joined</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-navy-900/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-navy-900">
                    {s.whatsapp}
                  </td>
                  <td className="px-5 py-4 capitalize text-stone">{s.source.replace(/-/g, " ")}</td>
                  <td className="px-5 py-4 text-stone">
                    {s.createdAt.toLocaleDateString("en-MV", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => remove(s)}
                      className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-navy-900/10 bg-ivory/50 px-5 py-3 text-xs text-stone">
            {rows.length} member{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </>
  );
}
