// ── Types ───────────────────────────────────────────────────────────
// All domain types for the HireAI Candidates feature

export type Verdict = "Strong Hire" | "Hire" | "Maybe" | "Reject";

export type PipelineStatus =
  | "Screening"
  | "Assessment Pending"
  | "Interview Complete"
  | "MCQ Complete"
  | "Final Review";

export interface ProctoringData {
  headOrientation: string;
  dominantEmotion: string;
  pupilOrientation: string;
  integrityScore: number;
  speakingConfidence: number;
  outOfWindowCount: number;
  audioAnomalyCount: number;
  sessionRejoins: number;
  integrityVerdict: "Low risk" | "Medium risk" | "High risk";
}

export interface SpeakerStats {
  duration: string;
  confidence: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface SpeechAnalysis {
  interviewer: SpeakerStats;
  candidate: SpeakerStats;
}

export interface TranscriptEntry {
  time: string;
  speaker: "Interviewer" | "Candidate";
  message: string;
}

export interface Candidate {
  // ── List fields ──────────────────────────────────────────────────
  id: string;
  jid?: string;
  name: string;
  email: string;
  avatar: string;           // initials e.g. "JD"
  role: string;
  appliedDate: string;      // ISO date string

  // Score pillars (0 = not yet evaluated)
  resumeScore: number;
  mcqScore: number;
  videoScore: number;
  finalScore: number;

  verdict: Verdict;
  status: PipelineStatus;
  skills: string[];         // tags shown in list
  aiSummary: string;

  // ── Detail-only fields ───────────────────────────────────────────
  location: string;
  company: string;
  experience: string;       // e.g. "5 years"
  level: string;            // e.g. "Senior (5–8 yrs)"
  salary: string;           // e.g. "$140k – $160k"
  notice: string;           // e.g. "2 weeks"
  visa: string;             // e.g. "US Citizen"

  matchedSkills: string[];
  missingSkills: string[];

  // Sub-scores for detail breakdown
  communicationScore: number;
  confidenceScore: number;
  technicalClarity: number;
  skillMatch: number;

  strengths: string[];
  weaknesses: string[];

  proctoring: ProctoringData;
  speechAnalysis: SpeechAnalysis;
  transcript: TranscriptEntry[];

  // MCQ detail fields
  mcqGrade: string | null;
  mcqTotalQuestions: number | null;
  mcqCorrectAnswers: number | null;
  mcqTimeSpent: number | null;

  // Whether candidate has video interview data
  hasVideoInterview: boolean;
}
