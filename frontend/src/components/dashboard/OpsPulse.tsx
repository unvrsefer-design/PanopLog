"use client";

import { IncidentItem } from "@/lib/types";

type Props = {
  incident: IncidentItem | null;
  topSources: [string, number][];
  topComponents: [string, number][];
};

export default function OpsPulse({
  incident,
  topSources,
  topComponents,
}: Props) {
  const severityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <aside className="space-y-4">
      {/* Active Incident */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Active Incident
        </h3>

        {incident ? (
          <div className="space-y-3">
            <div
              className={`inline-flex rounded-xl border px-3 py-1 text-xs font-medium ${severityColor(
                incident.severity
              )}`}
            >
              {incident.severity.toUpperCase()}
            </div>

            <div className="text-sm font-semibold text-slate-900">
              {incident.short_title}
            </div>

            <div className="text-xs text-slate-500">
              {incident.component} • {incident.source}
            </div>

            <div className="text-xs text-slate-400">
              Occurrence: {incident.occurrence_count}
            </div>

            {incident.used_learned_fix && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 border border-emerald-200">
                Learned fix applied
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No incident selected</div>
        )}
      </div>

      {/* Top Sources */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Top Sources
        </h3>

        <div className="space-y-2">
          {topSources.length === 0 && (
            <div className="text-xs text-slate-400">No data</div>
          )}

          {topSources.map(([source, count]) => (
            <div
              key={source}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-700">{source}</span>
              <span className="text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Components */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Top Components
        </h3>

        <div className="space-y-2">
          {topComponents.length === 0 && (
            <div className="text-xs text-slate-400">No data</div>
          )}

          {topComponents.map(([component, count]) => (
            <div
              key={component}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-700">{component}</span>
              <span className="text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insight */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Insight
        </h3>

        {incident ? (
          <div className="text-xs text-slate-600 leading-5">
            {incident.severity === "critical"
              ? "Critical issue detected. Immediate action recommended."
              : incident.severity === "high"
              ? "High severity incident. Monitor closely."
              : "System stable. No urgent action required."}
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Select an incident to see insight
          </div>
        )}
      </div>
    </aside>
  );
}