import { getScoreColor } from "@/mock";

interface ScoreChipProps {
  score: number;
  label?: string;
  size?: "sm" | "md";
}

export default function ScoreChip({ score, label, size = "sm" }: ScoreChipProps) {
  if (score <= 0) {
    return (
      <span style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "monospace" }}>—</span>
    );
  }

  const color = getScoreColor(score);
  const fs = size === "sm" ? 14 : 14;
  const px = size === "sm" ? "8px 14px" : "8px 14px";

  return (
    <span
      title={label ? `${label}: ${score}/100` : `${score}/100`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: fs,
        fontWeight: 600,
        fontFamily: "monospace",
        color,
        background: `${color}14`,
        borderRadius: 999,
        padding: px,
        cursor: "default",
      }}
    >
      <span
        style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }}
      />
      {score}
    </span>
  );
}
