import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ScoreChip from "@/components/ui/ScoreChip";
import VerdictBadge from "./VerdictBadge";
import StatusBadge from "./StatusBadge";
import type { Candidate } from "@/types/models";

interface CandidateRowProps {
  candidate: Candidate;
}

export default function CandidateRow({ candidate: c }: CandidateRowProps) {
  const navigate = useNavigate();

  return (
    <tr
      key={c.id}
      onClick={() => navigate(`/hr/candidates/${c.id}`)}
      style={{ cursor: "pointer" }}
      className="candidate-row"
    >
      {/* Candidate */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={c.avatar} size={34} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
              {c.name}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{c.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td style={{ padding: "12px 16px" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.role}</span>
      </td>

      {/* Resume */}
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <ScoreChip score={c.resumeScore} label="Resume" />
      </td>

      {/* MCQ */}
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <ScoreChip score={c.mcqScore} label="MCQ" />
      </td>

      {/* Video */}
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <ScoreChip score={c.videoScore} label="Video" />
      </td>

      {/* Final */}
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <ScoreChip score={c.finalScore} label="Final" size="md" />
      </td>

      {/* Verdict */}
      <td style={{ padding: "12px 16px" }}>
        <VerdictBadge verdict={c.verdict} />
      </td>

      {/* Status */}
      <td style={{ padding: "12px 16px" }}>
        <StatusBadge status={c.status} />
      </td>

      {/* Chevron */}
      <td style={{ padding: "12px 12px", textAlign: "right" }}>
        <ChevronRight size={15} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
      </td>
    </tr>
  );
}
