import { useMemo, useState } from "react";
import {
  AlarmClock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flag,
  Menu,
  Mic,
  Signal,
  Video,
} from "lucide-react";

type QuestionStatus = "answered" | "current" | "flagged" | "unvisited";

type Question = {
  id: number;
  prompt: string;
  options: string[];
  selected: string;
  points: number;
  status: QuestionStatus;
};

const initialQuestions: Question[] = [
  {
    id: 1,
    prompt: "Which hook is primarily used to trigger side effects in a React component?",
    options: ["useState", "useMemo", "useEffect", "useContext"],
    selected: "useEffect",
    points: 3,
    status: "answered",
  },
  {
    id: 2,
    prompt: "Which JavaScript method creates a new array with results of calling a function on every element?",
    options: ["forEach", "reduce", "map", "filter"],
    selected: "map",
    points: 3,
    status: "answered",
  },
  {
    id: 3,
    prompt: "Which CSS layout system is best suited for one-dimensional alignment of items?",
    options: ["Grid", "Flexbox", "Float", "Position"],
    selected: "Flexbox",
    points: 3,
    status: "answered",
  },
  {
    id: 4,
    prompt: "Which of the following is used to manage state in a React functional component?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    selected: "useState",
    points: 3,
    status: "current",
  },
  {
    id: 5,
    prompt: "Which command installs dependencies from `package.json` in a Node.js project?",
    options: ["npm init", "npm install", "npm build", "npm start"],
    selected: "",
    points: 3,
    status: "unvisited",
  },
  {
    id: 6,
    prompt: "Which HTTP status code indicates a resource was not found?",
    options: ["200", "301", "404", "500"],
    selected: "",
    points: 3,
    status: "flagged",
  },
  {
    id: 7,
    prompt: "What is the default branch name commonly used in modern Git repositories?",
    options: ["master", "main", "root", "origin"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 8,
    prompt: "Which HTML element is semantically correct for the main navigation links?",
    options: ["<section>", "<article>", "<nav>", "<aside>"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 9,
    prompt: "Which React Router component is used to redirect users declaratively?",
    options: ["<Link>", "<Navigate>", "<Route>", "<Outlet>"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 10,
    prompt: "Which SQL keyword is used to sort query results?",
    options: ["GROUP BY", "ORDER BY", "HAVING", "LIMIT"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 11,
    prompt: "Which data structure uses FIFO ordering?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 12,
    prompt: "Which operator checks both value and type equality in JavaScript?",
    options: ["==", "!=", "===", "="],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 13,
    prompt: "Which HTML attribute improves accessibility by describing form controls?",
    options: ["name", "for", "aria-label", "alt"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 14,
    prompt: "Which Git command updates your local branch with remote changes?",
    options: ["git push", "git merge", "git fetch", "git pull"],
    selected: "",
    status: "unvisited",
    points: 3,
  },
  {
    id: 15,
    prompt: "What does API stand for?",
    options: [
      "Application Programming Interface",
      "Automated Program Integration",
      "Applied Protocol Internet",
      "Advanced Program Instruction",
    ],
    selected: "",
    status: "unvisited",
    points: 3,
  },
];

const statusClassMap: Record<QuestionStatus, string> = {
  answered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  current: "bg-blue-600 text-white border-blue-600 shadow-[0_8px_22px_rgba(37,99,235,0.25)]",
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
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(3);

  const currentQuestion = questions[currentIndex];

  const answeredCount = useMemo(
    () => questions.filter((question) => question.status === "answered").length,
    [questions],
  );

  const selectQuestion = (index: number) => {
    setQuestions((prev) =>
      prev.map((question, questionIndex) => {
        if (questionIndex === currentIndex && question.status === "current") {
          return {
            ...question,
            status: question.selected ? "answered" : "unvisited",
          };
        }

        if (questionIndex === index) {
          return { ...question, status: "current" };
        }

        return question;
      }),
    );
    setCurrentIndex(index);
  };

  const handleSelectOption = (option: string) => {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === currentIndex ? { ...question, selected: option, status: "current" } : question,
      ),
    );
  };

  const handleFlagCurrent = () => {
    const nextStatus = currentQuestion.status === "flagged" ? "current" : "flagged";

    setQuestions((prev) =>
      prev.map((question, index) =>
        index === currentIndex ? { ...question, status: nextStatus } : question,
      ),
    );
  };

  const moveQuestion = (direction: "prev" | "next") => {
    const nextIndex =
      direction === "prev"
        ? Math.max(currentIndex - 1, 0)
        : Math.min(currentIndex + 1, questions.length - 1);

    if (nextIndex !== currentIndex) {
      selectQuestion(nextIndex);
    }
  };

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
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <AlarmClock className="h-4 w-4" />
              14:22
            </div>
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-700"
            >
              Submit Test
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
                {question.id}
              </button>
            ))}
          </div>

          <div className="mt-10 space-y-4 text-sm">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-slate-600">
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
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
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
                  Question {currentQuestion.id} of {questions.length}
                </p>
                <div className="mt-3 h-2 w-[420px] max-w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${(currentQuestion.id / questions.length) * 100}%` }}
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
                  <StatusChip icon={<Mic className="h-4 w-4" />} label="Mic Level" />
                  <StatusChip icon={<Video className="h-4 w-4" />} label="Video On" />
                  <StatusChip icon={<Signal className="h-4 w-4" />} label="Stable" />
                </div>
              </div>

              <div className="mt-12">
                <h2 className="max-w-4xl text-[2.15rem] font-bold leading-[1.15] tracking-[-0.04em] text-slate-950">
                  {currentQuestion.prompt}
                </h2>

                <div className="mt-10 space-y-5">
                  {currentQuestion.options.map((option) => {
                    const isSelected = currentQuestion.selected === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectOption(option)}
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
                        <span className="text-[1.12rem] font-medium text-slate-700">{option}</span>
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
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-700"
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

function StatusChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
      <span className="text-blue-600">{icon}</span>
      {label}
    </div>
  );
}
