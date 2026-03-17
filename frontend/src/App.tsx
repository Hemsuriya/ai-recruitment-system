import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HRLayout from "@components/layout/HRLayout";
import CandidatesListPage from "@features/candidates/pages/CandidatesListPage";
import CandidateDetailPage from "@features/candidates/pages/CandidateDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HRLayout />}>
          <Route index element={<Navigate to="/candidates" replace />} />
          <Route path="/candidates"     element={<CandidatesListPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="*" element={<Navigate to="/candidates" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
