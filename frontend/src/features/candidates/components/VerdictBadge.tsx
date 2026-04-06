import { getVerdictColor } from "@/mock";
import type { Verdict } from "@/types/models";

interface VerdictBadgeProps {
  verdict: Verdict;
}

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const { color, bg } = getVerdictColor(verdict);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 20,
        padding: "8px 14px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      {verdict}
    </span>
  );
}
