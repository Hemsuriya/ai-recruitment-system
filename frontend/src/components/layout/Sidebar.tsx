import { Users, Brain } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/candidates", label: "Candidates", icon: Users },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 228,
        minWidth: 228,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          height: 60,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6D5DF6, #4F46E5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(109,93,246,0.28)",
          }}
        >
          <Brain size={16} color="#fff" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
          Hire<span style={{ color: "var(--brand)" }}>AI</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              position: "relative",
              color: isActive ? "var(--brand)" : "var(--text-muted)",
              background: isActive ? "var(--brand-soft)" : "transparent",
              transition: "all 0.15s",
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: 20,
                      borderRadius: "0 3px 3px 0",
                      background: "var(--brand)",
                    }}
                  />
                )}
                <Icon size={17} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            HR Admin
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            admin@hireai.com
          </p>
        </div>
      </div>
    </aside>
  );
}
