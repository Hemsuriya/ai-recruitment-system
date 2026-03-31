import { useState, useEffect } from "react";
import {
  Calendar,
  ChartColumn,
  FileText,
  Plus,
  Copy,
  Pencil,
  Play,
  Loader2,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import HrShell from "../../../components/layouts/HrShell";
import { jobTemplateApi, type ApiJobTemplate } from "@/services/api";

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-md bg-gray-100 px-2.5 py-1.5 text-[13px] font-medium text-gray-500">
    {children}
  </span>
);

const accentStyles: Record<string, { iconWrap: string; icon: string; badge: string }> = {
  indigo: { iconWrap: "bg-indigo-50", icon: "text-indigo-600", badge: "bg-indigo-50 text-indigo-500" },
  cyan:   { iconWrap: "bg-cyan-50",   icon: "text-cyan-500",   badge: "bg-cyan-50 text-cyan-500" },
  orange: { iconWrap: "bg-orange-50", icon: "text-orange-500", badge: "bg-orange-50 text-orange-500" },
};

const accentCycle = ["indigo", "cyan", "orange"];

function Card({
  template,
  accent,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: ApiJobTemplate;
  accent: string;
  onUse: (t: ApiJobTemplate) => void;
  onEdit: (t: ApiJobTemplate) => void;
  onDuplicate: (t: ApiJobTemplate) => void;
  onDelete: (t: ApiJobTemplate) => void;
}) {
  const a = accentStyles[accent] ?? accentStyles.indigo;
  const skills = template.required_skills
    ? template.required_skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];
  const badge = template.survey_question_1 ? "MCQ + Survey" : "MCQ";
  const created = new Date(template.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-87.5 flex-col rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_1px_4px_rgba(16,24,40,0.06)]">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.iconWrap}`}>
          <FileText className={`h-5 w-5 ${a.icon}`} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.badge}`}>
            {badge}
          </span>
          <button
            onClick={() => onDelete(template)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete template"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h3 className="mb-3 text-[17px] font-semibold text-gray-900">
        {template.job_title}
      </h3>

      <div className="mb-5 flex flex-wrap gap-2">
        {skills.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
        {skills.length === 0 && <Tag>General</Tag>}
      </div>

      <div className="mb-4 space-y-2 text-[14px] text-gray-500">
        <div className="flex items-center gap-2">
          <ChartColumn className="h-4 w-4 text-gray-400" />
          <span>{template.number_of_candidates || "N/A"} candidates</span>
          <span className="ml-2">·</span>
          <span>{template.time_limit_minutes ?? 30} min</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>Created {created}</span>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 pt-3">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(template)}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => onDuplicate(template)}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button
            onClick={() => onUse(template)}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-100 py-2 text-sm font-medium text-indigo-600"
          >
            <Play className="h-4 w-4" /> Use
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ApiJobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobTemplateApi
      .getAll()
      .then(setTemplates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUse = (t: ApiJobTemplate) => {
    navigate(`/hr/create-assessment?template_key=${encodeURIComponent(t.template_key)}`);
  };

  const handleEdit = (t: ApiJobTemplate) => {
    navigate(`/hr/create-assessment?edit=${encodeURIComponent(t.template_key)}`);
  };

  const handleDuplicate = async (t: ApiJobTemplate) => {
    try {
      await jobTemplateApi.duplicate(t.template_key);
      const updated = await jobTemplateApi.getAll();
      setTemplates(updated);
    } catch (err) {
      alert("Failed to duplicate template");
    }
  };

  const handleDelete = async (t: ApiJobTemplate) => {
    if (!window.confirm(`Delete "${t.job_title}"? This cannot be undone.`)) return;
    try {
      await jobTemplateApi.remove(t.template_key);
      setTemplates((prev) => prev.filter((x) => x.template_key !== t.template_key));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete template");
    }
  };

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

        {loading && (
          <div className="flex items-center justify-center py-24 gap-2">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading templates…</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p style={{ color: "var(--score-low)", fontSize: 14, fontWeight: 600 }}>Failed to load templates</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{error}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FileText size={32} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No templates found. Create your first one!</p>
          </div>
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((t, i) => (
              <Card
                key={t.id}
                template={t}
                accent={accentCycle[i % accentCycle.length]}
                onUse={handleUse}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </HrShell>
  );
}
