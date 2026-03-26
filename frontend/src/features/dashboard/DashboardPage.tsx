import { useState, useEffect, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  SearchCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import HrShell from "../../components/layouts/HrShell";
import {
  dashboardApi,
  jobPostingApi,
  type DashboardFunnelItem,
  type DashboardRecentActivity,
  type DashboardRecentCandidate,
  type DashboardStageScoreItem,
  type DashboardSummary,
  type JobPostingDropdownItem,
} from "@/services/api";

const funnelPalette: Record<string, string> = {
  Resume: "var(--color-blue-500)",
  MCQ: "var(--color-amber-500)",
  Video: "var(--color-violet-500)",
  Final: "var(--color-green-500)",
};

const stageScorePalette: Record<string, string> = {
  Resume: "bg-emerald-500",
  MCQ: "bg-amber-500",
  Video: "bg-indigo-500",
  Final: "bg-indigo-500",
};

const activityPalette: Record<string, string> = {
  resume: "bg-blue-500",
  mcq: "bg-amber-500",
  video: "bg-violet-500",
  final: "bg-green-500",
};

const emptySummary: DashboardSummary = {
  totalCandidates: 0,
  avgScore: 0,
  shortlisted: 0,
  pendingDecision: 0,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getVerdictTone(verdict: string) {
  const normalized = verdict.toLowerCase();
  if (normalized === "hire" || normalized === "strong hire") return "green";
  if (normalized === "maybe" || normalized === "pending") return "amber";
  return "blue";
}

function getStageBarTone(stage: string) {
  return stageScorePalette[stage] || "bg-indigo-500";
}

function getActivityTone(type: string) {
  return activityPalette[type] || "bg-cyan-500";
}

function KpiCard({
  icon,
  value,
  label,
  trend,
  tone,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  trend: string;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold text-indigo-400">{trend}</span>
      </div>
      <div className="mt-6 text-[2.25rem] font-semibold tracking-tight text-gray-900">
        {value}
      </div>
      <div className="mt-2 text-sm text-gray-500">{label}</div>
    </div>
  );
}

function ScorePill({ value }: { value: number }) {
  const tone =
    value >= 85
      ? "bg-green-50 text-green-500"
      : value >= 78
        ? "bg-blue-50 text-blue-500"
        : value >= 70
          ? "bg-amber-50 text-amber-500"
          : "bg-red-50 text-red-500";

  return (
    <span className={`inline-flex min-w-10 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>
      <span className="mr-2 h-2 w-2 rounded-full bg-current" />
      {value}
    </span>
  );
}

function VerdictPill({ verdict, tone }: { verdict: string; tone: string }) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-500"
      : tone === "amber"
        ? "bg-amber-50 text-amber-500"
        : "bg-blue-50 text-blue-500";

  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${toneClass}`}>
      <span className="mr-2 h-2 w-2 rounded-full bg-current" />
      {verdict}
    </span>
  );
}

function FunnelChart({ funnelStages }: { funnelStages: Array<DashboardFunnelItem & { color: string }> }) {
  const normalizedStages = [
    { stage: "Resume", count: 0, color: funnelPalette.Resume },
    { stage: "MCQ", count: 0, color: funnelPalette.MCQ },
    { stage: "Video", count: 0, color: funnelPalette.Video },
    { stage: "Final", count: 0, color: funnelPalette.Final },
  ].map((fallbackStage) => {
    const matched = funnelStages.find((stage) => stage.stage === fallbackStage.stage);
    return matched || fallbackStage;
  });

  const centerX = 280;
  const stageHeight = 52;
  const finalHeight = 50;

  const widths = {
    resumeTop: 458,
    resumeBottom: 376,
    mcqBottom: 286,
    videoBottom: 194,
  };

  const y0 = 22;
  const y1 = y0 + stageHeight;
  const y2 = y1 + stageHeight;
  const y3 = y2 + stageHeight;
  const y4 = y3 + finalHeight;

  const left = (width: number) => centerX - width / 2;
  const right = (width: number) => centerX + width / 2;

  const polygons = [
    {
      points: `${left(widths.resumeTop)},${y0} ${right(widths.resumeTop)},${y0} ${right(widths.resumeBottom)},${y1} ${left(widths.resumeBottom)},${y1}`,
      color: normalizedStages[0].color,
      label: "Resume",
      labelX: right(widths.resumeTop) + 12,
      labelY: (y0 + y1) / 2 + 6,
    },
    {
      points: `${left(widths.resumeBottom)},${y1} ${right(widths.resumeBottom)},${y1} ${right(widths.mcqBottom)},${y2} ${left(widths.mcqBottom)},${y2}`,
      color: normalizedStages[1].color,
      label: "MCQ",
      labelX: right(widths.resumeBottom) + 12,
      labelY: (y1 + y2) / 2 + 6,
    },
    {
      points: `${left(widths.mcqBottom)},${y2} ${right(widths.mcqBottom)},${y2} ${right(widths.videoBottom)},${y3} ${left(widths.videoBottom)},${y3}`,
      color: normalizedStages[2].color,
      label: "Video",
      labelX: right(widths.mcqBottom) + 12,
      labelY: (y2 + y3) / 2 + 6,
    },
    {
      points: `${left(widths.videoBottom)},${y3} ${right(widths.videoBottom)},${y3} ${centerX},${y4}`,
      color: normalizedStages[3].color,
      label: "Final",
      labelX: right(widths.videoBottom) + 12,
      labelY: y3 + finalHeight / 2 + 6,
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-1 items-center justify-center px-6 pt-6">
        <svg
          viewBox="0 0 640 270"
          className="w-full max-w-155"
          role="img"
          aria-label="Candidate pipeline funnel chart"
        >
          {polygons.map((polygon) => (
            <polygon
              key={polygon.label}
              points={polygon.points}
              fill={polygon.color}
            />
          ))}

          {polygons.map((polygon) => (
            <text
              key={`${polygon.label}-label`}
              x={polygon.labelX}
              y={polygon.labelY}
              fill="var(--color-gray-400)"
              fontSize="16"
              fontWeight="500"
              textAnchor="start"
            >
              {polygon.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 pb-2 text-sm text-gray-500">
        {normalizedStages.map((stage) => (
          <div key={stage.stage} className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span>
              {stage.stage}: {stage.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPostingDropdownItem[]>([]);
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedJid, setSelectedJid] = useState("All Jobs");
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [funnelStages, setFunnelStages] = useState<Array<DashboardFunnelItem & { color: string }>>([]);
  const [stageScores, setStageScores] = useState<Array<DashboardStageScoreItem & { color: string }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<DashboardRecentActivity & { color: string }>>([]);
  const [candidates, setCandidates] = useState<
    Array<DashboardRecentCandidate & { initials: string; verdictTone: string }>
  >([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Fetch roles on mount
  useEffect(() => {
    jobPostingApi.getRoles().then(setRoles).catch(() => {});
  }, []);

  // When role changes, reset JID and fetch filtered postings
  useEffect(() => {
    setSelectedJid("All Jobs");
    const role = selectedRole !== "All Roles" ? selectedRole : undefined;
    jobPostingApi.getDropdown(role).then(setJobPostings).catch(() => {});
  }, [selectedRole]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsDashboardLoading(true);
        setDashboardError(null);

        const [summaryData, funnelData, stageScoreData, recentCandidatesData, recentActivityData] =
          await Promise.all([
            dashboardApi.getSummary(),
            dashboardApi.getFunnel(),
            dashboardApi.getStageScores(),
            dashboardApi.getRecentCandidates(),
            dashboardApi.getRecentActivity(),
          ]);

        if (cancelled) return;

        setSummary(summaryData);
        setFunnelStages(
          funnelData.map((item) => ({
            ...item,
            color: funnelPalette[item.stage] || "var(--color-cyan-500)",
          }))
        );
        setStageScores(
          stageScoreData.map((item) => ({
            ...item,
            color: getStageBarTone(item.stage),
          }))
        );
        setRecentActivity(
          recentActivityData.map((item) => ({
            ...item,
            color: getActivityTone(item.type),
          }))
        );
        setCandidates(
          recentCandidatesData.map((item) => ({
            ...item,
            initials: getInitials(item.name),
            verdictTone: getVerdictTone(item.verdict),
          }))
        );
      } catch (error) {
        if (!cancelled) {
          setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setIsDashboardLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HrShell activeItem="dashboard">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="app-page-title">
              Dashboard
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="app-page-subtitle mt-0">
                Overview of your hiring pipeline
              </p>
              <div className="relative">
                <select
                  className="min-w-44 appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-base text-gray-700 shadow-sm outline-none"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="All Roles">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  className="min-w-52 appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-base text-gray-700 shadow-sm outline-none"
                  value={selectedJid}
                  onChange={(e) => setSelectedJid(e.target.value)}
                >
                  <option value="All Jobs">All Jobs</option>
                  {jobPostings.map((jp) => (
                    <option key={jp.jid} value={jp.jid}>
                      {jp.jid} — {jp.job_title} ({jp.status})
                    </option>
                  ))}
                </select>
                <BriefcaseBusiness className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="pt-5 text-sm font-semibold tracking-[0.15em] text-gray-400">
            Last updated: {isDashboardLoading ? "loading..." : "just now"}
          </div>
        </div>

        {dashboardError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {dashboardError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5 text-indigo-500" />}
            value={String(summary.totalCandidates)}
            label="Total Candidates"
            trend="+12%"
            tone="bg-indigo-50"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            value={String(summary.avgScore)}
            label="Avg. Score"
            trend="+5pts"
            tone="bg-blue-50"
          />
          <KpiCard
            icon={<SearchCheck className="h-5 w-5 text-green-500" />}
            value={String(summary.shortlisted)}
            label="Shortlisted"
            trend="+4"
            tone="bg-green-50"
          />
          <KpiCard
            icon={<Clock3 className="h-5 w-5 text-amber-500" />}
            value={String(summary.pendingDecision)}
            label="Pending Decision"
            trend="+1"
            tone="bg-amber-50"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="flex min-h-130 flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Activity className="h-5 w-5 text-indigo-500" />
              Candidate Pipeline Funnel
            </div>
            <p className="mt-4 text-base text-gray-500">
              Shows where candidates drop off in the hiring process
            </p>

            <FunnelChart funnelStages={funnelStages} />
          </section>

          <section className="flex min-h-130 flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              Stage-wise Avg Score
            </div>
            <p className="mt-4 text-base text-gray-500">
              Where candidates are excelling or struggling
            </p>

            <div className="mt-8 flex flex-1 items-end justify-around gap-6 px-8">
              <div className="flex h-full flex-col justify-between text-sm text-gray-400">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {stageScores.map((stage) => (
                <div key={stage.stage} className="flex flex-1 flex-col items-center justify-end gap-4">
                  <div className="flex h-56 items-end">
                    <div
                      className={`w-10 rounded-t-xl ${stage.color}`}
                      style={{ height: `${stage.avgScore * 2}px` }}
                    />
                  </div>
                  <span className="text-base text-gray-500">{stage.stage}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Strong (85+)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                Good (78-84)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                Needs Review (&lt;78)
              </div>
            </div>

            <p className="mt-3 text-center text-sm text-gray-500">
              MCQ avg is lowest — consider reviewing question difficulty
            </p>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <Clock3 className="h-5 w-5 text-amber-500" />
              Recent Activity
            </div>

            <div className="mt-8 space-y-5">
              {recentActivity.map((item) => (
                <div key={item.text} className="flex gap-4">
                  <span className={`mt-2 h-3 w-3 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-base text-gray-700">{item.text}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Users className="h-5 w-5 text-indigo-500" />
                Recent Candidates
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-4 text-left">
                <thead>
                  <tr className="text-sm text-gray-900">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Resume</th>
                    <th className="pb-2 font-medium">MCQ</th>
                    <th className="pb-2 font-medium">Video</th>
                    <th className="pb-2 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.name} className="text-sm text-gray-700">
                      <td className="border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-500">
                            {candidate.initials}
                          </div>
                          <span className="font-medium text-gray-800">
                            {candidate.name}
                          </span>
                        </div>
                      </td>
                      <td className="border-t border-gray-100 pt-4 text-gray-500">
                        {candidate.role}
                      </td>
                      <td className="border-t border-gray-100 pt-4">
                        <ScorePill value={candidate.resume} />
                      </td>
                      <td className="border-t border-gray-100 pt-4">
                        <ScorePill value={candidate.mcq} />
                      </td>
                      <td className="border-t border-gray-100 pt-4">
                        <ScorePill value={candidate.video} />
                      </td>
                      <td className="border-t border-gray-100 pt-4">
                        <VerdictPill
                          verdict={candidate.verdict}
                          tone={candidate.verdictTone}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </HrShell>
  );
}
