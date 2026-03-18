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
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 20,
        padding: "3px 9px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {verdict}
    </span>
  );
}
