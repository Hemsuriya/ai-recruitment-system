import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import CreateAssessment from './pages/CreateAssessment'

export default function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <CreateAssessment />
      </div>
    </div>
  )
}
