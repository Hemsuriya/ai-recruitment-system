import { Users } from "lucide-react";
import CandidateRow from "./CandidateRow";
import type { CandidateListRow } from "../hooks/useCandidatesList";

interface CandidateTableProps {
  candidates: CandidateListRow[];
}

const HEADERS = [
  { label: "Candidate", align: "left" as const },
  { label: "Role / JID", align: "left" as const },
  { label: "Interview",  align: "center" as const },
  { label: "Security",   align: "center" as const },
  { label: "Final",      align: "center" as const },
  { label: "Verdict",    align: "left" as const },
  { label: "Status",     align: "left" as const },
  { label: "",           align: "right" as const },
];

export default function CandidateTable({ candidates }: CandidateTableProps) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {HEADERS.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 16px",
                    textAlign: h.align,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#111827",
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
                <td colSpan={8} style={{ padding: "64px 24px", textAlign: "center" }}>
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
