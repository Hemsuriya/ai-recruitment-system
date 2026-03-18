import { Sparkles, Code, Brain, Video, Users } from 'lucide-react'

const optionConfigs = [
  {
    key: 'generateAI',
    icon: Sparkles,
    label: 'Generate AI Questions',
    description: 'Auto-generate role-specific questions',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
  {
    key: 'codingRound',
    icon: Code,
    label: 'Include Coding Round',
    description: 'Add hands-on coding challenges',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    key: 'aptitudeTest',
    icon: Brain,
    label: 'Include Aptitude Test',
    description: 'Logical reasoning and problem-solving',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
  },
  {
    key: 'aiInterview',
    icon: Video,
    label: 'AI Video Interview',
    description: 'AI-analyzed video responses',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  {
    key: 'manualInterview',
    icon: Users,
    label: 'Manual Video Interview',
    description: 'HR team conducts live interviews',
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
  },
]

export default function AssessmentOptions({ options, setOptions }) {
  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-violet-500" />
        <h2 className="text-lg font-semibold text-gray-900">Assessment Options</h2>
      </div>

      <div className="space-y-3">
        {optionConfigs.map((opt) => {
          const Icon = opt.icon
          const isEnabled = options[opt.key]
          return (
            <div
              key={opt.key}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleOption(opt.key)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${
                    isEnabled ? 'bg-violet-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                      isEnabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                {/* Icon */}
                <div className={`w-8 h-8 ${opt.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon size={16} className={opt.iconColor} />
                </div>
                {/* Label */}
                <div>
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
