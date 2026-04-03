"use client";

import { useEffect, useMemo, useState } from "react";

type SimilarIncident = {
  source: string;
  short_title: string;
  severity: string;
  component: string;
  summary: string;
  likely_fix: string;
  worked?: boolean;
  actual_fix?: string;
  timestamp: number;
};

type LearnedFix = {
  source: string;
  short_title: string;
  component: string;
  actual_fix: string;
  timestamp: number;
};

type SourcePolicy = {
  alerts_enabled: boolean;
  route_severities: string[];
  environment: string;
};

type AnalyzeResponse = {
  success: boolean;
  error?: string;
  source?: string;
  source_policy?: SourcePolicy;
  short_title?: string;
  severity?: string;
  component?: string;
  summary?: string;
  possible_cause?: string;
  highlighted_lines?: string[];
  context_blocks?: string[][];
  first_action?: string;
  likely_fix?: string;
  verification_step?: string;
  risk_note?: string;
  runbook_steps?: string[];
  similar_incidents?: SimilarIncident[];
  learned_fixes?: LearnedFix[];
  used_learned_fix?: boolean;
  ingested_via?: string;
};

type IncidentItem = {
  id: string;
  createdAt: number;
  source: string;
  short_title: string;
  severity: string;
  component: string;
  summary: string;
  first_action?: string;
  likely_fix?: string;
  verification_step?: string;
  risk_note?: string;
  possible_cause?: string;
  highlighted_lines?: string[];
  context_blocks?: string[][];
  runbook_steps?: string[];
  similar_incidents?: SimilarIncident[];
  learned_fixes?: LearnedFix[];
  used_learned_fix?: boolean;
  ingested_via?: string;
  source_policy?: SourcePolicy;
};

export default function Home() {
  const [source, setSource] = useState("");
  const [logText, setLogText] = useState("");
  const [actualFix, setActualFix] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const loadIncidents = async () => {
    try {
      console.log("loadIncidents başladı");

      const response = await fetch("http://127.0.0.1:8001/incidents");
      console.log("incidents status:", response.status);

      const data = await response.json();
      console.log("incidents data:", data);

      if (data.success && Array.isArray(data.items)) {
        const mapped: IncidentItem[] = data.items.map((item: any, index: number) => ({
          id: String(item.db_id ?? `${item.created_at}-${index}`),
          createdAt: (item.created_at || 0) * 1000,
          source: item.source || "unknown-source",
          short_title: item.short_title || "Unknown Incident",
          severity: item.severity || "medium",
          component: item.component || "unknown",
          summary: item.summary || "",
          first_action: item.first_action || "",
          likely_fix: item.likely_fix || "",
          verification_step: item.verification_step || "",
          risk_note: item.risk_note || "",
          possible_cause: item.possible_cause || "",
          highlighted_lines: item.highlighted_lines || [],
          context_blocks: item.context_blocks || [],
          runbook_steps: item.runbook_steps || [],
          similar_incidents: item.similar_incidents || [],
          learned_fixes: item.learned_fixes || [],
          used_learned_fix: item.used_learned_fix || false,
          ingested_via: item.ingested_via || "ui",
          source_policy: item.source_policy || {
            alerts_enabled: true,
            route_severities: [],
            environment: "default",
          },
        }));

        setIncidents(mapped);

        if (mapped.length > 0) {
          setSelectedIncidentId((prev) => prev ?? mapped[0].id);
        }
      }
    } catch (error) {
      console.error("Incident load error:", error);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    setFeedbackSent(false);
    setActualFix("");

    try {
      const response = await fetch("http://127.0.0.1:8001/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          log_text: logText,
        }),
      });

      const data: AnalyzeResponse = await response.json();
      console.log("analyze data:", data);

      setResult(data);

      if (data.success) {
        await loadIncidents();
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setResult({
        success: false,
        error: "Backend'e bağlanırken hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedIncident =
    incidents.find((item) => item.id === selectedIncidentId) || null;

  const sendFeedback = async (worked: boolean) => {
    if (!selectedIncident) return;

    try {
      await fetch("http://127.0.0.1:8001/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          short_title: selectedIncident.short_title,
          component: selectedIncident.component,
          worked,
          actual_fix: actualFix,
        }),
      });

      setFeedbackSent(true);
      await loadIncidents();
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const severityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-400 border-red-500/40 bg-red-950/30";
      case "high":
        return "text-orange-400 border-orange-500/40 bg-orange-950/30";
      case "medium":
        return "text-yellow-300 border-yellow-500/40 bg-yellow-950/30";
      case "low":
        return "text-green-400 border-green-500/40 bg-green-950/30";
      default:
        return "text-gray-300 border-gray-700 bg-gray-900";
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("tr-TR");
  };

  const formatRelative = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "az önce";
    if (diffMin < 60) return `${diffMin} dk önce`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} sa önce`;

    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} gün önce`;
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        !searchText ||
        incident.short_title.toLowerCase().includes(searchText.toLowerCase()) ||
        incident.source.toLowerCase().includes(searchText.toLowerCase()) ||
        incident.component.toLowerCase().includes(searchText.toLowerCase());

      const matchesSeverity =
        severityFilter === "all" || incident.severity.toLowerCase() === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [incidents, searchText, severityFilter]);

  const stats = useMemo(() => {
    const active = incidents.length;
    const critical = incidents.filter((i) => i.severity.toLowerCase() === "critical").length;
    const high = incidents.filter((i) => i.severity.toLowerCase() === "high").length;
    const learned = incidents.filter((i) => i.used_learned_fix).length;

    const sourceCount: Record<string, number> = {};
    const componentCount: Record<string, number> = {};

    for (const incident of incidents) {
      sourceCount[incident.source] = (sourceCount[incident.source] || 0) + 1;
      componentCount[incident.component] = (componentCount[incident.component] || 0) + 1;
    }

    const topSources = Object.entries(sourceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topComponents = Object.entries(componentCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      active,
      critical,
      high,
      learned,
      topSources,
      topComponents,
    };
  }, [incidents]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-950 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">PanopLog</h1>
            <p className="mt-2 text-gray-400">See everything. Miss nothing.</p>
          </div>

          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Incident ara: source, title, component"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 outline-none"
            />

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 outline-none"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-sm text-gray-400">Active incidents</p>
            <p className="mt-2 text-3xl font-bold">{stats.active}</p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
            <p className="text-sm text-red-300">Critical</p>
            <p className="mt-2 text-3xl font-bold text-red-400">{stats.critical}</p>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-950/20 p-4">
            <p className="text-sm text-orange-300">High</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">{stats.high}</p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4">
            <p className="text-sm text-blue-300">Learned fix used</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">{stats.learned}</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4">
          <p className="mb-2 text-sm text-blue-300">Monitoring API hazır</p>
          <p className="text-sm text-gray-300">
            Dış sistemler artık <span className="font-semibold">/ingest</span> endpoint’ine log gönderebilir.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <h2 className="mb-4 text-lg font-semibold">Yeni analiz</h2>

              <div className="space-y-4">
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Kaynak sistem / servis adı"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 p-4 outline-none"
                />

                <input
                  type="file"
                  accept=".log,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      setLogText(text);
                    };
                    reader.readAsText(file);
                  }}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3"
                />

                <textarea
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="Log buraya yapıştır..."
                  className="h-48 w-full rounded-xl border border-gray-700 bg-gray-900 p-4 outline-none"
                />

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-60"
                >
                  {loading ? "Analiz ediliyor..." : "Analiz Et"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Incident stream</h2>
                <span className="text-sm text-gray-400">{filteredIncidents.length}</span>
              </div>

              <div className="max-h-[900px] space-y-3 overflow-auto pr-1">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => {
                    const selected = selectedIncident?.id === incident.id;

                    return (
                      <button
                        key={incident.id}
                        onClick={() => {
                          setSelectedIncidentId(incident.id);
                          setFeedbackSent(false);
                          setActualFix("");
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-500/40 bg-blue-950/20"
                            : "border-gray-800 bg-gray-900 hover:border-gray-700"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-semibold uppercase ${severityColor(
                              incident.severity
                            )}`}
                          >
                            {incident.severity}
                          </span>

                          <span className="text-xs text-gray-500">
                            {formatRelative(incident.createdAt)}
                          </span>
                        </div>

                        <p className="font-semibold">{incident.short_title}</p>
                        <p className="mt-1 text-sm text-gray-400">{incident.source}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-300">{incident.summary}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-black/30 px-2 py-1 text-xs text-gray-400">
                            {incident.component}
                          </span>

                          {incident.used_learned_fix ? (
                            <span className="rounded-full bg-blue-950/40 px-2 py-1 text-xs text-blue-300">
                              learned fix used
                            </span>
                          ) : null}

                          <span className="rounded-full bg-black/30 px-2 py-1 text-xs text-gray-400">
                            {incident.ingested_via}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
                    Henüz incident yok.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-6">
            {!selectedIncident ? (
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8 text-gray-400">
                Sol taraftan bir incident seç veya yeni analiz çalıştır.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="mb-2 text-sm text-gray-400">Incident title</p>
                      <h2 className="text-3xl font-bold">{selectedIncident.short_title}</h2>
                      <p className="mt-3 text-sm text-gray-400">
                        {selectedIncident.source} · {selectedIncident.component} · {formatTime(selectedIncident.createdAt)}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold uppercase tracking-wide ${severityColor(
                        selectedIncident.severity
                      )}`}
                    >
                      {selectedIncident.severity}
                    </div>
                  </div>

                  {selectedIncident.used_learned_fix ? (
                    <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
                      <p className="mb-2 text-sm text-blue-300">Öğrenilmiş çözüm kullanıldı</p>
                      <p className="text-gray-200">
                        Bu analiz, geçmişte işe yaradığı doğrulanmış çözüm notlarıyla güçlendirildi.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <p className="mb-2 text-sm text-gray-400">Summary</p>
                    <p>{selectedIncident.summary}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <p className="mb-2 text-sm text-gray-400">First action</p>
                    <p>{selectedIncident.first_action}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <p className="mb-2 text-sm text-gray-400">Verification</p>
                    <p>{selectedIncident.verification_step}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <p className="mb-2 text-sm text-gray-400">Possible cause</p>
                    <p>{selectedIncident.possible_cause}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <p className="mb-2 text-sm text-gray-400">Likely fix</p>
                    <p>{selectedIncident.likely_fix}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
                  <p className="mb-2 text-sm text-red-300">Risk note</p>
                  <p className="text-gray-200">{selectedIncident.risk_note}</p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <h3 className="mb-4 text-xl font-semibold">Runbook</h3>
                  <div className="space-y-3">
                    {selectedIncident.runbook_steps && selectedIncident.runbook_steps.length > 0 ? (
                      selectedIncident.runbook_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-gray-800 bg-black/20 p-4"
                        >
                          <p className="mb-1 text-sm text-gray-400">Adım {idx + 1}</p>
                          <p>{step}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">Runbook adımı üretilmedi.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 space-y-4">
                  <h3 className="text-xl font-semibold">Geri bildirim</h3>

                  <textarea
                    value={actualFix}
                    onChange={(e) => setActualFix(e.target.value)}
                    placeholder="Gerçek çözümü yaz"
                    className="w-full rounded-xl border border-gray-700 bg-gray-900 p-3 outline-none"
                  />

                  {!feedbackSent ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => sendFeedback(true)}
                        className="rounded-lg bg-green-500 px-4 py-2 text-black"
                      >
                        ✔ İşe yaradı
                      </button>

                      <button
                        onClick={() => sendFeedback(false)}
                        className="rounded-lg bg-red-500 px-4 py-2 text-black"
                      >
                        ✖ İşe yaramadı
                      </button>
                    </div>
                  ) : (
                    <p className="text-green-400">Feedback kaydedildi 👍</p>
                  )}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <h3 className="mb-4 text-xl font-semibold">Highlighted logs</h3>
                    <div className="space-y-3">
                      {selectedIncident.highlighted_lines?.length ? (
                        selectedIncident.highlighted_lines.map((line, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-red-300 break-words"
                          >
                            {line}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400">Öne çıkan satır yok.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <h3 className="mb-4 text-xl font-semibold">Context</h3>
                    <div className="space-y-4">
                      {selectedIncident.context_blocks?.length ? (
                        selectedIncident.context_blocks.map((block, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm space-y-1"
                          >
                            {block.map((line, i) => (
                              <div key={i} className="break-words text-gray-300">
                                {line}
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400">Context yok.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <h3 className="mb-4 text-xl font-semibold">Öğrenilmiş gerçek çözümler</h3>
                    <div className="space-y-4">
                      {selectedIncident.learned_fixes?.length ? (
                        selectedIncident.learned_fixes.map((fix, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4"
                          >
                            <p className="mb-2 text-sm text-blue-300">
                              {fix.source} · {fix.component}
                            </p>
                            <p className="text-gray-200">{fix.actual_fix}</p>
                            <p className="mt-2 text-xs text-gray-400">
                              {new Date(fix.timestamp * 1000).toLocaleString("tr-TR")}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400">Henüz öğrenilmiş çözüm yok.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                    <h3 className="mb-4 text-xl font-semibold">Benzer geçmiş olaylar</h3>
                    <div className="space-y-4">
                      {selectedIncident.similar_incidents?.length ? (
                        selectedIncident.similar_incidents.map((incident, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold">{incident.short_title}</p>
                              <span
                                className={`rounded-lg border px-3 py-1 text-xs uppercase ${severityColor(
                                  incident.severity
                                )}`}
                              >
                                {incident.severity}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-400">
                              {incident.source} · {incident.component}
                            </p>

                            <p className="mt-2 text-sm text-gray-300">{incident.summary}</p>

                            {incident.actual_fix ? (
                              <div className="mt-3 rounded-lg bg-black/30 p-3">
                                <p className="mb-1 text-xs text-gray-400">Gerçek çözüm notu</p>
                                <p className="text-sm">{incident.actual_fix}</p>
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400">Benzer olay yok.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                  <h3 className="mb-4 text-xl font-semibold">Timeline</h3>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {incidents.slice(0, 9).map((incident) => (
                      <button
                        key={incident.id}
                        onClick={() => setSelectedIncidentId(incident.id)}
                        className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-left hover:border-gray-700"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`rounded-lg border px-3 py-1 text-xs uppercase ${severityColor(
                              incident.severity
                            )}`}
                          >
                            {incident.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatRelative(incident.createdAt)}
                          </span>
                        </div>

                        <p className="font-semibold">{incident.short_title}</p>
                        <p className="mt-1 text-sm text-gray-400">{incident.source}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-300">{incident.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <h2 className="mb-4 text-lg font-semibold">Ops pulse</h2>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-gray-400">Top sources</p>
                  <div className="space-y-2">
                    {stats.topSources.length ? (
                      stats.topSources.map(([name, count]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-xl bg-gray-900 px-3 py-2"
                        >
                          <span className="text-sm">{name}</span>
                          <span className="text-sm text-gray-400">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Henüz veri yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-gray-400">Top components</p>
                  <div className="space-y-2">
                    {stats.topComponents.length ? (
                      stats.topComponents.map(([name, count]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-xl bg-gray-900 px-3 py-2"
                        >
                          <span className="text-sm">{name}</span>
                          <span className="text-sm text-gray-400">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Henüz veri yok</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-gray-400">Delivery</p>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-gray-900 px-3 py-2 text-sm">
                      Discord <span className="float-right text-green-400">Healthy</span>
                    </div>
                    <div className="rounded-xl bg-gray-900 px-3 py-2 text-sm">
                      Google Chat <span className="float-right text-green-400">Healthy</span>
                    </div>
                  </div>
                </div>

                {selectedIncident?.source_policy ? (
                  <div>
                    <p className="mb-2 text-sm text-gray-400">Source policy</p>
                    <div className="rounded-xl bg-gray-900 p-3 text-sm space-y-2">
                      <div>
                        Environment:
                        <span className="ml-2 text-gray-300">
                          {selectedIncident.source_policy.environment}
                        </span>
                      </div>
                      <div>
                        Alerts:
                        <span className="ml-2 text-gray-300">
                          {selectedIncident.source_policy.alerts_enabled ? "enabled" : "disabled"}
                        </span>
                      </div>
                      <div>
                        Route severities:
                        <span className="ml-2 text-gray-300">
                          {selectedIncident.source_policy.route_severities?.join(", ") || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        {result && !result.success ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-red-300">
            {result.error}
          </div>
        ) : null}
      </div>
    </main>
  );
}