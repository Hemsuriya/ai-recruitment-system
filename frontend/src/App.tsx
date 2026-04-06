import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import TemplatesListPage from "./features/templates/pages/TemplatesListPage";
import CreateAssessmentPage from "./features/assessment/CreateAssessmentPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import CandidatesListPage from "./features/candidates/pages/CandidatesListPage";
import CandidateDetailPage from "./features/candidates/pages/CandidateDetailPage";
import IdVerificationPage from "./features/candidate/pages/IdVerificationPage";
import SelfieVerificationPage from "./features/candidate/pages/SelfieVerificationPage";
import VerificationConfirmPage from "./features/candidate/pages/VerificationConfirmPage";
import SettingsPage from "./features/settings/SettingsPage";
import SignupPage from "./features/auth/SignupPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";

import AssessmentInstructions from "./features/candidate-portal/pages/AssessmentsInstructions";
import VideoInterviewPage from "./features/candidate-portal/pages/VideoInterviewPage";
import CandidateInterviewPage from "./features/candidate-portal/pages/CandidateInterviewPage";
import TechnicalAssessmentPage from "./features/candidate-portal/pages/TechnicalAssessmentPage";
import PreScreeningSurveyPage from "./features/candidate-portal/pages/PreScreeningSurveyPage";

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
        <Route path="/candidate/verification-confirm" element={<VerificationConfirmPage />} />
        <Route path="/screening/:id/selfie" element={<SelfieVerificationPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Candidate Portal */}
        <Route
          path="/candidate-portal/assessment-instructions"
          element={<AssessmentInstructions/>}
        />
        <Route
          path="/candidate-portal/pre-screening"
          element={<PreScreeningSurveyPage />}
        />
        <Route
          path="/candidate-portal/video-interview"
          element={<VideoInterviewPage />}
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
