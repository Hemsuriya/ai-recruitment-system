import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import TemplateList from "../hr/Templates/TemplateList";
import CreateAssessmentPage from "./features/assessment/CreateAssessmentPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import CandidatesListPage from "./features/candidates/pages/CandidatesListPage";
import CandidateDetailPage from "./features/candidates/pages/CandidateDetailPage";

import AssessmentInstructions from "./features/candidate-portal/pages/AssessmentsInstructions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
        <Route path="/hr/dashboard" element={<DashboardPage />} />
        <Route path="/hr/templates" element={<TemplateList />} />
        <Route path="/hr/create-assessment" element={<CreateAssessmentPage />} />
        <Route path="/hr/candidates" element={<CandidatesListPage />} />
        <Route path="/hr/candidates/:id" element={<CandidateDetailPage />} />
        {/* Candidate Portal */}
        <Route
          path="/candidate-portal/assessment-instructions"
          element={<AssessmentInstructions/>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
