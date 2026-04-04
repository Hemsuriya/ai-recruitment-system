import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  AlarmClock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flag,
  Loader2,
  Menu,
  Mic,
  Signal,
  Video,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

type QuestionStatus = "answered" | "current" | "flagged" | "unvisited";

type Question = {
  id: number;
  prompt: string;
  options: string[];
  optionKeys: string[];
  selected: string;
  points: number;
  status: QuestionStatus;
};

const statusClassMap: Record<QuestionStatus, string> = {
  answered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  current:
    "bg-blue-600 text-white border-blue-600 shadow-[0_8px_22px_rgba(37,99,235,0.25)]",
  flagged: "bg-amber-100 text-amber-700 border-amber-200",
  unvisited: "bg-white text-slate-400 border-slate-200",
};

const legendItems: Array<{ label: string; status: QuestionStatus }> = [
  { label: "Answered", status: "answered" },
  { label: "Current", status: "current" },
  { label: "Flagged", status: "flagged" },
  { label: "Unvisited", status: "unvisited" },
];

export default function TechnicalAssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const screeningId = searchParams.get("id");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total_questions: number;
    correct_answers: number;
    grade: string;
    is_passed: boolean;
  } | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Fetch questions from backend
  useEffect(() => {
    if (!screeningId) {
      setError("No screening ID provided. Please use the link from your invitation email.");
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE}/assessment/questions/${screeningId}`);
        const json = await res.json();

        if (!json.success || !json.data?.questions?.length) {
          setError("No assessment questions found for your screening ID.");
          setLoading(false);
          return;
        }

        const mapped: Question[] = json.data.questions.map(
          (q: { id: number; question_text: string; options: Record<string, string>; category: string; difficulty: string; time_limit: number }, i: number) => {
            const optionKeys = Object.keys(q.options);
            return {
              id: q.id,
              prompt: q.question_text,
              options: optionKeys.map((k) => q.options[k]),
              optionKeys,
              selected: "",
              points: q.difficulty === "hard" ? 5 : q.difficulty === "medium" ? 3 : 2,
              status: i === 0 ? ("current" as QuestionStatus) : ("unvisited" as QuestionStatus),
            };
          }
        );

        setQuestions(mapped);
        // Set timer based on job requirements or default 30 min
        const timeLimitStr = json.data.jobRequirements?.time_limit || "30 minutes";
        const minutes = parseInt(timeLimitStr) || 30;
        setTimeLeft(minutes * 60);
        startTimeRef.current = Date.now();
        setLoading(false);
      } catch (err) {
        setError("Failed to load assessment. Please try again.");
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [screeningId]);

  // Timer countdown
  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex];

  const answeredCount = useMemo(
    () => questions.filter((q) => q.status === "answered").length,
    [questions]
  );

  const selectQuestion = (index: number) => {
    setQuestions((prev) =>
      prev.map((question, qi) => {
        if (qi === currentIndex && question.status === "current") {
          return {
            ...question,
            status: question.selected ? "answered" : "unvisited",
          };
        }
        if (qi === index) {
          return { ...question, status: "current" };
        }
        return question;
      })
    );
    setCurrentIndex(index);
  };

  const handleSelectOption = (optionKey: string) => {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === currentIndex
          ? { ...question, selected: optionKey, status: "current" }
          : question
      )
    );
  };

  const handleFlagCurrent = () => {
    const nextStatus =
      currentQuestion.status === "flagged" ? "current" : "flagged";
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === currentIndex
          ? { ...question, status: nextStatus }
          : question
      )
    );
  };

  const moveQuestion = (direction: "prev" | "next") => {
    const nextIndex =
      direction === "prev"
        ? Math.max(currentIndex - 1, 0)
        : Math.min(currentIndex + 1, questions.length - 1);
    if (nextIndex !== currentIndex) selectQuestion(nextIndex);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);

    // Build answers map: question_id -> selected option key
    const answers: Record<number, string> = {};
    questions.forEach((q) => {
      if (q.selected) {
        answers[q.id] = q.selected;
      }
    });

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await fetch(`${API_BASE}/assessment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screening_id: screeningId,
          answers,
          time_taken_seconds: timeTaken,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setResult(json.data);
        setSubmitted(true);
      } else {
        alert("Failed to submit assessment. Please try again.");
      }
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [questions, screeningId, submitting, submitted]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-slate-600">
            Loading your assessment...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-800">Assessment Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Submitted state
  if (submitted && result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${result.is_passed ? "bg-emerald-100" : "bg-red-100"}`}
          >
            <span className="text-3xl font-bold ${result.is_passed ? 'text-emerald-600' : 'text-red-600'}">
              {result.grade}
            </span>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900">
            Assessment Complete
          </h2>
          <p className="mt-2 text-slate-500">
            You scored {result.correct_answers} out of {result.total_questions}{" "}
            ({result.score}%)
          </p>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-500">Score</p>
                <p className="text-xl font-bold text-slate-900">
                  {result.score}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Grade</p>
                <p className="text-xl font-bold text-slate-900">
                  {result.grade}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Result</p>
                <p
                  className={`text-xl font-bold ${result.is_passed ? "text-emerald-600" : "text-red-600"}`}
                >
                  {result.is_passed ? "Passed" : "Failed"}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Thank you for completing the assessment. You may now close this
            window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                Assessment Portal
              </p>
              <h1 className="text-[1.7rem] font-bold tracking-[-0.03em] text-slate-950">
                Aptitude &amp; Technical Assessment
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                timeLeft < 120
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-100 bg-blue-50 text-blue-700"
              }`}
            >
              <AlarmClock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-81px)] grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white px-5 py-8">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-950">
            Question Overview
          </h2>

          <div className="mt-6 grid grid-cols-5 gap-3">
            {questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                onClick={() => selectQuestion(index)}
                className={`h-12 rounded-2xl border text-sm font-semibold transition hover:-translate-y-0.5 ${statusClassMap[question.status]}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="mt-10 space-y-4 text-sm">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-slate-600"
              >
                <span
                  className={`h-5 w-5 rounded-md border ${statusClassMap[item.status].replace("shadow-[0_8px_22px_rgba(37,99,235,0.25)]", "")}`}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">Progress</p>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${(answeredCount / questions.length) * 100}%`,
                }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {answeredCount} of {questions.length} questions answered
            </p>
          </div>
        </aside>

        <main className="flex flex-col">
          <div className="flex-1 px-12 py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <div className="mt-3 h-2 w-[420px] max-w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                {currentQuestion.points} points
              </p>
            </div>

            <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-950">
                        Live Proctoring Active
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Monitor session for integrity
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusChip
                    icon={<Mic className="h-4 w-4" />}
                    label="Mic Level"
                  />
                  <StatusChip
                    icon={<Video className="h-4 w-4" />}
                    label="Video On"
                  />
                  <StatusChip
                    icon={<Signal className="h-4 w-4" />}
                    label="Stable"
                  />
                </div>
              </div>

              <div className="mt-12">
                <h2 className="max-w-4xl text-[2.15rem] font-bold leading-[1.15] tracking-[-0.04em] text-slate-950">
                  {currentQuestion.prompt}
                </h2>

                <div className="mt-10 space-y-5">
                  {currentQuestion.optionKeys.map((key, idx) => {
                    const isSelected = currentQuestion.selected === key;
                    const optionText = currentQuestion.options[idx];

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectOption(key)}
                        className={`flex w-full items-center gap-4 rounded-[22px] border bg-white px-7 py-6 text-left transition ${
                          isSelected
                            ? "border-blue-400 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-600">
                            <span className="h-3 w-3 rounded-full bg-blue-600" />
                          </span>
                        ) : (
                          <Circle className="h-7 w-7 text-slate-300" />
                        )}
                        <span className="text-[1.12rem] font-medium text-slate-700">
                          <span className="mr-2 font-bold text-slate-400">
                            {key}.
                          </span>
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white px-12 py-5">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => moveQuestion("prev")}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={handleFlagCurrent}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <Flag className="h-4 w-4" />
                Flag for Review
              </button>

              <button
                type="button"
                onClick={() => moveQuestion("next")}
                disabled={currentIndex === questions.length - 1}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:opacity-50"
              >
                Next Question
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function StatusChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
      <span className="text-blue-600">{icon}</span>
      {label}
    </div>
  );
}
