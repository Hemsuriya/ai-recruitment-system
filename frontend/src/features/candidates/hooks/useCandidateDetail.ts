import { useMemo } from "react";
import { candidates } from "@/mock";
import type { Candidate } from "@/types/models";

export function useCandidateDetail(id: string | undefined): {
  candidate: Candidate | null;
  notFound: boolean;
} {
  const candidate = useMemo(
    () => candidates.find((c) => c.id === id) ?? null,
    [id]
  );

  return { candidate, notFound: id !== undefined && candidate === null };
}
