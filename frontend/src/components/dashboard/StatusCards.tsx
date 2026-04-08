"use client";

type Props = {
  active: number;
  critical: number;
  high: number;
  learned: number;
  openCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  ignoredCount: number;
};

type CardProps = {
  label: string;
  value: number;
  tone: "slate" | "red" | "orange" | "emerald" | "blue";
  sublabel?: string;
};

function toneClass(tone: CardProps["tone"]) {
  switch (tone) {
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    case "orange":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function MetricCard({ label, value, tone, sublabel }: CardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition ${toneClass(tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">
            {label}
          </p>
          <div className="mt-2 text-3xl font-semibold leading-none">{value}</div>
          {sublabel ? (
            <p className="mt-2 text-xs opacity-75">{sublabel}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function StatusCards({
  active,
  critical,
  high,
  learned,
  openCount,
  acknowledgedCount,
  resolvedCount,
  ignoredCount,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Active Incidents"
        value={active}
        tone="slate"
        sublabel={`Open: ${openCount} • Ack: ${acknowledgedCount}`}
      />

      <MetricCard
        label="Critical"
        value={critical}
        tone="red"
        sublabel="Immediate attention required"
      />

      <MetricCard
        label="High Severity"
        value={high}
        tone="orange"
        sublabel={`Resolved: ${resolvedCount} • Ignored: ${ignoredCount}`}
      />

      <MetricCard
        label="Learned Fix"
        value={learned}
        tone="emerald"
        sublabel="Past fixes reused automatically"
      />
    </section>
  );
}