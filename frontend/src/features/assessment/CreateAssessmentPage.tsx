import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  CircleX,
  ClipboardList,
  Code2,
  Sparkles,
  Video,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import HrShell from "../../components/layouts/HrShell";
import { jobTemplateApi, type ApiJobTemplate } from "@/services/api";

type FormData = {
  roleTitle: string;
  experienceLevel: string;
  skills: string[];
  timerMinutes: number;
  headcount: number;
};

type Question = {
  id: string;
  text: string;
  checked: boolean;
};

type Options = {
  generateAI: boolean;
  codingRound: boolean;
  aptitudeTest: boolean;
  aiInterview: boolean;
  manualInterview: boolean;
};

const cardClassName =
  "rounded-[18px] border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]";

// templateOptions removed — now fetched from API

const defaultQuestions: Question[] = [
  { id: "relocate", text: "Are you willing to relocate?", checked: true },
  {
    id: "auth",
    text: "Are you a US Citizen or authorized to work in the US?",
    checked: true,
  },
  { id: "visa", text: "What is your current visa status?", checked: true },
  { id: "salary", text: "What is your expected salary range?", checked: true },
  {
    id: "start-date",
    text: "Are you available to start within 30 days?",
    checked: true,
  },
];

const experienceLevels = ["Select level", "Junior", "Mid", "Senior", "Lead"];

const optionConfig: Array<{
  key: keyof Options;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}> = [
  {
    key: "generateAI",
    label: "Generate AI Questions",
    description: "Auto-generate role-specific questions",
    icon: BrainCircuit,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    key: "codingRound",
    label: "Include Coding Round",
    description: "Add hands-on coding challenges",
    icon: Code2,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    key: "aptitudeTest",
    label: "Include Aptitude Test",
    description: "Logical reasoning and problem-solving",
    icon: Zap,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
  },
  {
    key: "aiInterview",
    label: "AI Video Interview",
    description: "AI-analyzed video responses",
    icon: Video,
    iconColor: "text-green-600",
    iconBg: "bg-green-50",
  },
  {
    key: "manualInterview",
    label: "Manual Video Interview",
    description: "HR team conducts live interviews",
    icon: Video,
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
  },
];

function TemplatePicker({
  templates,
  selected,
  onSelect,
}: {
  templates: ApiJobTemplate[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedTemplate = templates.find((t) => t.template_key === selected);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-[156px] items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-[14px] text-gray-700 transition-colors hover:bg-white"
      >
        {selectedTemplate?.job_title || "Choose a template"}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-[14px] border border-gray-200 bg-white shadow-lg">
          {templates.map((t) => (
            <button
              key={t.template_key}
              type="button"
              onClick={() => {
                onSelect(t.template_key);
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 transition-colors hover:bg-violet-50 hover:text-violet-700 first:rounded-t-xl last:rounded-b-xl"
            >
              {t.job_title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssessmentDetails({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) {
      return;
    }

    setFormData((current) => ({
      ...current,
      skills: current.skills.includes(trimmed)
        ? current.skills
        : [...current.skills, trimmed],
    }));
    setSkillInput("");
  };

  return (
    <div className={`${cardClassName} h-fit pb-4`}>
      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-violet-500" />
        <h2 className="app-card-title">Assessment Details</h2>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="app-field-label mb-2 block">
            Job Title
          </span>
          <input
            value={formData.roleTitle}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                roleTitle: event.target.value,
              }))
            }
            placeholder="e.g. Senior Data Scientist"
            className="h-10 w-full rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
          />
        </label>

        <label className="block">
          <span className="app-field-label mb-2 block">
            Experience Level
          </span>
          <div className="relative max-w-[108px]">
            <select
              value={formData.experienceLevel}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  experienceLevel: event.target.value,
                }))
              }
              className="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
            >
              {experienceLevels.map((level) => (
                <option key={level} value={level === "Select level" ? "" : level}>
                  {level}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </label>

        <div>
          <span className="app-field-label mb-2 block">
            Skills Required
          </span>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill (e.g. Python)"
              className="h-10 flex-1 rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <CirclePlus className="h-4 w-4" />
            </button>
          </div>

          {formData.skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-violet-50 px-2.5 py-1 text-[14px] font-medium text-violet-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex gap-4">
          <label className="block">
            <span className="app-field-label mb-2 block">
              Assessment Timer (minutes)
            </span>
            <input
              type="number"
              min={5}
              max={180}
              value={formData.timerMinutes}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  timerMinutes: Number(event.target.value) || 30,
                }))
              }
              className="h-10 w-32 rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
            />
          </label>

          <label className="block">
            <span className="app-field-label mb-2 block">
              Positions to Fill
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={formData.headcount}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  headcount: Number(event.target.value) || 1,
                }))
              }
              className="h-10 w-32 rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function PreScreeningQuestions({
  questions,
  setQuestions,
}: {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}) {
  const [adding, setAdding] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  const toggleQuestion = (id: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? { ...question, checked: !question.checked }
          : question,
      ),
    );
  };

  const addQuestion = () => {
    const trimmed = customQuestion.trim();
    if (!trimmed) {
      return;
    }

    setQuestions((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        text: trimmed,
        checked: true,
      },
    ]);
    setCustomQuestion("");
    setAdding(false);
  };

  return (
    <div className={cardClassName}>
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <h2 className="app-card-title">
          Pre-Screening Questions
        </h2>
      </div>
      <p className="app-meta-text">
        Select questions to include in the assessment
      </p>

      <div className="mt-8 space-y-3">
        {questions.map((question) => (
          <button
            key={question.id}
            type="button"
            onClick={() => toggleQuestion(question.id)}
            className="flex w-full items-center gap-3 rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-gray-300"
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-md text-white ${
                question.checked ? "bg-violet-500" : "bg-gray-300"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-[16px] font-medium text-gray-700">
              {question.text}
            </span>
          </button>
        ))}
      </div>

      {adding ? (
        <div className="mt-4 flex gap-2">
          <input
            value={customQuestion}
            onChange={(event) => setCustomQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addQuestion();
              }
            }}
            autoFocus
            placeholder="Add a custom question"
            className="flex-1 rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-[10px] bg-violet-600 px-4 py-2.5 text-[14px] text-white transition-colors hover:bg-violet-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setCustomQuestion("");
            }}
            className="rounded-[10px] border border-gray-200 px-4 py-2.5 text-[14px] text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-2 text-[14px] font-medium text-violet-600 transition-colors hover:text-violet-700"
        >
          <CirclePlus className="h-4 w-4" />
          Add Custom Question
        </button>
      )}
    </div>
  );
}

function AssessmentSummary({
  formData,
  questions,
  options,
}: {
  formData: FormData;
  questions: Question[];
  options: Options;
}) {
  const enabledComponents = [
    { label: "AI-Generated Questions", enabled: options.generateAI },
    { label: "Coding Round", enabled: options.codingRound },
    { label: "Aptitude Test", enabled: options.aptitudeTest },
    { label: "AI Video Interview", enabled: options.aiInterview },
  ];

  const selectedQuestionCount = questions.filter((question) => question.checked).length;

  return (
    <div className={cardClassName}>
      <h2 className="app-card-title mb-6">
        Assessment Summary
      </h2>

      <div className="mb-5">
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Job Title
        </p>
        <p className="app-field-label text-gray-900">
          {formData.roleTitle || "Not specified"}
        </p>
      </div>

      <div className="mb-5">
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Experience
        </p>
        <p className="app-field-label text-gray-900">
          {formData.experienceLevel || "Not selected"}
        </p>
      </div>

      <div className="mb-5">
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Skills
        </p>
        {formData.skills.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[14px] font-medium text-violet-700"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="app-meta-text">No skills added</p>
        )}
      </div>

      <hr className="my-5 border-gray-200" />

      <div className="mb-5">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Components
        </p>
        <div className="space-y-2.5">
          {enabledComponents.map((component) => (
            <div key={component.label} className="flex items-center gap-2">
              {component.enabled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <CircleX className="h-4 w-4 text-orange-400" />
              )}
              <span className="text-[14px] font-medium leading-[1.4] text-gray-900">{component.label}</span>
            </div>
          ))}
        </div>
      </div>

      <hr className="my-5 border-gray-200" />

      <div>
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Pre-Screening
        </p>
        <p className="app-field-label text-gray-900">
          {selectedQuestionCount} questions selected
        </p>
      </div>
    </div>
  );
}

function AssessmentOptions({
  options,
  setOptions,
  onSubmit,
  submitting,
  editMode,
}: {
  options: Options;
  setOptions: React.Dispatch<React.SetStateAction<Options>>;
  onSubmit: () => void;
  submitting: boolean;
  editMode: boolean;
}) {
  const toggleOption = (key: keyof Options) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className={cardClassName}>
      <div className="mb-4 flex items-center gap-2">
        <WandSparkles className="h-4 w-4 text-amber-500" />
        <h2 className="app-card-title">Assessment Options</h2>
      </div>

      <div className="space-y-3">
        {optionConfig.map((option) => {
          const Icon = option.icon;
          const enabled = options[option.key];

          return (
            <div
              key={option.key}
              className="flex items-center rounded-[12px] border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleOption(option.key)}
                  className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors ${
                    enabled
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-gray-300 bg-white text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </button>

                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${option.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${option.iconColor}`} />
                </div>

                <div>
                  <p className="text-[16px] font-medium text-gray-900">{option.label}</p>
                  <p className="text-[14px] text-gray-900">{option.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-violet-500 to-indigo-600 px-6 text-[14px] font-medium text-white shadow-lg shadow-violet-200 transition-colors hover:opacity-95 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {submitting ? "Saving…" : editMode ? "Update Template" : "Generate Assessment"}
      </button>
    </div>
  );
}

export default function CreateAssessmentPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ApiJobTemplate[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    roleTitle: "",
    experienceLevel: "",
    skills: [],
    timerMinutes: 30,
    headcount: 1,
  });
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [options, setOptions] = useState<Options>({
    generateAI: true,
    codingRound: true,
    aptitudeTest: false,
    aiInterview: true,
    manualInterview: false,
  });

  // Fetch templates on mount + handle URL params
  useEffect(() => {
    jobTemplateApi.getAll().then((data) => {
      setTemplates(data);
      const params = new URLSearchParams(window.location.search);
      const editKey = params.get("edit");
      const templateKey = params.get("template_key");
      if (editKey) {
        applyTemplate(editKey, data);
        setEditMode(true);
      } else if (templateKey) {
        applyTemplate(templateKey, data);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }).catch(() => {});
  }, []);

  const applyTemplate = (key: string, list: ApiJobTemplate[]) => {
    const t = list.find((tpl) => tpl.template_key === key);
    if (!t) return;
    setSelectedTemplateKey(key);
    setFormData({
      roleTitle: t.job_title || "",
      experienceLevel: "",
      skills: t.required_skills
        ? t.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      timerMinutes: t.time_limit_minutes ?? 30,
      headcount: Number(t.number_of_candidates) || 1,
    });
    if (t.survey_question_1) {
      setQuestions((prev) => {
        const exists = prev.some((q) => q.text === t.survey_question_1);
        if (exists) return prev;
        return [
          ...prev,
          { id: `tpl-${Date.now()}`, text: t.survey_question_1!, checked: true },
        ];
      });
    }
  };

  const handleTemplateSelect = (key: string) => {
    setEditMode(false);
    applyTemplate(key, templates);
  };

  const handleSubmit = async () => {
    if (!formData.roleTitle.trim()) {
      alert("Job Title is required");
      return;
    }
    setSaving(true);
    try {
      const selectedQ = questions.filter((q) => q.checked);
      if (editMode && selectedTemplateKey) {
        await jobTemplateApi.update(selectedTemplateKey, {
          job_title: formData.roleTitle,
          required_skills: formData.skills.join(", "),
          number_of_candidates: String(formData.headcount),
          survey_question_1: selectedQ[0]?.text || null,
          survey_q1_expected_answer: null,
          time_limit_minutes: formData.timerMinutes,
        } as Partial<ApiJobTemplate>);
        alert("Template updated successfully!");
        navigate("/hr/templates");
      } else {
        const result = await jobTemplateApi.createAssessment({
          job_title: formData.roleTitle,
          template_key: selectedTemplateKey || undefined,
          required_skills: formData.skills.join(", "),
          survey_question_1: selectedQ[0]?.text || undefined,
          time_limit_minutes: formData.timerMinutes,
          headcount: formData.headcount,
        });
        alert(`Assessment created successfully!\n\nJob ID: ${result.jid}\nRole: ${formData.roleTitle}\nPositions: ${formData.headcount}`);
        navigate("/hr/dashboard");
      }
    } catch (err: unknown) {
      alert(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrShell activeItem="create-assessment">
      <div className="w-full py-1">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="app-page-title">{editMode ? "Edit Template" : "Create Assessment"}</h1>
            <p className="app-page-subtitle">
              {editMode
                ? "Update template details and timer settings"
                : "Generate AI-powered screening assessments for candidates"}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2">
            <span className="text-[14px] font-semibold text-gray-700">Select Template</span>
            <TemplatePicker
              templates={templates}
              selected={selectedTemplateKey}
              onSelect={handleTemplateSelect}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <AssessmentDetails formData={formData} setFormData={setFormData} />
            <PreScreeningQuestions
              questions={questions}
              setQuestions={setQuestions}
            />
          </div>

          <div className="space-y-3">
            <AssessmentSummary
              formData={formData}
              questions={questions}
              options={options}
            />
            <AssessmentOptions
              options={options}
              setOptions={setOptions}
              onSubmit={handleSubmit}
              submitting={saving}
              editMode={editMode}
            />

          </div>
        </div>
      </div>
    </HrShell>
  );
}
