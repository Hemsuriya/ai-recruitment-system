const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GET_CACHE_TTL_MS = 30_000;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const inflightGetRequests = new Map<string, Promise<unknown>>();
const resolvedGetCache = new Map<string, CacheEntry>();

async function parseResponseBody(res: Response): Promise<unknown> {
  // 204/205 intentionally return no response body.
  if (res.status === 204 || res.status === 205) {
    return undefined;
  }

  const text = await res.text();
  if (!text) {
    return undefined;
  }

  const contentType = res.headers.get("content-type") || "";
  const looksLikeJson = contentType.includes("application/json");

  if (looksLikeJson) {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

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

    const body = await parseResponseBody(res);

    if (!res.ok) {
      const apiError =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: unknown }).error === "string"
          ? (body as { error: string }).error
          : undefined;
      throw new Error(apiError || `API error ${res.status}`);
    }

    const value =
      typeof body === "object" &&
      body !== null &&
      "data" in body
        ? (body as { data: unknown }).data
        : body;

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

// ── HR Assessments ──────────────────────────────────────────

export interface AssessmentQuestion {
  id?: number;
  question_text: string;
  is_default: boolean;
  is_selected: boolean;
  sort_order: number;
}

export interface AssessmentTimeLimits {
  mcq_time_limit: number;
  video_time_limit: number;
  coding_time_limit: number;
}

export interface AssessmentOptions {
  generate_ai_questions: boolean;
  include_coding: boolean;
  include_aptitude: boolean;
  include_ai_interview: boolean;
  include_manual_interview: boolean;
}

export interface CreateAssessmentPayload {
  role_title: string;
  experience_level: string;
  skills: string[];
  template_key?: string;
  questions: AssessmentQuestion[];
  options: AssessmentOptions;
  time_limits: AssessmentTimeLimits;
  job_description?: string;
  headcount?: number;
  closes_at?: string;
  department?: string;
  hiring_manager?: string;
  interviewer?: string;
}

export interface AssessmentRecord {
  id: number;
  jid: string;
  template_id: number | null;
  role_title: string;
  experience_level: string;
  skills: string[];
  job_description: string | null;
  ai_generated_jd: boolean;
  mcq_time_limit: number;
  video_time_limit: number;
  coding_time_limit: number;
  include_coding: boolean;
  include_aptitude: boolean;
  include_ai_interview: boolean;
  include_manual_interview: boolean;
  generate_ai_questions: boolean;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  questions: AssessmentQuestion[];
}

export const assessmentApi = {
  create: (data: CreateAssessmentPayload) =>
    request<{ assessment_id: number; jid: string; template_key: string }>(
      "/api/hr/assessments",
      { method: "POST", body: JSON.stringify(data) }
    ),

  getAll: (status?: string, page?: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (page) params.set("page", String(page));
    const qs = params.toString();
    return request<{ data: AssessmentRecord[]; total: number }>(
      `/api/hr/assessments${qs ? `?${qs}` : ""}`
    );
  },

  getById: (id: number) =>
    request<{ data: AssessmentRecord }>(`/api/hr/assessments/${id}`),

  update: (id: number, data: Partial<CreateAssessmentPayload>) =>
    request<{ data: AssessmentRecord }>(`/api/hr/assessments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<void>(`/api/hr/assessments/${id}`, { method: "DELETE" }),
};

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
  mcq_time_spent: number | null;
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
  pre_screening_questions: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentResult {
  jid: string;
  template_key: string;
  posting: Record<string, unknown>;
}

export type ApiDropdownTemplate = {
  id: number;
  template_code: string;
  template_name: string;
};

export type AutopopulateResponse = {
  template_code: string;
  template_name: string;
  role_title: string;
  experience_level: string;
  job_description: string;
  skills_required: string[];
  pre_screening_questions: string[];
  assessment_options?: {
    include_ai_questions?: boolean;
    include_coding_round?: boolean;
    include_aptitude_test?: boolean;
    include_ai_video_interview?: boolean;
    include_manual_video_interview?: boolean;
  };
  assessment_summary?: {
    role?: string;
    experience?: string;
    skills?: string[];
    components?: string[];
  };
  ai_source?: string;
  number_of_candidates?: number;
  survey_q1_expected_answer?: string;
};

export const jobTemplateApi = {
   
  getAll: () => request<ApiJobTemplate[]>("/api/job-templates"),

   getDropdownTemplates: () =>
    request<ApiDropdownTemplate[]>("/api/job-templates/dropdown"),

  autopopulate: (templateCode: string) =>
    request<AutopopulateResponse>(
      `/api/job-templates/${encodeURIComponent(templateCode)}/autopopulate`
    ),

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
    closes_at?: string;
    department?: string;
    hiring_manager?: string;
    interviewer?: string;
  }) =>
    request<CreateAssessmentResult>("/api/job-postings/create-assessment", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Settings: Departments & HR Members ──────────────────────

export interface Department {
  id: number;
  name: string;
}

export interface HrMember {
  id: number;
  name: string;
  email: string | null;
  role: string;
  department_id: number | null;
}

export const settingsApi = {
  getDepartments: () => request<Department[]>("/api/settings/departments"),

  createDepartment: (name: string) =>
    request<Department>("/api/settings/departments", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  deleteDepartment: (id: number) =>
    request<void>(`/api/settings/departments/${id}`, { method: "DELETE" }),

  getMembers: () => request<HrMember[]>("/api/settings/members"),

  createMember: (data: { name: string; email?: string; role?: string; department_id?: number | null }) =>
    request<HrMember>("/api/settings/members", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteMember: (id: number) =>
    request<void>(`/api/settings/members/${id}`, { method: "DELETE" }),
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
