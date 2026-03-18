import { CheckCircle2, Circle } from 'lucide-react'

const componentsList = [
  { label: 'AI-Generated Questions', enabled: true },
  { label: 'Coding Round', enabled: true },
  { label: 'Aptitude Test', enabled: false },
  { label: 'AI Video Interview', enabled: false },
]

export default function AssessmentSummary({ formData, questions, options }) {
  const selectedQuestionsCount = questions.filter((q) => q.checked).length

  // Dynamically build components from options
  const components = [
    { label: 'AI-Generated Questions', enabled: options.generateAI },
    { label: 'Coding Round', enabled: options.codingRound },
    { label: 'Aptitude Test', enabled: options.aptitudeTest },
    { label: 'AI Video Interview', enabled: options.aiInterview },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Assessment Summary</h2>

      {/* Role */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</p>
        <p className="text-sm font-medium text-gray-900">
          {formData.roleTitle || 'Not specified'}
        </p>
      </div>

      {/* Experience */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
        <p className="text-sm font-medium text-gray-900">
          {formData.experienceLevel || 'Not selected'}
        </p>
      </div>

      {/* Skills */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skills</p>
        {formData.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No skills added</p>
        )}
      </div>

      <hr className="border-gray-200 my-5" />

      {/* Components */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Components</p>
        <div className="space-y-2.5">
          {components.map((comp) => (
            <div key={comp.label} className="flex items-center gap-2">
              {comp.enabled ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <Circle size={16} className="text-orange-400" />
              )}
              <span className="text-sm text-gray-700">{comp.label}</span>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-200 my-5" />

      {/* Pre-screening */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pre-Screening</p>
        <p className="text-sm font-medium text-gray-900">
          {selectedQuestionsCount} questions selected
        </p>
      </div>
    </div>
  )
}
