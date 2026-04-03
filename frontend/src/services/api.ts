const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002";
const GET_CACHE_TTL_MS = 30_000;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const inflightGetRequests = new Map<string, Promise<unknown>>();
const resolvedGetCache = new Map<string, CacheEntry>();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() || "GET";
  const cacheKey = `${method}:${path}`;

  if (method === "GET") {
    const cached = resolvedGetCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const inflight = inflightGetRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const fetchPromise = (async () => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  const json = await res.json();
    const value = json.data ?? json;

    if (method === "GET") {
      resolvedGetCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
      });
    }

    return value as T;
  })();

  if (method === "GET") {
    inflightGetRequests.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      inflightGetRequests.delete(cacheKey);
    }
  }

  return fetchPromise;
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
  resume_score: number | null;
  mcq_score: number | null;
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
  resume_score: number | null;
  mcq_score: number | null;
  mcq_grade: string | null;
  mcq_total_questions: number | null;
  mcq_correct_answers: number | null;
  current_company: string | null;
  experience_level: string | null;
  salary_expectation: string | null;
  candidate_skills: string | null;
  notice_period: string | null;
  visa_status: string | null;
}

export const candidateApi = {
  getAll: (jid?: string, jobTitle?: string) => {
    const params = new URLSearchParams();
    if (jid) params.set("jid", jid);
    if (jobTitle) params.set("job_title", jobTitle);
    const qs = params.toString();
    return request<ApiCandidateListItem[]>(`/api/hr/candidates${qs ? `?${qs}` : ""}`);
  },

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
  headcount: number | null;
}

export const jobPostingApi = {
  getAll: () => request<JobPostingDropdownItem[]>("/api/job-postings"),

  getDropdown: (jobTitle?: string) =>
    request<JobPostingDropdownItem[]>(
      `/api/job-postings/dropdown${jobTitle ? `?job_title=${encodeURIComponent(jobTitle)}` : ""}`
    ),

  getRoles: () => request<string[]>("/api/job-postings/roles"),

  getByJid: (jid: string) =>
    request<JobPostingDropdownItem>(`/api/job-postings/${encodeURIComponent(jid)}`),

  getByTemplate: (templateId: number) =>
    request<JobPostingDropdownItem[]>(`/api/job-postings/by-template/${templateId}`),

  create: (data: { job_title: string; template_id?: number; status?: string; opens_at?: string; closes_at?: string }) =>
    request<JobPostingDropdownItem>("/api/job-postings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Job Templates ─────────────────────────────────────────────

export interface ApiJobTemplate {
  id: number;
  template_key: string;
  job_title: string;
  job_description: string | null;
  required_skills: string | null;
  number_of_candidates: string | null;
  survey_question_1: string | null;
  survey_q1_expected_answer: string | null;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentResult {
  jid: string;
  template_key: string;
  posting: Record<string, unknown>;
}

export const jobTemplateApi = {
  getAll: () => request<ApiJobTemplate[]>("/api/job-templates"),

  getByKey: (key: string) =>
    request<ApiJobTemplate>(`/api/job-templates/${encodeURIComponent(key)}`),

  update: (key: string, data: Partial<ApiJobTemplate>) =>
    request<ApiJobTemplate>(`/api/job-templates/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  duplicate: (key: string) =>
    request<ApiJobTemplate>(`/api/job-templates/${encodeURIComponent(key)}/duplicate`, {
      method: "POST",
    }),

  remove: (key: string) =>
    request<void>(`/api/job-templates/${encodeURIComponent(key)}`, {
      method: "DELETE",
    }),

  createAssessment: (data: {
    job_title: string;
    template_key?: string;
    required_skills?: string;
    survey_question_1?: string;
    survey_q1_expected_answer?: string;
    time_limit_minutes?: number;
    headcount?: number;
  }) =>
    request<CreateAssessmentResult>("/api/job-postings/create-assessment", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Dashboard ───────────────────────────────────────────────

export interface DashboardSummary {
  totalCandidates: number;
  avgScore: number;
  shortlisted: number;
  pendingDecision: number;
}

export interface DashboardFunnelItem {
  stage: "Resume" | "MCQ" | "Video" | "Final" | string;
  count: number;
}

export interface DashboardStageScoreItem {
  stage: "Resume" | "MCQ" | "Video" | "Final" | string;
  avgScore: number;
}

export interface DashboardRecentCandidate {
  name: string;
  role: string;
  resume: number;
  mcq: number;
  video: number;
  verdict: string;
}

export interface DashboardRecentActivity {
  text: string;
  timeAgo: string;
  type: string;
}

export const dashboardApi = {
  getSummary: (jid?: string, jobTitle?: string) =>
    request<DashboardSummary>(
      `/api/dashboard/summary${jid || jobTitle ? `?${new URLSearchParams([
        ...(jid ? [["jid", jid]] : []),
        ...(jobTitle ? [["job_title", jobTitle]] : []),
      ]).toString()}` : ""}`
    ),
  getFunnel: (jid?: string, jobTitle?: string) =>
    request<DashboardFunnelItem[]>(
      `/api/dashboard/funnel${jid || jobTitle ? `?${new URLSearchParams([
        ...(jid ? [["jid", jid]] : []),
        ...(jobTitle ? [["job_title", jobTitle]] : []),
      ]).toString()}` : ""}`
    ),
  getStageScores: (jid?: string, jobTitle?: string) =>
    request<DashboardStageScoreItem[]>(
      `/api/dashboard/stage-scores${jid || jobTitle ? `?${new URLSearchParams([
        ...(jid ? [["jid", jid]] : []),
        ...(jobTitle ? [["job_title", jobTitle]] : []),
      ]).toString()}` : ""}`
    ),
  getRecentCandidates: (jid?: string, jobTitle?: string) =>
    request<DashboardRecentCandidate[]>(
      `/api/dashboard/recent-candidates${jid || jobTitle ? `?${new URLSearchParams([
        ...(jid ? [["jid", jid]] : []),
        ...(jobTitle ? [["job_title", jobTitle]] : []),
      ]).toString()}` : ""}`
    ),
  getRecentActivity: (jid?: string, jobTitle?: string) =>
    request<DashboardRecentActivity[]>(
      `/api/dashboard/recent-activity${jid || jobTitle ? `?${new URLSearchParams([
        ...(jid ? [["jid", jid]] : []),
        ...(jobTitle ? [["job_title", jobTitle]] : []),
      ]).toString()}` : ""}`
    ),
};
