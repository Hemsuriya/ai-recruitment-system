import { useState, useEffect } from "react";
import { candidateApi, type ApiCandidateDetail } from "@/services/api";
import type { Candidate, Verdict, PipelineStatus, ProctoringData, TranscriptEntry, SpeechAnalysis } from "@/types/models";

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function deriveVerdict(row: ApiCandidateDetail): Verdict {
  const score = row.final_score ?? 0;
  const securityScore = row.security_score ?? 100;
  const violations = (row.violations_summary ?? row.security_details ?? {}) as Record<string, unknown>;
  const emotion = (row.emotion_analysis ?? {}) as Record<string, unknown>;
  const attn = (row.attention_metrics ?? {}) as Record<string, unknown>;

  // Count proctoring red flags
  const tabSwitches = Number(violations.tab_switches ?? 0);
  const audioAnomalies = Number(violations.audio_anomalies ?? 0);
  const sessionRejoins = Number(violations.session_rejoins ?? 0);
  const totalViolations = tabSwitches + audioAnomalies + sessionRejoins;

  // Attention & emotion signals
  const attentionPct = Number(attn.attention_percentage ?? attn.speaking_confidence ?? 100);
  const negativePct = Number(emotion.negative_percentage ?? 0);
  const dominantEmotion = String(emotion.dominant_emotion ?? "").toLowerCase();
  const anxiousEmotions = ["anxious", "fearful", "nervous", "stressed"];

  // Start from score-based verdict
  let verdict: Verdict;
  if (score >= 85) verdict = "Strong Hire";
  else if (score >= 60) verdict = "Hire";
  else if (score >= 40) verdict = "Maybe";
  else verdict = "Reject";

  // Downgrade for high proctoring violations
  if (totalViolations >= 5 || sessionRejoins >= 2) {
    // Severe violations — drop by 2 levels
    if (verdict === "Strong Hire") verdict = "Maybe";
    else if (verdict === "Hire") verdict = "Reject";
    else verdict = "Reject";
  } else if (totalViolations >= 3) {
    // Moderate violations — drop by 1 level
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  // Downgrade for low security score
  if (securityScore < 50) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  // Downgrade for very low attention
  if (attentionPct < 55) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  // Downgrade for dominant negative emotion + high negative %
  if (anxiousEmotions.includes(dominantEmotion) && negativePct > 50) {
    if (verdict === "Strong Hire") verdict = "Hire";
    else if (verdict === "Hire") verdict = "Maybe";
  }

  return verdict;
}

function deriveStatus(row: ApiCandidateDetail): PipelineStatus {
  if (row.final_decision) return "Final Review";
  if (row.final_score && row.final_score > 0) return "Final Review";
  if (row.interview_completed) return "Interview Complete";
  if (row.interview_started) return "Assessment Pending";
  return "Screening";
}

function parseProctoring(row: ApiCandidateDetail): ProctoringData {
  const attn = (row.attention_metrics ?? {}) as Record<string, unknown>;
  const emotion = (row.emotion_analysis ?? {}) as Record<string, unknown>;
  const face = (row.face_detection ?? {}) as Record<string, unknown>;
  const violations = (row.violations_summary ?? {}) as Record<string, unknown>;
  const secDetails = (row.security_details ?? {}) as Record<string, unknown>;

  const integrityScore = row.security_score ?? 0;

  return {
    headOrientation: String(face.head_pose_status ?? attn.head_orientation ?? "Centered"),
    dominantEmotion: String(emotion.dominant_emotion ?? emotion.primary_emotion ?? "Neutral"),
    pupilOrientation: String(face.gaze_status ?? attn.pupil_orientation ?? "Centered"),
    integrityScore,
    speakingConfidence: Number(attn.speaking_confidence ?? attn.attention_percentage ?? 0),
    outOfWindowCount: Number(violations.tab_switches ?? secDetails.tab_switches ?? 0),
    audioAnomalyCount: Number(violations.audio_anomalies ?? secDetails.audio_anomalies ?? 0),
    sessionRejoins: Number(violations.session_rejoins ?? secDetails.session_rejoins ?? 0),
    integrityVerdict: integrityScore >= 70 ? "Low risk" : integrityScore >= 40 ? "Medium risk" : "High risk",
  };
}

function parseTranscript(raw: string | null): TranscriptEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((entry: Record<string, string>) => ({
        time: entry.time ?? entry.timestamp ?? "0:00",
        speaker: (entry.speaker === "Interviewer" ? "Interviewer" : "Candidate") as "Interviewer" | "Candidate",
        message: entry.message ?? entry.text ?? entry.content ?? "",
      }));
    }
  } catch {
    // If not JSON, try splitting plain text
    if (typeof raw === "string" && raw.length > 0) {
      return [{ time: "0:00", speaker: "Candidate", message: raw }];
    }
  }
  return [];
}

function parseSpeechAnalysis(row: ApiCandidateDetail): SpeechAnalysis {
  const duration = row.video_duration_seconds
    ? `${Math.round(row.video_duration_seconds / 60)} min`
    : "N/A";
  return {
    interviewer: { duration, confidence: 0, positive: 0, neutral: 100, negative: 0 },
    candidate: {
      duration,
      confidence: Number((row.attention_metrics as Record<string, unknown>)?.speaking_confidence ?? 0),
      positive: Number((row.emotion_analysis as Record<string, unknown>)?.positive_percentage ?? 0),
      neutral: Number((row.emotion_analysis as Record<string, unknown>)?.neutral_percentage ?? 100),
      negative: Number((row.emotion_analysis as Record<string, unknown>)?.negative_percentage ?? 0),
    },
  };
}

function parseQuestionScores(row: ApiCandidateDetail) {
  const qs = row.question_scores as Record<string, number> | null;
  if (!qs) {
    const score = row.interview_score ?? row.final_score ?? 0;
    return {
      communicationScore: score,
      confidenceScore: score,
      technicalClarity: score,
      skillMatch: score,
    };
  }
  return {
    communicationScore: Number(qs.communication ?? qs.communication_score ?? 0),
    confidenceScore: Number(qs.confidence ?? qs.confidence_score ?? 0),
    technicalClarity: Number(qs.technical_clarity ?? qs.technical ?? 0),
    skillMatch: Number(qs.skill_match ?? qs.relevance ?? 0),
  };
}

function mapDetail(row: ApiCandidateDetail): Candidate {
  const scores = parseQuestionScores(row);
  const interviewScore = row.interview_score ?? 0;

  const finalScore = row.final_score ?? 0;

  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    avatar: initials(row.name),
    role: row.job_title ?? "Candidate",
    appliedDate: row.created_at,
    resumeScore: 0,
    mcqScore: 0,
    videoScore: interviewScore,
    finalScore,
    verdict: deriveVerdict(row),
    status: deriveStatus(row),
    skills: [],
    aiSummary: row.overall_feedback ?? row.recommendation ?? "No AI summary available.",
    location: row.location ?? "—",
    company: "—",
    experience: "—",
    level: "—",
    salary: "—",
    notice: "—",
    visa: "—",
    matchedSkills: [],
    missingSkills: [],
    ...scores,
    strengths: row.strengths ?? [],
    weaknesses: row.weaknesses ?? [],
    proctoring: parseProctoring(row),
    speechAnalysis: parseSpeechAnalysis(row),
    transcript: parseTranscript(row.full_transcript),
  };
}

export function useCandidateDetail(id: string | undefined): {
  candidate: Candidate | null;
  raw: ApiCandidateDetail | null;
  notFound: boolean;
  loading: boolean;
  error: string | null;
} {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [raw, setRaw] = useState<ApiCandidateDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    candidateApi
      .getById(id)
      .then((data) => {
        if (!cancelled) {
          setRaw(data);
          setCandidate(mapDetail(data));
          setNotFound(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.message.includes("404") || err.message.includes("not found")) {
            setNotFound(true);
          } else {
            setError(err.message);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  return { candidate, raw, notFound, loading, error };
}