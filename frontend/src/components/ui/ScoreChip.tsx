import { getScoreColor } from "@/mock";

interface ScoreChipProps {
  score: number;
  label?: string;
  size?: "sm" | "md";
}

export default function ScoreChip({ score, label, size = "sm" }: ScoreChipProps) {
  if (score <= 0) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>—</span>
    );
  }

  const color = getScoreColor(score);
  const fs = size === "sm" ? 12 : 13;
  const px = size === "sm" ? "6px 8px" : "4px 10px";

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
        borderRadius: 6,
        padding: px,
        cursor: "default",
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }}
      />
      {score}
    </span>
  );
}
