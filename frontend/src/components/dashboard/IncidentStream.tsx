"use client";

import { IncidentItem } from "@/lib/types";

function severityColor(severity?: string) {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "text-red-700 border-red-200 bg-red-50";
    case "high":
      return "text-orange-700 border-orange-200 bg-orange-50";
    case "medium":
      return "text-yellow-700 border-yellow-200 bg-yellow-50";
    case "low":
      return "text-green-700 border-green-200 bg-green-50";
    default:
      return "text-slate-700 border-slate-200 bg-slate-50";
  }
}

function statusColor(status?: string) {
  switch ((status || "open").toLowerCase()) {
    case "acknowledged":
      return "text-blue-700 border-blue-200 bg-blue-50";
    case "resolved":
      return "text-green-700 border-green-200 bg-green-50";
    case "ignored":
      return "text-slate-600 border-slate-200 bg-slate-100";
    case "open":
    default:
      return "text-rose-700 border-rose-200 bg-rose-50";
  }
}

type Props = {
  incidents: IncidentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatRelative: (ts: number) => string;
};

export default function IncidentStream({
  incidents,
  selectedId,
  onSelect,
  formatRelative,
}: Props) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Incident stream
        </h2>
        <span className="text-sm text-slate-500">{incidents.length}</span>
      </div>

      <div className="max-h-[850px] space-y-3 overflow-auto pr-1">
        {incidents.length > 0 ? (
          incidents.map((incident) => {
            const selected = selectedId === incident.id;

            return (
              <button
                key={incident.id}
                onClick={() => onSelect(incident.id)}
                className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-sky-300 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(219,234,254,0.88))] shadow-[0_12px_30px_rgba(59,130,246,0.10)]"
                    : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${severityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`rounded-lg border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusColor(
                        incident.status
                      )}`}
                    >
                      {incident.status || "open"}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    {formatRelative(incident.createdAt)}
                  </span>
                </div>

                <p className="font-semibold text-slate-900 transition group-hover:text-sky-700">
                  {incident.short_title}
                </p>

                <p className="mt-1 text-sm text-slate-500">{incident.source}</p>

                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {incident.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                    {incident.component}
                  </span>

                  {incident.occurrence_count && incident.occurrence_count > 1 ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      x{incident.occurrence_count}
                    </span>
                  ) : null}

                  {incident.similarity_score &&
                  incident.similarity_score > 0 &&
                  incident.similarity_score < 1 ? (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-700">
                      sim {(incident.similarity_score * 100).toFixed(0)}%
                    </span>
                  ) : null}

                  {incident.used_learned_fix ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      learned fix
                    </span>
                  ) : null}

                  {incident.assignee ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700">
                      @{incident.assignee}
                    </span>
                  ) : null}

                  {incident.source_policy?.environment ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      {incident.source_policy.environment}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Henüz incident yok.
          </div>
        )}
      </div>
    </div>
  );
}