import type { ReactNode } from "react";
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

const roles = [
  "ML Engineer",
  "Senior Frontend Engineer",
  "Product Designer",
  "Data Scientist",
  "Backend Engineer",
];

const mockJobPostings = [
  { jid: "JOB-2026-001", job_title: "ML Engineer", status: "open", opens_at: "2026-03-01" },
  { jid: "JOB-2026-002", job_title: "Senior Frontend Engineer", status: "open", opens_at: "2026-03-10" },
  { jid: "JOB-2026-003", job_title: "Backend Engineer", status: "open", opens_at: "2026-03-15" },
  { jid: "JOB-2026-004", job_title: "Data Scientist", status: "closed", opens_at: "2026-02-01" },
  { jid: "JOB-2026-005", job_title: "Product Designer", status: "open", opens_at: "2026-03-20" },
];

const funnelStages = [
  { label: "Resume", value: 12, color: "var(--color-blue-500)" },
  { label: "MCQ", value: 10, color: "var(--color-amber-500)" },
  { label: "Video", value: 8, color: "var(--color-violet-500)" },
  { label: "Final", value: 6, color: "var(--color-green-500)" },
];

const stageScores = [
  { label: "Resume", value: 89, color: "bg-emerald-500" },
  { label: "MCQ", value: 73, color: "bg-amber-500" },
  { label: "Video", value: 78, color: "bg-indigo-500" },
  { label: "Final", value: 81, color: "bg-indigo-500" },
];

const recentActivity = [
  { color: "bg-blue-500", text: "John Doe completed MCQ assessment", time: "2 min ago" },
  { color: "bg-green-500", text: "Jane Smith passed resume screening", time: "15 min ago" },
  { color: "bg-indigo-500", text: "Alex Johnson submitted video interview", time: "1 hour ago" },
  { color: "bg-green-600", text: "Sarah Chen received Strong Hire verdict", time: "2 hours ago" },
  { color: "bg-red-500", text: "David Park failed MCQ threshold", time: "3 hours ago" },
  { color: "bg-cyan-500", text: "New application from Tom Brown", time: "4 hours ago" },
];

const candidates = [
  {
    initials: "JD",
    name: "John Doe",
    role: "Senior Frontend Engineer",
    resume: 92,
    mcq: 88,
    video: 85,
    verdict: "Strong Hire",
    verdictTone: "green",
  },
  {
    initials: "JS",
    name: "Jane Smith",
    role: "Data Scientist",
    resume: 88,
    mcq: 91,
    video: 78,
    verdict: "Strong Hire",
    verdictTone: "green",
  },
  {
    initials: "AJ",
    name: "Alex Johnson",
    role: "Backend Engineer",
    resume: 75,
    mcq: 82,
    video: 70,
    verdict: "Hire",
    verdictTone: "blue",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "ML Engineer",
    resume: 95,
    mcq: 93,
    video: 90,
    verdict: "Strong Hire",
    verdictTone: "green",
  },
  {
    initials: "MW",
    name: "Mike Williams",
    role: "Senior Frontend Engineer",
    resume: 65,
    mcq: 58,
    video: 62,
    verdict: "Maybe",
    verdictTone: "amber",
  },
  {
    initials: "ED",
    name: "Emily Davis",
    role: "Product Designer",
    resume: 82,
    mcq: 79,
    video: 88,
    verdict: "Hire",
    verdictTone: "blue",
  },
];

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

function FunnelChart() {
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
      color: funnelStages[0].color,
      label: "Resume",
      labelX: right(widths.resumeTop) + 12,
      labelY: (y0 + y1) / 2 + 6,
    },
    {
      points: `${left(widths.resumeBottom)},${y1} ${right(widths.resumeBottom)},${y1} ${right(widths.mcqBottom)},${y2} ${left(widths.mcqBottom)},${y2}`,
      color: funnelStages[1].color,
      label: "MCQ",
      labelX: right(widths.resumeBottom) + 12,
      labelY: (y1 + y2) / 2 + 6,
    },
    {
      points: `${left(widths.mcqBottom)},${y2} ${right(widths.mcqBottom)},${y2} ${right(widths.videoBottom)},${y3} ${left(widths.videoBottom)},${y3}`,
      color: funnelStages[2].color,
      label: "Video",
      labelX: right(widths.mcqBottom) + 12,
      labelY: (y2 + y3) / 2 + 6,
    },
    {
      points: `${left(widths.videoBottom)},${y3} ${right(widths.videoBottom)},${y3} ${centerX},${y4}`,
      color: funnelStages[3].color,
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
        {funnelStages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span>
              {stage.label}: {stage.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
                <select className="min-w-52 appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-base text-gray-700 shadow-sm outline-none">
                  {mockJobPostings.map((jp) => (
                    <option key={jp.jid} value={jp.jid}>
                      {jp.jid} — {jp.job_title} ({jp.status})
                    </option>
                  ))}
                </select>
                <BriefcaseBusiness className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <select className="min-w-44 appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-base text-gray-700 shadow-sm outline-none">
                  {roles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-5 text-sm font-semibold tracking-[0.15em] text-gray-400">
            Last updated: just now
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5 text-indigo-500" />}
            value="12"
            label="Total Candidates"
            trend="+12%"
            tone="bg-indigo-50"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            value="69"
            label="Avg. Score"
            trend="+5pts"
            tone="bg-blue-50"
          />
          <KpiCard
            icon={<SearchCheck className="h-5 w-5 text-green-500" />}
            value="7"
            label="Shortlisted"
            trend="+4"
            tone="bg-green-50"
          />
          <KpiCard
            icon={<Clock3 className="h-5 w-5 text-amber-500" />}
            value="3"
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

            <FunnelChart />
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
                <div key={stage.label} className="flex flex-1 flex-col items-center justify-end gap-4">
                  <div className="flex h-56 items-end">
                    <div
                      className={`w-10 rounded-t-xl ${stage.color}`}
                      style={{ height: `${stage.value * 2}px` }}
                    />
                  </div>
                  <span className="text-base text-gray-500">{stage.label}</span>
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
                    <p className="mt-1 text-sm text-gray-400">{item.time}</p>
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
