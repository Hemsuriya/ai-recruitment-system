import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import TemplatesListPage from "./features/templates/pages/TemplatesListPage";
import CreateAssessmentPage from "./features/assessment/CreateAssessmentPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import CandidatesListPage from "./features/candidates/pages/CandidatesListPage";
import CandidateDetailPage from "./features/candidates/pages/CandidateDetailPage";
import IdVerificationPage from "./features/candidate/pages/IdVerificationPage";
import SelfieVerificationPage from "./features/candidate/pages/SelfieVerificationPage";
import SettingsPage from "./features/settings/SettingsPage";

import AssessmentInstructions from "./features/candidate-portal/pages/AssessmentsInstructions";
import CandidateInterviewPage from "./features/candidate-portal/pages/CandidateInterviewPage";
import TechnicalAssessmentPage from "./features/candidate-portal/pages/TechnicalAssessmentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
        <Route path="/hr/dashboard" element={<DashboardPage />} />
        <Route path="/hr/templates" element={<TemplatesListPage />} />
        <Route path="/hr/create-assessment" element={<CreateAssessmentPage />} />
        <Route path="/hr/candidates" element={<CandidatesListPage />} />
        <Route path="/hr/candidates/:id" element={<CandidateDetailPage />} />
        <Route path="/hr/settings" element={<SettingsPage />} />
        <Route path="/candidate/id-verification" element={<IdVerificationPage />} />
        <Route path="/candidate/selfie-verification" element={<SelfieVerificationPage />} />
        <Route path="/screening/:id/selfie" element={<SelfieVerificationPage />} />
        {/* Candidate Portal */}
        <Route
          path="/candidate-portal/assessment-instructions"
          element={<AssessmentInstructions/>}
        />
        <Route
          path="/candidate-portal/technical-assessment"
          element={<TechnicalAssessmentPage />}
        />
        <Route
          path="/candidate-portal/interview"
          element={<CandidateInterviewPage />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
