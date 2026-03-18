import HrShell from "../../../components/layouts/HrShell";
import { useCandidatesList } from "../hooks/useCandidatesList";
import CandidateFilters from "../components/CandidateFilters";
import CandidateTable from "../components/CandidateTable";

export default function CandidatesListPage() {
  const {
    search, roleFilter, verdictFilter, statusFilter, sortBy, filtered, total,
    setSearch, setRoleFilter, setVerdictFilter, setStatusFilter, setSortBy,
  } = useCandidatesList();

  return (
    <HrShell activeItem="candidates">
      <div style={{ padding: "8px 8px 24px", maxWidth: 1280 }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.4px",
                  marginBottom: 4,
                }}
              >
                Candidates
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Showing{" "}
                <strong style={{ color: "var(--text)" }}>{filtered.length}</strong>
                {" "}of{" "}
                <strong style={{ color: "var(--text)" }}>{total}</strong>
                {" "}candidates
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Strong Hire", color: "var(--verdict-strong-hire)", bg: "var(--verdict-strong-hire-bg)" },
                { label: "Hire", color: "var(--verdict-hire)", bg: "var(--verdict-hire-bg)" },
                { label: "Maybe", color: "var(--verdict-maybe)", bg: "var(--verdict-maybe-bg)" },
                { label: "Reject", color: "var(--verdict-reject)", bg: "var(--verdict-reject-bg)" },
              ].map(({ label, color, bg }) => {
                const count = filtered.filter((c) => c.verdict === label).length;
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: bg,
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{count}</span>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <CandidateFilters
            search={search}
            roleFilter={roleFilter}
            verdictFilter={verdictFilter}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onSearch={setSearch}
            onRole={setRoleFilter}
            onVerdict={setVerdictFilter}
            onStatus={setStatusFilter}
            onSort={setSortBy}
          />
        </div>

        <CandidateTable candidates={filtered} />
      </div>
    </HrShell>
  );
}
