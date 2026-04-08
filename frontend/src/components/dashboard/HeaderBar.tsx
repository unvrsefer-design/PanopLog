"use client";

type Props = {
  searchText: string;
  setSearchText: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  statusTab: string;
  setStatusTab: (v: string) => void;
};

export default function HeaderBar({
  searchText,
  setSearchText,
  severityFilter,
  setSeverityFilter,
  statusTab,
  setStatusTab,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Search */}
        <div className="flex-1">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by title, source, component..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Tabs */}
          <div className="flex overflow-hidden rounded-xl border border-slate-300 text-sm">
            {["all", "open", "acknowledged", "resolved", "ignored"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusTab(status)}
                  className={`px-3 py-2 capitalize ${
                    statusTab === status
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}