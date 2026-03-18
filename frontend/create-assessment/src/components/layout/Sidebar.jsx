import {
  LayoutDashboard,
  Users,
  FilePlus,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Candidates', href: '/candidates' },
  { icon: FilePlus, label: 'Create Assessment', href: '/create-assessment', active: true },
  { icon: FileText, label: 'Templates', href: '/templates' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <span className="text-xl font-bold text-gray-900">
          Hire<span className="text-violet-600">AI</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-violet-50 text-violet-700 border-l-3 border-violet-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.active && <ChevronRight size={16} className="text-violet-400" />}
            </a>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold">
          HR
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-gray-900">HR Admin</p>
          <p className="text-xs text-gray-500">admin@hireai.com</p>
        </div>
      </div>
    </aside>
  )
}
