import {
  AnalyzeResponse,
  IncidentItem,
  IncidentsApiResponse,
  AuthResponse,
} from "@/lib/types";

/**
 * ⚠️ GEÇİCİ HARD-CODE (debug için)
 * İstersen sonra tekrar env'e döneriz
 */
const API_BASE =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://panoplog-production.up.railway.app"
    : "http://127.0.0.1:8001";

/**
 * Incident mapper
 */
export const mapIncident = (item: any, index: number): IncidentItem => ({
  id: String(item.db_id ?? item.id ?? `${item.created_at}-${index}`),
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
  status: item.status || "open",
  notes: item.notes || [],
  events: item.events || [],
  worked: item.worked ?? null,
  actual_fix: item.actual_fix || "",
  occurrence_count: item.occurrence_count || 1,
  last_seen_at: item.last_seen_at || item.created_at || 0,
  assignee: item.assignee || "",
  source_policy: item.source_policy || {},
  similarity_group: item.similarity_group || "",
  similarity_score: item.similarity_score || 0,
  used_learned_fix:
    item.used_learned_fix === true || item.used_learned_fix === 1,
});

/**
 * Headers builder
 */
function buildHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Generic fetch wrapper (debug için önemli)
 */
async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    console.error("❌ FETCH ERROR:", url, err);
    throw new Error("Backend bağlantısı yok (Failed to fetch)");
  }
}

/**
 * INCIDENTS
 */
export async function fetchIncidents(): Promise<IncidentItem[]> {
  const response = await safeFetch(`${API_BASE}/incidents`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Incident listesi alınamadı.");
  }

  const data: IncidentsApiResponse = await response.json();

  if (!data.success || !Array.isArray(data.items)) {
    throw new Error(data.error || "Incident listesi alınamadı.");
  }

  return data.items.map(mapIncident);
}

/**
 * ANALYZE
 */
export async function analyzeIncident(
  source: string,
  logText: string,
  token?: string
): Promise<AnalyzeResponse> {
  const response = await safeFetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({
      source,
      log_text: logText,
    }),
  });

  if (!response.ok) {
    throw new Error("Analiz isteği başarısız oldu.");
  }

  return response.json();
}

/**
 * STATUS
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  token?: string
) {
  const response = await safeFetch(
    `${API_BASE}/incidents/${incidentId}/status`,
    {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    throw new Error("Status güncellenemedi.");
  }

  return response.json();
}

/**
 * NOTES
 */
export async function createIncidentNote(
  incidentId: string,
  note: string,
  author = "operator",
  token?: string
) {
  const response = await safeFetch(
    `${API_BASE}/incidents/${incidentId}/notes`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({
        note,
        author,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Incident note oluşturulamadı.");
  }

  return response.json();
}

/**
 * FEEDBACK
 */
export async function sendFeedback(
  incidentId: string,
  worked: boolean,
  actualFix: string,
  token?: string
) {
  const response = await safeFetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({
      incident_id: Number(incidentId),
      worked,
      actual_fix: actualFix,
    }),
  });

  if (!response.ok) {
    throw new Error("Feedback kaydedilemedi.");
  }

  return response.json();
}

/**
 * ASSIGN
 */
export async function assignIncident(
  incidentId: string,
  assignee: string,
  token?: string
) {
  const response = await safeFetch(
    `${API_BASE}/incidents/${incidentId}/assign`,
    {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({ assignee }),
    }
  );

  if (!response.ok) {
    throw new Error("Atama yapılamadı.");
  }

  return response.json();
}

/**
 * AUTH
 */
export async function register(
  username: string,
  password: string
): Promise<AuthResponse> {
  const response = await safeFetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Register başarısız.");
  }

  return response.json();
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const response = await safeFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Login başarısız.");
  }

  return response.json();
}

export async function getMe(token: string): Promise<AuthResponse> {
  const response = await safeFetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Kullanıcı bilgisi alınamadı.");
  }

  return response.json();
}