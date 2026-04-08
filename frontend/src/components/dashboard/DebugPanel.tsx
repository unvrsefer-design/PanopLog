"use client";

type DebugEvent = {
  type?: string;
  created_at?: number;
  data?: Record<string, any>;
};

type Props = {
  wsConnected: boolean;
  selectedIncidentId: string | null;
  events: DebugEvent[];
};

export default function DebugPanel({
  wsConnected,
  selectedIncidentId,
  events,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Debug Panel
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">WebSocket</span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              wsConnected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {wsConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Selected Incident</span>
          <span className="max-w-[160px] truncate text-slate-700">
            {selectedIncidentId || "-"}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recent Events
        </p>

        <div className="max-h-72 space-y-2 overflow-auto">
          {events.length === 0 ? (
            <div className="text-xs text-slate-400">No events</div>
          ) : (
            events.map((event, index) => (
              <div
                key={`${event.type}-${event.created_at}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-800">
                    {event.type || "unknown"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {event.created_at
                      ? new Date(event.created_at * 1000).toLocaleTimeString("tr-TR")
                      : "-"}
                  </span>
                </div>

                {event.data ? (
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-600">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}