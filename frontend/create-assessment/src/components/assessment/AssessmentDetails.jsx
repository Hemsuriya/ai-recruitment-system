import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const experienceLevels = ['Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead', 'Principal']

export default function AssessmentDetails({ formData, setFormData }) {
  const [skillInput, setSkillInput] = useState('')

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">📋</span>
        <h2 className="text-lg font-semibold text-gray-900">Assessment Details</h2>
      </div>

      {/* Role Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Title</label>
        <input
          type="text"
          placeholder="e.g. Senior Data Scientist"
          value={formData.roleTitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, roleTitle: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Experience Level */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience Level</label>
        <select
          value={formData.experienceLevel}
          onChange={(e) => setFormData((prev) => ({ ...prev, experienceLevel: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none cursor-pointer"
        >
          <option value="">Select level</option>
          {experienceLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Skills Required */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills Required</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a skill (e.g. Python)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button
            onClick={addSkill}
            className="p-2.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Skill tags */}
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 text-violet-700 text-sm rounded-full"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-violet-400 hover:text-violet-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
