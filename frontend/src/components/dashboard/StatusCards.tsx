"use client";

type StatusCardsProps = {
  active: number;
  critical: number;
  high: number;
  learned: number;
  openCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  ignoredCount: number;
};

export default function StatusCards({
  active,
  critical,
  high,
  learned,
  openCount,
  acknowledgedCount,
  resolvedCount,
  ignoredCount,
}: StatusCardsProps) {
  const cards = [
    {
      title: "Active incidents",
      value: active,
      tone: "text-slate-900 bg-white border-slate-200",
    },
    {
      title: "Critical",
      value: critical,
      tone: "text-red-700 bg-red-50 border-red-200",
    },
    {
      title: "High",
      value: high,
      tone: "text-orange-700 bg-orange-50 border-orange-200",
    },
    {
      title: "Learned fixes",
      value: learned,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Open",
      value: openCount,
      tone: "text-rose-700 bg-rose-50 border-rose-200",
    },
    {
      title: "Acknowledged",
      value: acknowledgedCount,
      tone: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      title: "Resolved",
      value: resolvedCount,
      tone: "text-green-700 bg-green-50 border-green-200",
    },
    {
      title: "Ignored",
      value: ignoredCount,
      tone: "text-slate-600 bg-slate-100 border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-3xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${card.tone}`}
        >
          <p className="text-sm opacity-80">{card.title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}