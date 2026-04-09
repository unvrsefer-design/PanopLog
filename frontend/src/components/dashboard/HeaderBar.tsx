"use client";

import Link from "next/link";

type Props = {
  searchText: string;
  setSearchText: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  statusTab: string;
  setStatusTab: (v: string) => void;
  selectedIncident?: {
    id: string;
    short_title: string;
  } | null;
};

export default function HeaderBar({
  searchText,
  setSearchText,
  severityFilter,
  setSeverityFilter,
  statusTab,
  setStatusTab,
  selectedIncident,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

      {/* LEFT: LOGO + BREADCRUMB */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/"
          className="text-lg font-semibold text-slate-900 hover:underline"
        >
          Panop<span className="text-blue-600">Log</span>
        </Link>

        {selectedIncident && (
          <>
            <span className="text-slate-400">/</span>
            <span
              className="text-slate-600"
              title={selectedIncident.short_title}
            >
              {selectedIncident.short_title}
            </span>
          </>
        )}
      </div>

      {/* CENTER: SEARCH */}
      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search by title, source, component..."
        className="flex-1 rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-400"
      />

      {/* RIGHT: FILTERS */}
      <div className="flex items-center gap-2">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {["all", "open", "acknowledged", "resolved", "ignored"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusTab(s)}
            className={`rounded-xl px-3 py-2 text-sm ${
              statusTab === s
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s === "all"
              ? "All"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}