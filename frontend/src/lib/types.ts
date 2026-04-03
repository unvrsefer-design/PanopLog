export type IncidentNote = {
  id: number;
  incident_id: number;
  note: string;
  author: string;
  created_at: number;
};

export type IncidentEvent = {
  id: number;
  incident_id: number;
  type: string;
  data: Record<string, any>;
  created_at: number;
};

export type SourcePolicy = {
  environment?: string;
  alerts_enabled?: boolean;
  route_severities?: string[];
  route_target?: string;
  escalation?: string;
};

export type AnalyzeResponse = {
  success: boolean;
  error?: string;
  incident_id?: number;
  deduped?: boolean;
  actor?: string;
};

export type IncidentItem = {
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
  status?: string;
  notes?: IncidentNote[];
  events?: IncidentEvent[];
  worked?: boolean | null;
  actual_fix?: string;
  occurrence_count?: number;
  last_seen_at?: number;
  assignee?: string;
  source_policy?: SourcePolicy;
  similarity_group?: string;
  similarity_score?: number;
  used_learned_fix?: boolean;
};

export type IncidentsApiResponse = {
  success: boolean;
  items?: any[];
  error?: string;
};

export type AuthUser = {
  id: number;
  username: string;
  created_at?: number;
};

export type AuthResponse = {
  success: boolean;
  error?: string;
  token?: string;
  user?: AuthUser;
};