import HrShell from "../../../components/layouts/HrShell";
import { useCandidatesList } from "../hooks/useCandidatesList";
import CandidateFilters from "../components/CandidateFilters";
import CandidateTable from "../components/CandidateTable";
import { Loader2 } from "lucide-react";

export default function CandidatesListPage() {
  const {
    search, roleFilter, jidFilter, verdictFilter, statusFilter, sortBy, filtered, total,
    loading, error, roles, jobPostings,
    setSearch, setRoleFilter, setJidFilter, setVerdictFilter, setStatusFilter, setSortBy, refetch,
  } = useCandidatesList();

  return (
    <HrShell activeItem="candidates">
      <div style={{ padding: "8px 2px 24px", width: "100%" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 className="app-page-title" style={{ marginBottom: 4 }}>
                Candidates
              </h1>
              <p className="app-meta-text">
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
            jidFilter={jidFilter}
            verdictFilter={verdictFilter}
            statusFilter={statusFilter}
            sortBy={sortBy}
            roles={roles}
            jobPostings={jobPostings}
            onSearch={setSearch}
            onRole={setRoleFilter}
            onJid={setJidFilter}
            onVerdict={setVerdictFilter}
            onStatus={setStatusFilter}
            onSort={setSortBy}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64 }}>
            <Loader2 size={24} style={{ color: "var(--brand)", animation: "spin 1s linear infinite" }} />
            <span style={{ marginLeft: 10, color: "var(--text-muted)", fontSize: 14 }}>Loading candidates…</span>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <p style={{ color: "var(--score-low)", fontSize: 14, marginBottom: 8 }}>Failed to load candidates</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>{error}</p>
            <button className="btn-primary" onClick={refetch}>Retry</button>
          </div>
        ) : (
          <CandidateTable candidates={filtered} />
        )}
      </div>
    </HrShell>
  );
}
