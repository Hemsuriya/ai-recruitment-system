import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Brain, Video, ShieldCheck,
  User, BarChart2, CheckCircle, AlertCircle, MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useCandidateDetail } from "../hooks/useCandidateDetail";
import VerdictBadge from "../components/VerdictBadge";
import StatusBadge from "../components/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import ScoreChip from "@/components/ui/ScoreChip";
import { getScoreColor } from "@/mock";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Icon size={15} style={{ color: "var(--brand)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</span>
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = getScoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", width: 150, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <ScoreChip score={score} />
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={12} style={{ color: "var(--text-muted)" }} />}
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

function SkillChip({ label, type }: { label: string; type: "matched" | "missing" }) {
  const matched = type === "matched";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 20,
        background: matched ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
        color: matched ? "var(--score-high)" : "var(--score-low)",
        border: `1px solid ${matched ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)"}`,
      }}
    >
      {matched ? "✓" : "✗"} {label}
    </span>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidate: c, notFound } = useCandidateDetail(id);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  if (notFound) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Candidate not found</p>
        <button className="btn-ghost" onClick={() => navigate("/candidates")}>← Back to Candidates</button>
      </div>
    );
  }

  if (!c) return null;

  const scoreCards = [
    { icon: FileText, score: c.resumeScore, label: "Resume Score",   color: "#3B82F6" },
    { icon: Brain,    score: c.mcqScore,    label: "MCQ Score",      color: "#F59E0B" },
    { icon: Video,    score: c.videoScore,  label: "Video Score",    color: "#8B5CF6" },
    { icon: ShieldCheck, score: c.proctoring.integrityScore, label: "Integrity Score", color: "#22C55E" },
  ];

  const getScoreBorder = (score: number) => {
    if (score >= 80) return "3px solid #22C55E";
    if (score >= 60) return "3px solid #F59E0B";
    return "3px solid #EF4444";
  };

  return (
    <div>
      {/* ── Sticky Header ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar initials={c.avatar} size={44} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{c.name}</h1>
              <VerdictBadge verdict={c.verdict} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.role}</span>
              <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>•</span>
              <StatusBadge status={c.status} />
              <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>•</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "rgba(109,93,246,0.1)",
                  color: "var(--brand)",
                }}
              >
                {c.finalScore}% Final Score
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-ghost" onClick={() => navigate("/candidates")} style={{ marginRight: 8 }}>
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            style={{
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--score-high)",
              background: "transparent",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Offer
          </button>
          <button
            style={{
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--score-low)",
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      </motion.div>

      <div style={{ padding: "24px 28px 64px", maxWidth: 1200 }}>
        {/* ── Score Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}
        >
          {scoreCards.map(({ icon: Icon, score, label, color }, idx) => (
            <div
              key={idx}
              className="card"
              style={{ padding: "16px 18px", borderBottom: getScoreBorder(score) }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{score > 0 ? score : "—"}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>/100</p>
                </div>
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Profile + Analysis 2-col ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}
        >
          {/* Candidate Profile */}
          <Section title="Candidate Profile" icon={User}>
            <div style={{ marginBottom: 14 }}>
              <InfoRow label="Email"           value={c.email}    />
              <InfoRow label="Phone"           value="+1 (555) 234-5678" />
              <InfoRow label="Location"        value={c.location} />
              <InfoRow label="Current Company" value={c.company}  />
              <InfoRow label="Experience"      value={c.experience} />
              <InfoRow label="Level"           value={c.level} />
              <InfoRow label="Salary Expectation" value={c.salary} />
              <InfoRow label="Notice Period"   value={c.notice}   />
              <InfoRow label="Visa Status"     value={c.visa}     />
              <InfoRow label="Job ID"          value={`JOB-2025-${c.role.split(' ')[0].toUpperCase()}-${c.id.padStart(3, '0')}`} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Skills Match
              </p>
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>MATCHED</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {c.matchedSkills.map((s) => <SkillChip key={s} label={s} type="matched" />)}
                </div>
              </div>
              {c.missingSkills.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>MISSING</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {c.missingSkills.map((s) => <SkillChip key={s} label={s} type="missing" />)}
                  </div>
                </div>
              )}
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                AI Summary
              </p>
              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{c.aiSummary}</p>
            </div>
          </Section>

          {/* Assessment Analysis */}
          <Section title="Assessment Analysis" icon={BarChart2}>
            {/* Score breakdown bars */}
            <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <ScoreBar label="Communication"    score={c.communicationScore} />
              <ScoreBar label="Confidence"        score={c.confidenceScore} />
              <ScoreBar label="Technical Clarity" score={c.technicalClarity} />
              <ScoreBar label="Skill Match"        score={c.skillMatch} />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 14 }}>
              {/* Strengths */}
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <CheckCircle size={13} style={{ color: "var(--score-high)" }} /> Strengths
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {c.strengths.map((s, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--score-high)", marginTop: 6, flexShrink: 0 }} />
                    {s}
                  </li>
                ))}
              </ul>

              {/* Weaknesses */}
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <AlertCircle size={13} style={{ color: "var(--score-mid)" }} /> Weaknesses
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {c.weaknesses.map((w, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--score-mid)", marginTop: 6, flexShrink: 0 }} />
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Final verdict banner */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Final Recommendation
              </p>
              <VerdictBadge verdict={c.verdict} />
            </div>
          </Section>
        </motion.div>

        {/* ── Video + Proctoring ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}
        >
          {/* Video Panel */}
          <Section title="Video Interview" icon={Video}>
            <div
              style={{
                background: "#0F172A",
                borderRadius: 10,
                aspectRatio: "16/9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                gap: 8,
              }}
            >
              <Video size={36} style={{ color: "rgba(255,255,255,0.5)" }} />
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Interview Recording</p>
              <button
                style={{
                  marginTop: 4,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#fff",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                ▶ Play Recording
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Duration: {c.videoScore > 0 ? "42 min" : "Not yet recorded"} · Applied: {new Date(c.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </Section>

          {/* Proctoring */}
          <Section title="Proctoring Analysis" icon={ShieldCheck}>
            {[
              { label: "Head Orientation",   value: c.proctoring.headOrientation },
              { label: "Dominant Emotion",    value: c.proctoring.dominantEmotion },
              { label: "Pupil Orientation",   value: c.proctoring.pupilOrientation },
              { label: "Integrity Score",     value: `${c.proctoring.integrityScore}/100` },
              { label: "Speaking Confidence", value: `${c.proctoring.speakingConfidence}%` },
            ].map(({ label, value }, i) => (
              <div
                key={i}
                style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}
              >
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{value}</span>
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Detailed Flags
              </p>
              {[
                { label: "Out-of-window occurrences", value: String(c.proctoring.outOfWindowCount), ok: c.proctoring.outOfWindowCount === 0 },
                { label: "Audio anomaly count",        value: String(c.proctoring.audioAnomalyCount), ok: c.proctoring.audioAnomalyCount <= 2 },
                { label: "Session rejoins",            value: String(c.proctoring.sessionRejoins),    ok: c.proctoring.sessionRejoins === 0 },
              ].map(({ label, value, ok }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ok ? "var(--score-high)" : "var(--score-mid)" }}>{value}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 8,
                background: c.proctoring.integrityVerdict === "Low risk" ? "rgba(34,197,94,0.08)" : c.proctoring.integrityVerdict === "Medium risk" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${c.proctoring.integrityVerdict === "Low risk" ? "rgba(34,197,94,0.2)" : c.proctoring.integrityVerdict === "Medium risk" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ShieldCheck size={14} style={{ color: c.proctoring.integrityVerdict === "Low risk" ? "var(--score-high)" : c.proctoring.integrityVerdict === "Medium risk" ? "var(--score-mid)" : "var(--score-low)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.proctoring.integrityVerdict === "Low risk" ? "var(--score-high)" : c.proctoring.integrityVerdict === "Medium risk" ? "var(--score-mid)" : "var(--score-low)" }}>
                {c.proctoring.integrityVerdict} candidate
              </span>
            </div>
          </Section>
        </motion.div>



        {/* ── Transcript ── */}
        {c.transcript.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="card" style={{ overflow: "hidden" }}>
              <button
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: transcriptOpen ? "1px solid var(--border)" : "none",
                }}
                onClick={() => setTranscriptOpen((o) => !o)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={15} style={{ color: "var(--brand)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Interview Transcript</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>{c.transcript.length * 2} exchanges · ~42 min</span>
                </div>
                <ChevronDown
                  size={15}
                  style={{ color: "var(--text-muted)", transform: transcriptOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                />
              </button>

              {transcriptOpen && (
                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {c.transcript.map((entry, i) => {
                    const isInterviewer = entry.speaker === "Interviewer";
                    return (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", width: 36, flexShrink: 0, paddingTop: 3 }}>{entry.time}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 20,
                            flexShrink: 0,
                            background: isInterviewer ? "#DBEAFE" : "#F3E8FF",
                            color: isInterviewer ? "#3B82F6" : "#8B5CF6",
                          }}
                        >
                          {entry.speaker}
                        </span>
                        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{entry.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
