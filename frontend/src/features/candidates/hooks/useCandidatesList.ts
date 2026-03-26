import { useState, useEffect, useMemo } from "react";
import { candidateApi, jobPostingApi, type ApiCandidateListItem, type JobPostingDropdownItem } from "@/services/api";
import type { Verdict, PipelineStatus } from "@/types/models";

type SortKey = "highest" | "lowest" | "latest" | "earliest";

export interface CandidateListRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  jid: string | null;
  appliedDate: string;
  finalScore: number;
  interviewScore: number;
  securityScore: number;
  verdict: Verdict;
  status: PipelineStatus;
  recommendation: string | null;
  decisionComment: string | null;
}

function deriveVerdict(row: ApiCandidateListItem): Verdict {
  const score = row.score;
  const securityScore = row.security_score ?? 100;
  const violations = (row.violations_summary ?? row.security_details ?? {}) as Record<string, unknown>;
  const emotion = (row.emotion_analysis ?? {}) as Record<string, unknown>;
  const attn = (row.attention_metrics ?? {}) as Record<string, unknown>;

  const tabSwitches = Number(violations.tab_switches ?? 0);
  const audioAnomalies = Number(violations.audio_anomalies ?? 0);
  const sessionRejoins = Number(violations.session_rejoins ?? 0);
  const totalViolations = tabSwitches + audioAnomalies + sessionRejoins;
  const attentionPct = Number(attn.attention_percentage ?? attn.speaking_confidence ?? 100);
  const negativePct = Number(emotion.negative_percentage ?? 0);
  const dominantEmotion = String(emotion.dominant_emotion ?? "").toLowerCase();
  const anxiousEmotions = ["anxious", "fearful", "nervous", "stressed"];

  let verdict: Verdict;
  if (score >= 85) verdict = "Strong Hire";
  else if (score >= 60) verdict = "Hire";
  else if (score >= 40) verdict = "Maybe";
  else verdict = "Reject";

  if (totalViolations >= 5 || sessionRejoins >= 2) {
    if (verdict === "Strong Hire") verdict = "Maybe";
    else if (verdict === "Hire") verdict = "Reject";
    else verdict = "Reject";
  } else if (totalViolations >= 3) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  if (securityScore < 50) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  if (attentionPct < 55) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  if (anxiousEmotions.includes(dominantEmotion) && negativePct > 50) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  return verdict;
}

function deriveStatus(item: ApiCandidateListItem): PipelineStatus {
  if (item.score > 0) return "Final Review";
  return "Interview Complete";
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function mapRow(row: ApiCandidateListItem): CandidateListRow {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: initials(row.name),
    role: row.job_title || "Candidate",
    jid: row.jid,
    appliedDate: row.date,
    finalScore: row.score,
    interviewScore: row.interview_score ?? 0,
    securityScore: row.security_score ?? 0,
    verdict: deriveVerdict(row),
    status: deriveStatus(row),
    recommendation: row.recommendation,
    decisionComment: row.decision_comment,
  };
}

export interface CandidatesListState {
  search: string;
  roleFilter: string;
  jidFilter: string;
  verdictFilter: string;
  statusFilter: string;
  sortBy: SortKey;
  filtered: CandidateListRow[];
  total: number;
  loading: boolean;
  error: string | null;
  roles: string[];
  jobPostings: JobPostingDropdownItem[];
  setSearch: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setJidFilter: (v: string) => void;
  setVerdictFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSortBy: (v: SortKey) => void;
  refetch: () => void;
}

export function useCandidatesList(): CandidatesListState {
  const [rows, setRows] = useState<CandidateListRow[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPostingDropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilterRaw] = useState(() => sessionStorage.getItem("dashboard_role") || "All Roles");
  const [jidFilter, setJidFilter] = useState(() => sessionStorage.getItem("dashboard_jid") || "All Jobs");
  const [verdictFilter, setVerdictFilter] = useState("All Verdicts");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortBy, setSortBy] = useState<SortKey>("highest");
  const [fetchKey, setFetchKey] = useState(0);

  // Fetch roles once
  useEffect(() => {
    jobPostingApi.getRoles().then(setRoles).catch(() => {});
  }, []);

  // When role changes, reset JID and re-fetch JID dropdown
  const setRoleFilter = (v: string) => {
    setRoleFilterRaw(v);
    setJidFilter("All Jobs");
  };

  useEffect(() => {
    const role = roleFilter !== "All Roles" ? roleFilter : undefined;
    jobPostingApi.getDropdown(role).then(setJobPostings).catch(() => {});
  }, [roleFilter]);

  // Handle template_id URL param (from Templates "Use" button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template_id");
    if (templateId) {
      jobPostingApi.getByTemplate(Number(templateId)).then((postings) => {
        if (postings.length > 0) {
          setRoleFilterRaw(postings[0].job_title);
          setJidFilter(postings[0].jid);
        }
      }).catch(() => {});
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Fetch candidates (re-fetch when JID, role, or fetchKey changes)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const jid = jidFilter !== "All Jobs" ? jidFilter : undefined;
    const jobTitle = roleFilter !== "All Roles" ? roleFilter : undefined;
    candidateApi
      .getAll(jid, jobTitle)
      .then((data) => {
        if (!cancelled) {
          setRows(data.map(mapRow));
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [jidFilter, roleFilter, fetchKey]);

  const filtered = useMemo(() => {
    let result = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    if (verdictFilter !== "All Verdicts") {
      result = result.filter((c) => c.verdict === verdictFilter);
    }

    if (statusFilter !== "All Statuses") {
      result = result.filter((c) => c.status === statusFilter);
    }

    switch (sortBy) {
      case "highest":
        result.sort((a, b) => b.finalScore - a.finalScore);
        break;
      case "lowest":
        result.sort((a, b) => a.finalScore - b.finalScore);
        break;
      case "latest":
        result.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        break;
      case "earliest":
        result.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
        break;
    }

    return result;
  }, [rows, search, verdictFilter, statusFilter, sortBy]);

  return {
    search, roleFilter, jidFilter, verdictFilter, statusFilter, sortBy,
    filtered, total: rows.length, loading, error, roles, jobPostings,
    setSearch, setRoleFilter, setJidFilter, setVerdictFilter, setStatusFilter, setSortBy,
    refetch: () => setFetchKey((k) => k + 1),
  };
}
