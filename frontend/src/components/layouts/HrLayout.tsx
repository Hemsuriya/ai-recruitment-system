import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  Search,
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

export default function HRLayout({ children }: any) {
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

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto p-6">
            {children}
          <Outlet/>
        </div>
      </div>
    </div>
  );
}