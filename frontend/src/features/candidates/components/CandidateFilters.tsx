import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { ALL_ROLES, ALL_VERDICTS, ALL_STATUSES } from "@/mock";

interface CandidateFiltersProps {
  search: string;
  roleFilter: string;
  verdictFilter: string;
  statusFilter: string;
  sortBy: string;
  onSearch: (v: string) => void;
  onRole: (v: string) => void;
  onVerdict: (v: string) => void;
  onStatus: (v: string) => void;
  onSort: (v: "highest" | "lowest" | "latest" | "earliest") => void;
}

const SORT_OPTIONS = [
  { value: "highest", label: "Highest Score" },
  { value: "lowest",  label: "Lowest Score" },
  { value: "latest",  label: "Latest Applied" },
  { value: "earliest",label: "Earliest Applied" },
] as const;

export default function CandidateFilters({
  search, roleFilter, verdictFilter, statusFilter, sortBy,
  onSearch, onRole, onVerdict, onStatus, onSort,
}: CandidateFiltersProps) {
  return (
    <div
      className="card"
      style={{ padding: "12px 16px" }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <Search
            size={14}
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
            style={{ paddingLeft: 30, height: 34 }}
            placeholder="Search name, email, role…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Role */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <select className="select" value={roleFilter} onChange={(e) => onRole(e.target.value)}>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Verdict */}
        <select className="select" value={verdictFilter} onChange={(e) => onVerdict(e.target.value)}>
          {ALL_VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* Status */}
        <select className="select" value={statusFilter} onChange={(e) => onStatus(e.target.value)}>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <ArrowUpDown size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <select
            className="select"
            value={sortBy}
            onChange={(e) => onSort(e.target.value as "highest" | "lowest" | "latest" | "earliest")}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
