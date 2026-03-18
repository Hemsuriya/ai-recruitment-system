import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import AssessmentDetails from '../components/assessment/AssessmentDetails'
import PreScreeningQuestions, { defaultQuestions } from '../components/assessment/PreScreeningQuestions'
import AssessmentSummary from '../components/assessment/AssessmentSummary'
import AssessmentOptions from '../components/assessment/AssessmentOptions'
import TemplateSelector from '../components/assessment/TemplateSelector'

export default function CreateAssessment() {
  const [formData, setFormData] = useState({
    roleTitle: '',
    experienceLevel: '',
    skills: [],
  })

  const [questions, setQuestions] = useState(defaultQuestions)

  const [options, setOptions] = useState({
    generateAI: true,
    codingRound: true,
    aptitudeTest: false,
    aiInterview: true,
    manualInterview: false,
  })

  const handleGenerate = () => {
    console.log('Generating assessment:', { formData, questions, options })
    // TODO: integrate with backend API
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Assessment</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate AI-powered screening assessments for candidates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Select Template</span>
            <TemplateSelector />
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <AssessmentDetails formData={formData} setFormData={setFormData} />
            <PreScreeningQuestions questions={questions} setQuestions={setQuestions} />
          </div>

          {/* Right column - Summary & Options */}
          <div className="space-y-6">
            <AssessmentSummary formData={formData} questions={questions} options={options} />
            <AssessmentOptions options={options} setOptions={setOptions} />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
            >
              <Sparkles size={18} />
              Generate Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
