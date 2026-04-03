"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderBar from "@/components/dashboard/HeaderBar";
import StatusCards from "@/components/dashboard/StatusCards";
import IncidentStream from "@/components/dashboard/IncidentStream";
import IncidentDetail from "@/components/dashboard/IncidentDetail";
import OpsPulse from "@/components/dashboard/OpsPulse";
import {
  analyzeIncident,
  fetchIncidents,
  updateIncidentStatus,
  createIncidentNote,
  sendFeedback as sendFeedbackApi,
  assignIncident,
  login,
  register,
  getMe,
} from "@/lib/api";
import { AnalyzeResponse, IncidentItem } from "@/lib/types";
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "@/lib/auth";

type AuthUser = {
  id: number;
  username: string;
  created_at?: number;
};

export default function Home() {
  const [source, setSource] = useState("");
  const [logText, setLogText] = useState("");

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusTab, setStatusTab] = useState("all");

  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notesSubmitting, setNotesSubmitting] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [actualFix, setActualFix] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [assigneeText, setAssigneeText] = useState("");

  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const loadIncidents = async (preferredId?: string) => {
    try {
      const items = await fetchIncidents();
      setIncidents(items);

      if (items.length === 0) {
        setSelectedIncidentId(null);
        return;
      }

      if (preferredId && items.some((i) => i.id === preferredId)) {
        setSelectedIncidentId(preferredId);
        return;
      }

      setSelectedIncidentId((prev) => {
        if (prev && items.some((i) => i.id === prev)) return prev;
        return items[0].id;
      });
    } catch (err) {
      console.error("Incident load error:", err);
    }
  };

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setAuthLoading(false);
      return;
    }

    setToken(stored);

    getMe(stored)
      .then((res) => {
        if (res?.success && res.user) {
          setCurrentUser(res.user);
        } else {
          clearStoredToken();
          setToken(null);
          setCurrentUser(null);
        }
      })
      .catch(() => {
        clearStoredToken();
        setToken(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadIncidents();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      loadIncidents(selectedIncidentId || undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedIncidentId, currentUser]);

  const handleAuth = async () => {
    if (!authUsername.trim() || !authPassword.trim()) return;

    setAuthSubmitting(true);
    setAuthError("");

    try {
      const res =
        authMode === "login"
          ? await login(authUsername, authPassword)
          : await register(authUsername, authPassword);

      if (!res?.success || !res?.token) {
        setAuthError(res?.error || "Kimlik doğrulama başarısız.");
        return;
      }

      setStoredToken(res.token);
      setToken(res.token);

      const me = await getMe(res.token);

      if (me?.success && me.user) {
        setCurrentUser(me.user);
        setAuthUsername("");
        setAuthPassword("");
      } else {
        setAuthError("Kullanıcı bilgisi alınamadı.");
      }
    } catch (e) {
      console.error("Auth error:", e);
      setAuthError("Kimlik doğrulama sırasında hata oluştu.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setCurrentUser(null);
    setIncidents([]);
    setSelectedIncidentId(null);
    setAuthError("");
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!source.trim() || !logText.trim()) return;

    setLoading(true);
    setResult(null);
    setFeedbackSent(false);
    setActualFix("");
    setNoteText("");

    try {
      const res = await analyzeIncident(source, logText, token || undefined);
      setResult(res);

      const preferredId =
        res.incident_id !== undefined && res.incident_id !== null
          ? String(res.incident_id)
          : undefined;

      await loadIncidents(preferredId);

      if (preferredId) {
        setSelectedIncidentId(preferredId);
      }

      setLogText("");
    } catch (e) {
      console.error("Analyze error:", e);
      setResult({
        success: false,
        error: "Analiz sırasında hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedIncident) return;

    try {
      setStatusUpdating(true);
      await updateIncidentStatus(selectedIncident.id, status, token || undefined);
      await loadIncidents(selectedIncident.id);
    } catch (e) {
      console.error("Status update error:", e);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateNote = async () => {
    if (!selectedIncident || !noteText.trim()) return;

    try {
      setNotesSubmitting(true);
      await createIncidentNote(
        selectedIncident.id,
        noteText,
        currentUser?.username || "operator",
        token || undefined
      );
      setNoteText("");
      await loadIncidents(selectedIncident.id);
    } catch (e) {
      console.error("Create note error:", e);
    } finally {
      setNotesSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedIncident || !assigneeText.trim()) return;

    try {
      setAssigning(true);
      await assignIncident(selectedIncident.id, assigneeText, token || undefined);
      setAssigneeText("");
      await loadIncidents(selectedIncident.id);
    } catch (e) {
      console.error("Assign error:", e);
    } finally {
      setAssigning(false);
    }
  };

  const sendFeedback = async (worked: boolean) => {
    if (!selectedIncident) return;

    try {
      await sendFeedbackApi(
        selectedIncident.id,
        worked,
        actualFix,
        token || undefined
      );
      setFeedbackSent(true);
      await loadIncidents(selectedIncident.id);
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const matchSearch =
        !searchText ||
        i.short_title.toLowerCase().includes(searchText.toLowerCase()) ||
        i.source.toLowerCase().includes(searchText.toLowerCase()) ||
        i.component.toLowerCase().includes(searchText.toLowerCase());

      const matchSeverity =
        severityFilter === "all" ||
        i.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchStatus =
        statusTab === "all" ||
        (i.status || "open").toLowerCase() === statusTab.toLowerCase();

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [incidents, searchText, severityFilter, statusTab]);

  const selectedIncident =
    filteredIncidents.find((i) => i.id === selectedIncidentId) ||
    incidents.find((i) => i.id === selectedIncidentId) ||
    filteredIncidents[0] ||
    null;

  const stats = useMemo(() => {
    const active = incidents.length;
    const critical = incidents.filter((i) => i.severity.toLowerCase() === "critical").length;
    const high = incidents.filter((i) => i.severity.toLowerCase() === "high").length;
    const learned = incidents.filter((i) => i.used_learned_fix === true).length;

    const openCount = incidents.filter((i) => (i.status || "open") === "open").length;
    const acknowledgedCount = incidents.filter((i) => i.status === "acknowledged").length;
    const resolvedCount = incidents.filter((i) => i.status === "resolved").length;
    const ignoredCount = incidents.filter((i) => i.status === "ignored").length;

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
      openCount,
      acknowledgedCount,
      resolvedCount,
      ignoredCount,
      topSources,
      topComponents,
    };
  }, [incidents]);

  const formatTime = (t: number) => new Date(t).toLocaleString("tr-TR");

  const formatRelative = (t: number) => {
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "az önce";
    if (m < 60) return `${m} dk`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa`;
    return `${Math.floor(h / 24)} gün`;
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-600 shadow-sm">
          Oturum yükleniyor...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="mb-3 inline-flex rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-700">
            PanopLog Auth
          </p>

          <h1 className="text-3xl font-semibold text-slate-900">
            {authMode === "login" ? "Giriş yap" : "Kayıt ol"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Incident platformuna erişmek için oturum aç.
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="Kullanıcı adı"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-400"
            />

            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-400"
            />

            {authError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {authError}
              </div>
            ) : null}

            <button
              onClick={handleAuth}
              disabled={authSubmitting}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {authSubmitting
                ? "İşleniyor..."
                : authMode === "login"
                ? "Giriş yap"
                : "Kayıt ol"}
            </button>

            <button
              onClick={() =>
                setAuthMode((prev) => (prev === "login" ? "register" : "login"))
              }
              className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm text-slate-700"
            >
              {authMode === "login"
                ? "Hesabın yok mu? Kayıt ol"
                : "Zaten hesabın var mı? Giriş yap"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3">
          <div className="text-sm text-slate-600">
            Oturum: <span className="font-medium text-slate-900">{currentUser.username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Çıkış yap
          </button>
        </div>

        <HeaderBar
          searchText={searchText}
          setSearchText={setSearchText}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          statusTab={statusTab}
          setStatusTab={setStatusTab}
        />

        <div className="mt-6">
          <StatusCards
            active={stats.active}
            critical={stats.critical}
            high={stats.high}
            learned={stats.learned}
            openCount={stats.openCount}
            acknowledgedCount={stats.acknowledgedCount}
            resolvedCount={stats.resolvedCount}
            ignoredCount={stats.ignoredCount}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)_300px]">
          <aside className="space-y-4">
            <div className="rounded-[30px] border border-slate-200 bg-white/75 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
              <div className="mb-5">
                <p className="mb-2 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-700">
                  New Analysis
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Yeni analiz
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Kaynak ve log gir, analiz çalışsın, incident otomatik açılsın.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Kaynak sistem / servis adı"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500/40"
                />

                <div className="rounded-2xl border border-slate-300 bg-white p-3">
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
                    className="w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                </div>

                <textarea
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="Log buraya yapıştır..."
                  className="h-48 w-full rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500/40"
                />

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full rounded-2xl bg-[linear-gradient(90deg,#dbeafe,#ffffff)] px-6 py-3 font-semibold text-slate-950 shadow-[0_12px_30px_rgba(59,130,246,0.10)] transition hover:opacity-95 disabled:opacity-60"
                >
                  {loading ? "Analiz ediliyor..." : "Analiz Et"}
                </button>
              </div>
            </div>

            <IncidentStream
              incidents={filteredIncidents}
              selectedId={selectedIncident?.id || selectedIncidentId}
              onSelect={(id) => {
                setSelectedIncidentId(id);
                setFeedbackSent(false);
                setActualFix("");
                setNoteText("");
                setAssigneeText("");
              }}
              formatRelative={formatRelative}
            />
          </aside>

          <IncidentDetail
            incident={selectedIncident}
            actualFix={actualFix}
            setActualFix={setActualFix}
            feedbackSent={feedbackSent}
            sendFeedback={sendFeedback}
            formatTime={formatTime}
            onStatusChange={handleStatusChange}
            statusUpdating={statusUpdating}
            noteText={noteText}
            setNoteText={setNoteText}
            notesSubmitting={notesSubmitting}
            onCreateNote={handleCreateNote}
            assigneeText={assigneeText}
            setAssigneeText={setAssigneeText}
            assigning={assigning}
            onAssign={handleAssign}
          />

          <OpsPulse
            incident={selectedIncident}
            topSources={stats.topSources}
            topComponents={stats.topComponents}
          />
        </div>

        {result && !result.success ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {result.error}
          </div>
        ) : null}
      </div>
    </main>
  );
}