import React, { useState, useEffect, useCallback } from 'react';
import { Check, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { videoInterviewApi, type VideoQuestion } from '../../../services/api';

export interface SubmissionPageProps {
  blobs: Map<number, Blob>;
  videoAssessmentId: string;
  questions: VideoQuestion[];
}

type UploadStatus = 'uploading' | 'success' | 'error';

export const SubmissionPage: React.FC<SubmissionPageProps> = ({
  blobs,
  videoAssessmentId,
  questions,
}) => {
  const [status, setStatus] = useState<UploadStatus>('uploading');
  const [errorMsg, setErrorMsg] = useState('');

  const upload = useCallback(async () => {
    setStatus('uploading');
    setErrorMsg('');
    try {
      const metadata = questions.map((q, idx) => ({
        question_id: q.id,
        question_index: idx,
        duration: q.time_limit,
      }));
      await videoInterviewApi.submitVideos(videoAssessmentId, blobs, metadata);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStatus('error');
    }
  }, [blobs, videoAssessmentId, questions]);

  // Start upload on mount
  useEffect(() => {
    upload();
  }, [upload]);

  // Warn before navigating away during upload
  useEffect(() => {
    if (status !== 'uploading') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  // ── Uploading state ──────────────────────────────────────
  if (status === 'uploading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-sans p-6">
        <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm text-center max-w-lg w-full border border-gray-100">
          <div className="mx-auto mb-8 w-24 h-24 flex items-center justify-center">
            <Loader2 className="w-14 h-14 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Uploading Your Responses...
          </h1>
          <p className="text-slate-500 text-base leading-relaxed px-4">
            Please don't close this page. Your recorded answers are being securely
            uploaded ({blobs.size} video{blobs.size !== 1 ? 's' : ''}).
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-sans p-6">
        <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm text-center max-w-lg w-full border border-gray-100">
          <div className="mx-auto mb-8 w-24 h-24 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-10 h-10" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Upload Failed
          </h1>
          <p className="text-slate-500 text-sm mb-2 leading-relaxed px-4">
            {errorMsg}
          </p>
          <p className="text-slate-400 text-xs mb-8">
            Your recordings are still saved locally. Click retry to try again.
          </p>
          <button
            onClick={upload}
            className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm focus:ring-4 focus:ring-blue-100 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Retry Upload
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans p-6">
      <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm text-center max-w-lg w-full border border-gray-100 transition-shadow">
        <div className="mx-auto mb-8 w-24 h-24 flex items-center justify-center relative animate-in fade-in zoom-in duration-500">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75" />
          <div className="relative w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Interview Submitted!
        </h1>

        <p className="text-slate-500 mb-10 text-base leading-relaxed px-4">
          Thank you for completing your interview. Our team will review your
          responses and be in touch shortly. You can now close this tab.
        </p>

        <button
          onClick={() => window.close()}
          className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm focus:ring-4 focus:ring-blue-100"
        >
          Close This Tab
        </button>
      </div>
    </div>
  );
};

export default SubmissionPage;
