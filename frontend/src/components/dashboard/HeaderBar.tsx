"use client";

type HeaderBarProps = {
  searchText: string;
  setSearchText: (value: string) => void;
  severityFilter: string;
  setSeverityFilter: (value: string) => void;
  statusTab: string;
  setStatusTab: (value: string) => void;
};

const tabs = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved", label: "Resolved" },
  { key: "ignored", label: "Ignored" },
];

export default function HeaderBar({
  searchText,
  setSearchText,
  severityFilter,
  setSeverityFilter,
  statusTab,
  setStatusTab,
}: HeaderBarProps) {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.10),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.94))] p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(96,165,250,0.04),transparent)]" />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-sky-300 bg-sky-50 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-sky-700">
              AI Incident Intelligence
            </p>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-slate-900 md:text-6xl">
              PanopLog
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
              See everything. Miss nothing.
            </p>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 md:flex-row">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Incident ara: source, title, component"
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
            />

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none transition focus:border-sky-400"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = statusTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}