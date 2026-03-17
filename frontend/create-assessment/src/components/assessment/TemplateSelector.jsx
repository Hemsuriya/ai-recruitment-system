import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const templates = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'DevOps Engineer',
]

export default function TemplateSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState('')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        {selected || 'Choose a template'}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {templates.map((t) => (
            <button
              key={t}
              onClick={() => { setSelected(t); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
