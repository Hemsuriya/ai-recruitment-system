import { Bell, Search } from "lucide-react";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <header
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {title && (
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-muted)" }}>
          {title}
        </span>
      )}

      {/* Global search */}
      <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          className="input"
          placeholder="Search candidates…"
          style={{ paddingLeft: 32, height: 34 }}
          readOnly
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Notifications bell */}
        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
            position: "relative",
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--brand)",
              border: "1.5px solid #fff",
            }}
          />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6D5DF6, #4F46E5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          HR
        </div>
      </div>
    </header>
  );
}
