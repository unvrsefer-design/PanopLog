"use client";

import { FormEvent, KeyboardEvent } from "react";
import { IncidentItem } from "@/lib/types";

type Props = {
  incident: IncidentItem | null;
  actualFix: string;
  setActualFix: (v: string) => void;
  feedbackSent: boolean;
  sendFeedback: (worked: boolean) => void;
  formatTime: (ts: number) => string;
  onStatusChange: (status: string) => void;
  statusUpdating: boolean;
  noteText: string;
  setNoteText: (v: string) => void;
  notesSubmitting: boolean;
  onCreateNote: () => void;
  assigneeText: string;
  setAssigneeText: (v: string) => void;
  assigning: boolean;
  onAssign: () => void;
};

function statusClass(status?: string) {
  switch ((status || "open").toLowerCase()) {
    case "acknowledged":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "resolved":
      return "border-green-200 bg-green-50 text-green-700";
    case "ignored":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export default function IncidentDetail({
  incident,
  actualFix,
  setActualFix,
  feedbackSent,
  sendFeedback,
  formatTime,
  onStatusChange,
  statusUpdating,
  noteText,
  setNoteText,
  notesSubmitting,
  onCreateNote,
  assigneeText,
  setAssigneeText,
  assigning,
  onAssign,
}: Props) {
  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onAssign();
  };

  const handleNoteKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onCreateNote();
    }
  };

  if (!incident) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
        Sol taraftan bir incident seç.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {Boolean(incident.used_learned_fix) && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            Learned fix kullanıldı
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Bu incident için geçmişte işe yarayan çözüm otomatik uygulandı.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{incident.short_title}</h2>

            <p className="mt-2 text-sm text-slate-500">
              {incident.source} · {incident.component} ·{" "}
              {formatTime(incident.createdAt)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-lg border px-3 py-1 text-sm font-medium ${statusClass(
                  incident.status
                )}`}
              >
                {incident.status || "open"}
              </span>

              {incident.assignee ? (
                <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700">
                  @{incident.assignee}
                </span>
              ) : null}

              {incident.occurrence_count && incident.occurrence_count > 1 ? (
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">
                  x{incident.occurrence_count}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["open", "acknowledged", "resolved", "ignored"].map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                disabled={statusUpdating}
                className={`rounded-lg px-3 py-1 text-sm ${
                  incident.status === status
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Summary" value={incident.summary} />
        <Card title="First action" value={incident.first_action} />
        <Card title="Verification" value={incident.verification_step} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Possible cause" value={incident.possible_cause} />
        <Card title="Likely fix" value={incident.likely_fix} multiline />
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="mb-2 text-sm font-semibold text-red-600">Risk</p>
        <p>{incident.risk_note}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Assignment</h3>

        {incident.assignee ? (
          <p className="mb-3 text-sm text-slate-600">
            Atanan:{" "}
            <span className="font-medium text-slate-900">
              {incident.assignee}
            </span>
          </p>
        ) : (
          <p className="mb-3 text-sm text-slate-500">Atama yok</p>
        )}

        <form className="flex gap-2" onSubmit={handleAssignSubmit}>
          <input
            value={assigneeText}
            onChange={(e) => setAssigneeText(e.target.value)}
            className="w-full rounded-xl border p-3"
            placeholder="Kime atanacak?"
          />

          <button
            type="submit"
            disabled={assigning}
            className="rounded bg-black px-4 py-2 text-white"
          >
            {assigning ? "..." : "Ata"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Feedback</h3>

        <textarea
          value={actualFix}
          onChange={(e) => setActualFix(e.target.value)}
          className="w-full rounded-xl border p-3"
          placeholder="Gerçek çözüm"
        />

        {!feedbackSent ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => sendFeedback(true)}
              className="rounded bg-green-500 px-4 py-2 text-white"
            >
              ✔ İşe yaradı
            </button>

            <button
              onClick={() => sendFeedback(false)}
              className="rounded bg-red-500 px-4 py-2 text-white"
            >
              ✖ İşe yaramadı
            </button>
          </div>
        ) : (
          <p className="mt-2 text-green-500">Kaydedildi</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Notes</h3>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleNoteKeyDown}
          className="w-full rounded-xl border p-3"
          placeholder="Not ekle (Enter: gönder, Shift+Enter: yeni satır)"
        />

        <button
          onClick={onCreateNote}
          disabled={notesSubmitting}
          className="mt-2 rounded bg-black px-4 py-2 text-white"
        >
          {notesSubmitting ? "..." : "Ekle"}
        </button>

        <div className="mt-4 space-y-3">
          {incident.notes?.length ? (
            incident.notes.map((n) => (
              <div key={n.id} className="rounded bg-gray-50 p-3">
                <div className="text-xs text-gray-500">
                  {n.author} ·{" "}
                  {new Date(n.created_at * 1000).toLocaleString("tr-TR")}
                </div>
                <div>{n.note}</div>
              </div>
            ))
          ) : (
            <p className="text-slate-500">Not yok</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Activity</h3>

        {incident.events?.length ? (
          <div className="space-y-3">
            {incident.events.map((e, i) => {
              const actor =
                e.data?.actor ||
                e.data?.author ||
                e.data?.assignee ||
                null;

              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">
                    {new Date(e.created_at * 1000).toLocaleString("tr-TR")}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{e.type}</span>
                    {actor ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                        {String(actor)}
                      </span>
                    ) : null}
                  </div>

                  {Object.keys(e.data || {}).length > 0 ? (
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      {Object.entries(e.data).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span>{" "}
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500">Event yok</p>
        )}
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  multiline = false,
}: {
  title: string;
  value?: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm text-slate-500">{title}</p>
      <p className={multiline ? "whitespace-pre-wrap break-words" : ""}>
        {value || "-"}
      </p>
    </div>
  );
}