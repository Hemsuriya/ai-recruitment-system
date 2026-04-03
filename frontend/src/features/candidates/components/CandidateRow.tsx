import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ScoreChip from "@/components/ui/ScoreChip";
import VerdictBadge from "./VerdictBadge";
import StatusBadge from "./StatusBadge";
import type { CandidateListRow } from "../hooks/useCandidatesList";

interface CandidateRowProps {
  candidate: CandidateListRow;
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
      <td style={{ padding: "18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={c.avatar} size={34} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.3 }}>
              {c.name}
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 1 }}>{c.email}</p>
          </div>
        </div>
      </td>

      {/* Job Title / JID */}
      <td style={{ padding: "18px 16px" }}>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            marginBottom: 2,
          }}
        >
          Job Title
        </p>
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{c.role}</span>
        {c.jid && (
          <p style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 2 }}>Job ID: {c.jid}</p>
        )}
      </td>

      {/* Interview */}
      <td style={{ padding: "18px 16px", textAlign: "center" }}>
        <ScoreChip score={c.interviewScore} label="Interview" />
      </td>

      {/* Security */}
      <td style={{ padding: "18px 16px", textAlign: "center" }}>
        <ScoreChip score={c.securityScore} label="Security" />
      </td>

      {/* Final */}
      <td style={{ padding: "18px 16px", textAlign: "center" }}>
        <ScoreChip score={c.finalScore} label="Final" size="md" />
      </td>

      {/* Verdict */}
      <td style={{ padding: "18px 16px" }}>
        <VerdictBadge verdict={c.verdict} />
      </td>

      {/* Status */}
      <td style={{ padding: "18px 16px" }}>
        <StatusBadge status={c.status} />
      </td>

      {/* Chevron */}
      <td style={{ padding: "18px 12px", textAlign: "right" }}>
        <ChevronRight size={15} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
      </td>
    </tr>
  );
}
