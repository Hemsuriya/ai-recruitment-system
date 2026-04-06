import { Search, ArrowUpDown, Briefcase } from "lucide-react";
import type { JobPostingDropdownItem } from "@/services/api";

const ALL_VERDICTS = ["All Verdicts", "Strong Hire", "Hire", "Maybe", "Reject"];
const ALL_STATUSES = ["All Statuses", "Screening", "Assessment Pending", "Interview Complete", "Final Review"];

interface CandidateFiltersProps {
  search: string;
  roleFilter: string;
  jidFilter: string;
  verdictFilter: string;
  statusFilter: string;
  sortBy: string;
  roles: string[];
  jobPostings: JobPostingDropdownItem[];
  onSearch: (v: string) => void;
  onRole: (v: string) => void;
  onJid: (v: string) => void;
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
  search, roleFilter, jidFilter, verdictFilter, statusFilter, sortBy,
  roles, jobPostings,
  onSearch, onRole, onJid, onVerdict, onStatus, onSort,
}: CandidateFiltersProps) {
  return (
    <div className="card" style={{ padding: "12px 16px" }}>
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
            placeholder="Search name, email…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Job Title Filter */}
        <select className="select" value={roleFilter} onChange={(e) => onRole(e.target.value)}>
          <option value="All Roles">All Job Titles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* JID Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Briefcase size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <select className="select" value={jidFilter} onChange={(e) => onJid(e.target.value)}>
            <option value="All Jobs">All Jobs</option>
            {jobPostings.map((jp) => (
              <option key={jp.jid} value={jp.jid}>
                {jp.jid} — {jp.job_title} ({jp.status})
              </option>
            ))}
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
