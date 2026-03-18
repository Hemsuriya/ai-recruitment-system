import { Users } from "lucide-react";
import CandidateRow from "./CandidateRow";
import type { Candidate } from "@/types/models";

interface CandidateTableProps {
  candidates: Candidate[];
}

const HEADERS = [
  { label: "Candidate", align: "left" as const },
  { label: "Role",      align: "left" as const },
  { label: "Resume",    align: "center" as const },
  { label: "MCQ",       align: "center" as const },
  { label: "Video",     align: "center" as const },
  { label: "Final",     align: "center" as const },
  { label: "Verdict",   align: "left" as const },
  { label: "Status",    align: "left" as const },
  { label: "",          align: "right" as const },
];

export default function CandidateTable({ candidates }: CandidateTableProps) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 16px",
                    textAlign: h.align,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.length > 0 ? (
              candidates.map((c) => (
                <CandidateRow key={c.id} candidate={c} />
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ padding: "64px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <Users size={36} style={{ color: "var(--text-muted)", opacity: 0.25 }} />
                    <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No candidates match your filters</p>
                    <p style={{ fontSize: 12, color: "var(--text-subtle)" }}>Try adjusting the search or filter criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
