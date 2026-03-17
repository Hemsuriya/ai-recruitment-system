import { motion } from "framer-motion";
import { useCandidatesList } from "../hooks/useCandidatesList";
import CandidateFilters from "../components/CandidateFilters";
import CandidateTable from "../components/CandidateTable";

export default function CandidatesListPage() {
  const {
    search, roleFilter, verdictFilter, statusFilter, sortBy, filtered, total,
    setSearch, setRoleFilter, setVerdictFilter, setStatusFilter, setSortBy,
  } = useCandidatesList();

  return (
    <div style={{ padding: "28px 28px 48px", maxWidth: 1280 }}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 22 }}
      >
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

          {/* Summary chips */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Strong Hire", color: "var(--verdict-strong-hire)", bg: "var(--verdict-strong-hire-bg)" },
              { label: "Hire",        color: "var(--verdict-hire)",        bg: "var(--verdict-hire-bg)" },
              { label: "Maybe",       color: "var(--verdict-maybe)",       bg: "var(--verdict-maybe-bg)" },
              { label: "Reject",      color: "var(--verdict-reject)",      bg: "var(--verdict-reject-bg)" },
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
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.07 }}
        style={{ marginBottom: 16 }}
      >
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
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
      >
        <CandidateTable candidates={filtered} />
      </motion.div>
    </div>
  );
}
