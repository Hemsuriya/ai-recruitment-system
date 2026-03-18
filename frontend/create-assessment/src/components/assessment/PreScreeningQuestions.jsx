import { useState } from 'react'
import { CheckCircle2, Plus, X, GripVertical } from 'lucide-react'

const defaultQuestions = [
  { id: 1, text: 'Are you willing to relocate?', checked: true },
  { id: 2, text: 'Are you a US Citizen or authorized to work in the US?', checked: true },
  { id: 3, text: 'What is your current visa status?', checked: true },
  { id: 4, text: 'What is your expected salary range?', checked: true },
  { id: 5, text: 'Are you available to start within 30 days?', checked: true },
]

export default function PreScreeningQuestions({ questions, setQuestions }) {
  const [newQuestion, setNewQuestion] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)

  const toggleQuestion = (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, checked: !q.checked } : q))
    )
  }

  const addQuestion = () => {
    const trimmed = newQuestion.trim()
    if (trimmed) {
      setQuestions((prev) => [
        ...prev,
        { id: Date.now(), text: trimmed, checked: true, custom: true },
      ])
      setNewQuestion('')
      setShowAddInput(false)
    }
  }

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addQuestion()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 size={20} className="text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">Pre-Screening Questions</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">Select questions to include in the assessment</p>

      {/* Question list */}
      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
          >
            <button
              onClick={() => toggleQuestion(q.id)}
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                q.checked
                  ? 'bg-violet-600 text-white'
                  : 'border-2 border-gray-300 bg-white'
              }`}
            >
              {q.checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="flex-1 text-sm text-gray-700">{q.text}</span>
            {q.custom && (
              <button
                onClick={() => removeQuestion(q.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add custom question */}
      {showAddInput ? (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="Enter your custom question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button
            onClick={addQuestion}
            className="px-4 py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddInput(false); setNewQuestion('') }}
            className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddInput(true)}
          className="mt-3 flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
        >
          <Plus size={16} />
          Add Custom Question
        </button>
      )}
    </div>
  )
}

export { defaultQuestions }
