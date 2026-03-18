interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
}

const AVATAR_COLORS = [
  ["#6D5DF6", "#EDE9FE"],
  ["#3B82F6", "#DBEAFE"],
  ["#22C55E", "#DCFCE7"],
  ["#F59E0B", "#FEF3C7"],
  ["#EF4444", "#FEE2E2"],
  ["#8B5CF6", "#F3E8FF"],
  ["#06B6D4", "#CFFAFE"],
  ["#F97316", "#FFEDD5"],
];

function hashInitials(s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % AVATAR_COLORS.length;
}

export default function Avatar({ initials, size = 36 }: AvatarProps) {
  const [fg, bg] = AVATAR_COLORS[hashInitials(initials)];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: fg,
        flexShrink: 0,
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
}
