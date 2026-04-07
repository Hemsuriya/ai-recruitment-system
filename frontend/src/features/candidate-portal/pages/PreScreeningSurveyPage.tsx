import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

type SurveyQuestion = {
  id: number;
  question_id: number;
  question_text: string;
  question_type: string;
  options: unknown;
  is_qualifying: boolean;
  question_category: string;
};

export default function PreScreeningSurveyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screeningId = searchParams.get("id");
  const flow = searchParams.get("flow");
  const isVideoFlow = flow === "video";

  const nextRoute = isVideoFlow
    ? `/candidate-portal/video-interview?id=${encodeURIComponent(screeningId || "")}`
    : `/candidate-portal/technical-assessment?id=${encodeURIComponent(screeningId || "")}`;

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!screeningId) {
      setError("No screening ID provided.");
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE}/survey/${screeningId}`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setQuestions(json.data);
        } else {
          // No survey questions: skip directly to next stage for this flow
          navigate(nextRoute, { replace: true });
          return;
        }
      } catch {
        setError("Failed to load survey questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [screeningId, navigate, nextRoute]);

  const allAnswered = questions.every(
    (q) => answers[q.question_id || q.id]?.trim()
  );

  const handleSubmit = async () => {
    if (!screeningId || submitting) return;
    setSubmitting(true);

    const payload = questions.map((q) => ({
      question_id: q.question_id || q.id,
      answer: answers[q.question_id || q.id] || "",
    }));

    try {
      // Submit answers
      await fetch(`${API_BASE}/survey/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screening_id: screeningId, answers: payload }),
      });

      // Answers stored: proceed to next stage for this flow
      navigate(nextRoute);
    } catch {
      // On error, still proceed
      navigate(nextRoute);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-slate-600">
            Loading pre-screening survey...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-red-800">
            Survey Not Passed
          </h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Assessment Portal
              </p>
              <h1 className="text-lg font-bold text-slate-900">
                Pre-Screening Survey
              </h1>
            </div>
          </div>
          <span className="text-sm text-slate-400">
            Step 1 of 2 - Complete to unlock {isVideoFlow ? "video interview" : "technical assessment"}
          </span>
        </div>
      </header>

      <div className="px-6 pt-4">
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{
              width: `${(Object.keys(answers).length / questions.length) * 100}%`,
            }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-blue-600">
          {Object.keys(answers).length} / {questions.length} answered
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="mb-6 text-slate-500">
          Please answer the following questions before proceeding to the {isVideoFlow ? "video interview" : "technical assessment"}.
        </p>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const qId = q.question_id || q.id;
            return (
              <div
                key={qId}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium text-slate-800">
                      {q.question_text}
                      {q.is_qualifying && (
                        <span className="ml-2 text-xs font-semibold text-red-500">
                          Required
                        </span>
                      )}
                    </p>
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Type your answer..."
                        value={answers[qId] || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [qId]: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  {answers[qId]?.trim() && (
                    <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {isVideoFlow ? "Continue to Video Interview" : "Continue to Assessment"}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
