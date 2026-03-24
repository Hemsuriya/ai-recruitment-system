const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

// ── HR Candidates ────────────────────────────────────────────

export interface ApiCandidateListItem {
  id: number;
  video_assessment_id: string;
  name: string;
  email: string;
  phone: string;
  jid: string | null;
  job_title: string | null;
  score: number;
  date: string;
  interview_score: number | null;
  security_score: number | null;
  recommendation: string | null;
  security_details: Record<string, unknown>;
  attention_metrics: Record<string, unknown>;
  emotion_analysis: Record<string, unknown>;
  face_detection: Record<string, unknown>;
  violations_summary: Record<string, unknown>;
  security_violations_count: number;
  security_severity: string;
  decision_comment: string | null;
}

export interface ApiCandidateDetail {
  id: number;
  video_assessment_id: string;
  name: string;
  email: string;
  phone: string;
  jid: string | null;
  location: string | null;
  job_title: string | null;
  status: string | null;
  interview_started: boolean;
  interview_completed: boolean;
  videos_uploaded: boolean;
  proctoring_flags: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  interview_score: number | null;
  security_score: number | null;
  final_score: number | null;
  question_scores: Record<string, unknown> | null;
  security_violations_count: number | null;
  security_severity: string | null;
  security_details: Record<string, unknown> | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  overall_feedback: string | null;
  recommendation: string | null;
  evaluated_by: string | null;
  evaluated_at: string | null;
  final_decision: string | null;
  decision_by: string | null;
  decision_at: string | null;
  decision_comment: string | null;
  emotion_analysis: Record<string, unknown> | null;
  attention_metrics: Record<string, unknown> | null;
  face_detection: Record<string, unknown> | null;
  violations_summary: Record<string, unknown> | null;
  full_report: Record<string, unknown> | null;
  analysis_status: string | null;
  frames_processed: number | null;
  video_duration_seconds: number | null;
  full_transcript: string | null;
  video_url: string | null;
  video_duration: number | null;
  video_uploaded_at: string | null;
}

export const candidateApi = {
  getAll: (jid?: string) =>
    request<ApiCandidateListItem[]>(
      `/api/hr/candidates${jid ? `?jid=${encodeURIComponent(jid)}` : ""}`
    ),

  getById: (id: string | number) =>
    request<ApiCandidateDetail>(`/api/hr/candidates/${id}`),

  search: (term: string) =>
    request<ApiCandidateListItem[]>(`/api/hr/candidates/search/${encodeURIComponent(term)}`),

  updateComment: (id: string | number, comment: string) =>
    request(`/api/hr/candidates/${id}/comment`, {
      method: "PUT",
      body: JSON.stringify({ decision_comment: comment }),
    }),
};

// ── Job Postings ─────────────────────────────────────────────

export interface JobPostingDropdownItem {
  jid: string;
  job_title: string;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
}

export const jobPostingApi = {
  getAll: () => request<JobPostingDropdownItem[]>("/api/job-postings"),

  getDropdown: () =>
    request<JobPostingDropdownItem[]>("/api/job-postings/dropdown"),

  getByJid: (jid: string) =>
    request<JobPostingDropdownItem>(`/api/job-postings/${encodeURIComponent(jid)}`),

  create: (data: { job_title: string; template_id?: number; status?: string; opens_at?: string; closes_at?: string }) =>
    request<JobPostingDropdownItem>("/api/job-postings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};