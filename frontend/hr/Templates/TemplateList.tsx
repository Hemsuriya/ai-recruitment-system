
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Plus,
  Bell,
  Search,
  Copy,
  Pencil,
  Play,
} from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active = false }: any) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium ${
      active
        ? "bg-indigo-50 text-indigo-600"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </div>
);

const Tag = ({ children }: any) => (
  <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
    {children}
  </span>
);

const Card = ({ title, tags, meta, badge }: any) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
        <FileText className="w-5 h-5 text-indigo-600" />
      </div>
      <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
        {badge}
      </span>
    </div>

    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>

    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map((t: string) => (
        <Tag key={t}>{t}</Tag>
      ))}
    </div>

    <div className="text-xs text-gray-500 space-y-1 mb-4">
      {meta.map((m: string) => (
        <div key={m}>{m}</div>
      ))}
    </div>

    <div className="flex gap-2">
      <button className="flex-1 flex items-center justify-center gap-1 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
        <Pencil className="w-4 h-4" /> Edit
      </button>
      <button className="flex-1 flex items-center justify-center gap-1 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
        <Copy className="w-4 h-4" /> Duplicate
      </button>
      <button className="flex-1 flex items-center justify-center gap-1 py-2 text-sm rounded-lg bg-indigo-100 text-indigo-600">
        <Play className="w-4 h-4" /> Use
      </button>
    </div>
  </div>
);

export default function TemplatesPage() 
{
  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
              ✦
            </div>
            <span className="font-semibold">AI Candidate Screening</span>
          </div>

          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem icon={Users} label="Candidates" />
            <SidebarItem icon={FileText} label="Create Assessment" />
            <SidebarItem icon={FileText} label="Templates" active />
            <SidebarItem icon={Settings} label="Settings" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">
            HR
          </div>
          <div>
            <div className="text-sm font-medium">HR Admin</div>
            <div className="text-xs text-gray-500">admin@hireai.com</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-2 w-full max-w-md bg-gray-100 px-3 py-2 rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Search candidates, assessments..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-500" />
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">
              HR
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Job Templates</h1>
              <p className="text-sm text-gray-500">
                Reusable hiring templates for quick assessment setup
              </p>
            </div>

            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow">
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}
