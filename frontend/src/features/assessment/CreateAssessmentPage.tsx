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
import { useNavigate, useLocation } from "react-router-dom";
import HrShell from "../../components/layouts/HrShell";
import {
  jobTemplateApi,
  assessmentApi,
  settingsApi,
  type ApiDropdownTemplate,
  type AutopopulateResponse,
  type Department,
  type HrMember,
} from "@/services/api";

type FormData = {
  roleTitle: string;
  experienceLevel: string;
  skills: string[];
  timerMinutes: number;
  headcount: number;
  closesAt: string;
  department: string;
  hiringManager: string;
  interviewer: string;
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
  templates: ApiDropdownTemplate[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedTemplate = templates.find((t) => t.template_code === selected);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-39 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-[14px] text-gray-700 transition-colors hover:bg-white"
      >
        {selectedTemplate?.template_name || "Choose a template"}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-[14px] border border-gray-200 bg-white shadow-lg">
          {templates.map((t) => (
            <button
              key={t.template_code}
              type="button"
              onClick={() => {
                onSelect(t.template_code);
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 transition-colors hover:bg-violet-50 hover:text-violet-700 first:rounded-t-xl last:rounded-b-xl"
            >
              {t.template_name}
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
  departments,
  members,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  departments: Department[];
  members: HrMember[];
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
          <div className="relative max-w-27">
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
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[14px] font-medium text-violet-700"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        skills: current.skills.filter((s) => s !== skill),
                      }))
                    }
                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-violet-400 hover:bg-violet-200 hover:text-violet-700 transition-colors"
                  >
                    <CircleX className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="app-field-label mb-2 block">
              Department / Team
            </span>
            <div className="relative">
              <select
                value={formData.department}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    department: event.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </label>

          <label className="block">
            <span className="app-field-label mb-2 block">
              Hiring Manager
            </span>
            <div className="relative">
              <select
                value={formData.hiringManager}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    hiringManager: event.target.value,
                  }))
                }
                className="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select manager</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
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

          <label className="block">
            <span className="app-field-label mb-2 block">
              Closing Date
            </span>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={formData.closesAt}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  closesAt: event.target.value,
                }))
              }
              className="h-10 w-44 rounded-[10px] border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
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
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-gray-300"
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
  interviewer,
  onInterviewerChange,
  members,
}: {
  options: Options;
  setOptions: React.Dispatch<React.SetStateAction<Options>>;
  onSubmit: () => void;
  submitting: boolean;
  editMode: boolean;
  interviewer: string;
  onInterviewerChange: (value: string) => void;
  members: HrMember[];
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
              className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleOption(option.key)}
                  className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
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

      {options.manualInterview && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <label className="block">
            <span className="app-field-label mb-2 block">
              Assign Interviewer
            </span>
            <div className="relative">
              <select
                value={interviewer}
                onChange={(event) => onInterviewerChange(event.target.value)}
                className="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-4 text-[14px] text-gray-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select interviewer</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </label>
          <p className="mt-1.5 text-[12px] text-gray-400">
            Person responsible for conducting the manual video interview
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-linear-to-r from-violet-500 to-indigo-600 px-6 text-[14px] font-medium text-white shadow-lg shadow-violet-200 transition-colors hover:opacity-95 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {submitting ? "Saving…" : editMode ? "Update Template" : "Generate Assessment"}
      </button>
    </div>
  );
}

export default function CreateAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [templates, setTemplates] = useState<ApiDropdownTemplate[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    roleTitle: "",
    experienceLevel: "",
    skills: [],
    timerMinutes: 30,
    headcount: 1,
    closesAt: "",
    department: "",
    hiringManager: "",
    interviewer: "",
  });
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [options, setOptions] = useState<Options>({
    generateAI: true,
    codingRound: true,
    aptitudeTest: false,
    aiInterview: true,
    manualInterview: false,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<HrMember[]>([]);

  useEffect(() => {
    settingsApi.getDepartments().then(setDepartments).catch(() => {});
    settingsApi.getMembers().then(setMembers).catch(() => {});
  }, []);

  // Fetch templates on mount + handle URL params (re-runs on navigation)
useEffect(() => {
  const loadTemplates = async () => {
    try {
      const data = await jobTemplateApi.getDropdownTemplates();
      setTemplates(data);

      const params = new URLSearchParams(location.search);
      const templateCode = params.get("template_code") || params.get("template_key");
      const editKey = params.get("edit");

      if (editKey) {
        await fetchAutopopulatedTemplate(editKey);
        setEditMode(true);
      } else if (templateCode) {
        await fetchAutopopulatedTemplate(templateCode);
      }

      window.history.replaceState({}, "", window.location.pathname);
    } catch (error) {
      console.error("Failed to fetch dropdown templates", error);
    }
  };

  loadTemplates();
}, [location.search]);

const applyAutopopulateData = (data: AutopopulateResponse) => {
  setFormData({
    roleTitle: data.role_title || "",
    experienceLevel: data.experience_level || "",
    skills: data.skills_required || [],
    timerMinutes: 30,
    headcount: 1,
    closesAt: "",
    department: "",
    hiringManager: "",
    interviewer: "",
  });

  const incomingQuestions: Question[] =
    (data.pre_screening_questions || []).map((text, index) => ({
      id: `api-${index}-${Date.now()}`,
      text,
      checked: true,
    }));

  setQuestions(
    incomingQuestions.length > 0 ? incomingQuestions : defaultQuestions
  );

  setOptions({
    generateAI: data.assessment_options?.include_ai_questions ?? true,
    codingRound: data.assessment_options?.include_coding_round ?? false,
    aptitudeTest: data.assessment_options?.include_aptitude_test ?? false,
    aiInterview: data.assessment_options?.include_ai_video_interview ?? false,
    manualInterview:
      data.assessment_options?.include_manual_video_interview ?? false,
  });
};

const fetchAutopopulatedTemplate = async (templateCode: string) => {
  setLoadingTemplate(true);

  try {
    const data = await jobTemplateApi.autopopulate(templateCode);
    applyAutopopulateData(data);
    setSelectedTemplateKey(templateCode);
    setEditMode(false);
  } catch (error) {
    alert(
      `Failed to load template: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    setLoadingTemplate(false);
  }
};

  const handleTemplateSelect = async (key: string) => {
  await fetchAutopopulatedTemplate(key);
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
        });
        alert("Template updated successfully!");
        navigate("/hr/templates");
      } else {
        const result = await assessmentApi.create({
          role_title: formData.roleTitle,
          experience_level: formData.experienceLevel || "Mid",
          skills: formData.skills,
          template_key: selectedTemplateKey || undefined,
          questions: selectedQ.map((q, i) => ({
            question_text: q.text,
            is_default: !q.id.startsWith("custom-"),
            is_selected: true,
            sort_order: i,
          })),
          options: {
            generate_ai_questions: options.generateAI,
            include_coding: options.codingRound,
            include_aptitude: options.aptitudeTest,
            include_ai_interview: options.aiInterview,
            include_manual_interview: options.manualInterview,
          },
          time_limits: {
            mcq_time_limit: formData.timerMinutes,
            video_time_limit: 15,
            coding_time_limit: 45,
          },
        });
        alert(`Assessment created & pipeline triggered!\n\nJob ID: ${result.jid}\nRole: ${formData.roleTitle}\n\nThe AI pipeline is now screening resumes and generating MCQ questions.`);
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
            {loadingTemplate ? (
  <p className="mt-2 text-[13px] text-violet-600">
    Autopopulating from AI workflow...
  </p>
) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <AssessmentDetails formData={formData} setFormData={setFormData} departments={departments} members={members} />
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
              interviewer={formData.interviewer}
              onInterviewerChange={(value) =>
                setFormData((current) => ({ ...current, interviewer: value }))
              }
              members={members}
            />

          </div>
        </div>
      </div>
    </HrShell>
  );
}
