// useCandidatesList — filter, sort, search over in-memory mock data
import { useState, useMemo } from "react";
import { candidates } from "@/mock";
import type { Candidate, Verdict, PipelineStatus } from "@/types/models";

type SortKey = "highest" | "lowest" | "latest" | "earliest";

export interface CandidatesListState {
  search: string;
  roleFilter: string;
  verdictFilter: string;
  statusFilter: string;
  sortBy: SortKey;
  filtered: Candidate[];
  total: number;
  setSearch: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setVerdictFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSortBy: (v: SortKey) => void;
}

export function useCandidatesList(): CandidatesListState {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [verdictFilter, setVerdictFilter] = useState("All Verdicts");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortBy, setSortBy] = useState<SortKey>("highest");

  const filtered = useMemo(() => {
    let result = [...candidates];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "All Roles") {
      result = result.filter((c) => c.role === roleFilter);
    }

    if (verdictFilter !== "All Verdicts") {
      result = result.filter((c) => c.verdict === (verdictFilter as Verdict));
    }

    if (statusFilter !== "All Statuses") {
      result = result.filter((c) => c.status === (statusFilter as PipelineStatus));
    }

    switch (sortBy) {
      case "highest":
        result.sort((a, b) => b.finalScore - a.finalScore);
        break;
      case "lowest":
        result.sort((a, b) => a.finalScore - b.finalScore);
        break;
      case "latest":
        result.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        break;
      case "earliest":
        result.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
        break;
    }

    return result;
  }, [search, roleFilter, verdictFilter, statusFilter, sortBy]);

  return {
    search, roleFilter, verdictFilter, statusFilter, sortBy, filtered,
    total: candidates.length,
    setSearch, setRoleFilter, setVerdictFilter, setStatusFilter, setSortBy,
  };
}
