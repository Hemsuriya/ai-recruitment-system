
import {
  Calendar,
  ChartColumn,
  FileText,
  Plus,
  Copy,
  Pencil,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import HrShell from "../../src/components/layouts/HrShell";

const Tag = ({ children }: any) => (
  <span className="rounded-md bg-gray-100 px-2.5 py-1.5 text-[13px] font-medium text-gray-500">
    {children}
  </span>
);

const Card = ({ title, tags, meta, badge }: any) => (
  <div className="flex min-h-[350px] flex-col rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_1px_4px_rgba(16,24,40,0.06)]">
    <div className="mb-4 flex items-start justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
        <FileText className="h-5 w-5 text-indigo-600" />
      </div>
      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-500">
        {badge}
      </span>
    </div>

    <h3 className="mb-3 text-[17px] font-semibold text-gray-900">{title}</h3>

    <div className="mb-5 flex flex-wrap gap-2">
      {tags.map((t: string) => (
        <Tag key={t}>{t}</Tag>
      ))}
    </div>

    <div className="mb-4 space-y-2 text-[14px] text-gray-500">
      <div className="flex items-center gap-2">
        <ChartColumn className="h-4 w-4 text-gray-400" />
        <span>{meta[0]}</span>
        <ChartColumn className="ml-4 h-4 w-4 text-gray-400" />
        <span>{meta[1]}</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span>{meta[2]}</span>
      </div>
    </div>

    <div className="mt-auto border-t border-gray-100 pt-3">
      <div className="flex gap-2">
      <button className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">
        <Pencil className="h-4 w-4" /> Edit
      </button>
      <button className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">
        <Copy className="h-4 w-4" /> Duplicate
      </button>
      <button className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-100 py-2 text-sm font-medium text-indigo-600">
        <Play className="h-4 w-4" /> Use
      </button>
      </div>
    </div>
  </div>
);

export default function TemplatesPage() 
{
  const navigate = useNavigate();

  return (
    <HrShell activeItem="templates">
          <div className="flex min-h-full flex-col">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="app-page-title">Job Templates</h1>
              <p className="app-page-subtitle">
                Reusable hiring templates for quick assessment setup
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/hr/create-assessment")}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_18px_rgba(124,108,255,0.18)]"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card
              title="Senior Frontend Engineer"
              tags={["React", "TypeScript", "CSS", "Testing"]}
              badge="MCQ + Coding + Video"
              meta={["25 questions", "Used 12x", "Created Feb 14"]}
            />

            <Card
              title="Data Scientist"
              tags={["Python", "SQL", "Machine Learning", "Statistics"]}
              badge="MCQ + Coding + Video"
              meta={["30 questions", "Used 8x", "Created Feb 9"]}
            />

            <Card
              title="Backend Engineer"
              tags={["Go", "PostgreSQL", "Docker", "REST APIs"]}
              badge="MCQ + Coding"
              meta={["20 questions", "Used 15x", "Created Feb 19"]}
            />

            <Card
              title="ML Engineer"
              tags={["Python", "PyTorch", "MLOps", "Cloud"]}
              badge="MCQ + Coding + Video"
              meta={["28 questions", "Used 6x", "Created Jan 24"]}
            />

            <Card
              title="Product Designer"
              tags={["Figma", "User Research", "Prototyping", "Design Systems"]}
              badge="MCQ + Video"
              meta={["15 questions", "Used 10x", "Created Feb 4"]}
            />

            <Card
              title="DevOps Engineer"
              tags={["AWS", "Terraform", "Kubernetes", "CI/CD"]}
              badge="MCQ + Coding"
              meta={["22 questions", "Used 4x", "Created Feb 17"]}
            />
          </div>
          </div>
    </HrShell>
  );
}
