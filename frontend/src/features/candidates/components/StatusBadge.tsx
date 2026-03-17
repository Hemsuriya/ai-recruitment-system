import { getStatusColor } from "@/mock";
import type { PipelineStatus } from "@/types/models";

interface StatusBadgeProps {
  status: PipelineStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { color, bg } = getStatusColor(status);
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
      {status}
    </span>
  );
}
