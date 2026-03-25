import type { ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type HrShellProps = {
  activeItem: "dashboard" | "candidates" | "templates" | "create-assessment" | "settings";
  children: ReactNode;
};

type SidebarItemProps = {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium ${
        active
          ? "bg-violet-50 text-violet-600"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {active ? <ChevronRight className="h-4 w-4" /> : null}
    </button>
  );
}

export default function HrShell({ activeItem, children }: HrShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex w-[20vw] min-w-60 max-w-[320px] flex-col justify-between border-r border-gray-200 bg-white px-4 py-4">
        <div>
          <div className="mb-6 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white shadow-sm">
              ✦
            </div>
            <span className="text-[15px] font-semibold text-gray-900">
              Hire<span className="text-violet-500">AI</span>
            </span>
          </div>

          <div className="space-y-1">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeItem === "dashboard"}
              onClick={() => navigate("/hr/dashboard")}
            />
            <SidebarItem
              icon={Users}
              label="Candidates"
              active={activeItem === "candidates"}
              onClick={() => navigate("/hr/candidates")}
            />
            <SidebarItem
              icon={FileText}
              label="Create Assessment"
              active={activeItem === "create-assessment"}
              onClick={() => navigate("/hr/create-assessment")}
            />
            <SidebarItem
              icon={FileText}
              label="Templates"
              active={activeItem === "templates"}
              onClick={() => navigate("/hr/templates")}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              active={activeItem === "settings"}
              onClick={() => navigate("/hr/settings")}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-gray-100 px-3 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
            HR
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">HR Admin</div>
            <div className="text-xs text-gray-400">admin@hireai.com</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-5">
          <div className="flex w-full max-w-93 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              placeholder="Search candidates, assessments..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-gray-500" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
              HR
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
