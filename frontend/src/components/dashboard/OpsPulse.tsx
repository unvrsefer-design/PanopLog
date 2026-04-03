import { IncidentItem } from "@/lib/types";

type Props = {
  incident: IncidentItem | null;
  topSources: [string, number][];
  topComponents: [string, number][];
};

export default function OpsPulse({ incident, topSources, topComponents }: Props) {
  return (
    <aside className="space-y-4">
      <div className="rounded-[30px] border border-slate-200 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-md">
        <div className="mb-5">
          <p className="mb-2 inline-flex rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-700">
            Ops Pulse
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Live operational signals
          </h2>
        </div>

        <div className="space-y-5">
          <Section title="Top sources">
            {topSources.length ? (
              topSources.map(([name, count]) => (
                <Row key={name} label={name} value={String(count)} />
              ))
            ) : (
              <EmptyText />
            )}
          </Section>

          <Section title="Top components">
            {topComponents.length ? (
              topComponents.map(([name, count]) => (
                <Row key={name} label={name} value={String(count)} />
              ))
            ) : (
              <EmptyText />
            )}
          </Section>

          {incident ? (
            <>
              <Section title="Current incident">
                <Row
                  label="Occurrences"
                  value={String(incident.occurrence_count || 1)}
                />
                <Row
                  label="Assignee"
                  value={incident.assignee || "-"}
                />
                <Row
                  label="Similarity"
                  value={
                    incident.similarity_score
                      ? `${(incident.similarity_score * 100).toFixed(0)}%`
                      : "-"
                  }
                  valueClass={
                    incident.similarity_score && incident.similarity_score < 1
                      ? "text-violet-600"
                      : "text-slate-700"
                  }
                />
              </Section>

              {incident.source_policy ? (
                <Section title="Routing policy">
                  <Row
                    label="Environment"
                    value={incident.source_policy.environment || "-"}
                    valueClass={envClass(incident.source_policy.environment)}
                  />
                  <Row
                    label="Route target"
                    value={incident.source_policy.route_target || "-"}
                  />
                  <Row
                    label="Escalation"
                    value={incident.source_policy.escalation || "-"}
                  />
                  <Row
                    label="Alerts"
                    value={incident.source_policy.alerts_enabled ? "enabled" : "disabled"}
                    valueClass={
                      incident.source_policy.alerts_enabled
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }
                  />
                  <Row
                    label="Route severities"
                    value={
                      incident.source_policy.route_severities?.length
                        ? incident.source_policy.route_severities.join(", ")
                        : "-"
                    }
                  />
                </Section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "text-slate-700",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`max-w-[55%] truncate text-right font-medium ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyText() {
  return <p className="text-sm text-slate-500">Henüz veri yok</p>;
}

function envClass(environment?: string) {
  switch ((environment || "").toLowerCase()) {
    case "prod":
      return "text-red-600";
    case "dev":
      return "text-blue-600";
    case "test":
      return "text-amber-600";
    default:
      return "text-slate-700";
  }
}