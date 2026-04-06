interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
}

const AVATAR_COLORS = [
  ["var(--color-violet-600)", "var(--color-violet-50)"],
  ["var(--color-blue-500)", "var(--color-blue-100)"],
  ["var(--color-green-500)", "var(--color-green-100)"],
  ["var(--color-amber-500)", "var(--color-amber-100)"],
  ["var(--color-red-500)", "var(--color-red-100)"],
  ["var(--color-violet-500)", "var(--color-violet-50)"],
  ["var(--color-cyan-500)", "var(--color-cyan-100)"],
  ["var(--color-orange-500)", "var(--color-orange-100)"],
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
