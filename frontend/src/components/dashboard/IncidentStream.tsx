"use client";

import { IncidentItem } from "@/lib/types";

type Props = {
  incidents: IncidentItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  formatRelative: (ts: number) => string;
};

function severityClass(severity?: string) {
  switch ((severity || "").toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function statusClass(status?: string) {
  switch ((status || "open").toLowerCase()) {
    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "acknowledged":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ignored":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export default function IncidentStream({
  incidents,
  selectedId,
  onSelect,
  formatRelative,
}: Props) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between px-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
            Incident Stream
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Son Incident’lar
          </h3>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
          {incidents.length} kayıt
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">
            Henüz incident yok
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Yeni bir analiz çalıştırınca burada görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const isSelected = selectedId === incident.id;

            return (
              <button
                key={incident.id}
                type="button"
                onClick={() => onSelect(incident.id)}
                className={`block w-full rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-sky-300 bg-sky-50/70 shadow-[0_10px_30px_rgba(14,165,233,0.10)]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${severityClass(
                          incident.severity
                        )}`}
                      >
                        {incident.severity || "unknown"}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                          incident.status
                        )}`}
                      >
                        {incident.status || "open"}
                      </span>

                      {incident.used_learned_fix ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                          learned fix
                        </span>
                      ) : null}
                    </div>

                    <div className="truncate text-sm font-semibold text-slate-900">
                      {incident.short_title || "Unknown Incident"}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{incident.component || "unknown-component"}</span>
                      <span>•</span>
                      <span>{incident.source || "unknown-source"}</span>
                    </div>

                    {incident.summary ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                        {incident.summary}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-xs text-slate-400">
                      {formatRelative(
                        (incident.last_seen_at || incident.createdAt / 1000) * 1000
                      )}
                    </div>

                    {incident.occurrence_count > 1 ? (
                      <div className="mt-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        x{incident.occurrence_count}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  {incident.assignee ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      @{incident.assignee}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-400">
                      unassigned
                    </span>
                  )}

                  {incident.notes?.length ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      {incident.notes.length} note
                    </span>
                  ) : null}

                  {incident.events?.length ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      {incident.events.length} event
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}