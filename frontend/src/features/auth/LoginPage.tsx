import { Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HireAILogin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="w-1/2 relative flex flex-col items-center justify-center p-12 bg-linear-to-br from-blue-600 via-indigo-600 to-blue-800 text-white">
        {/* Logo */}
        <div className="absolute top-12 left-12 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            <span className="text-xl">🧠</span>
          </div>
          <span className="text-lg font-semibold">AI Candidate Screening</span>
        </div>

        {/* Center Content */}
        <div className="max-w-md w-full text-left">
          <div className="w-28 h-28 mb-8 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
            <span className="text-4xl">🧠</span>
          </div>

          <h1 className="text-4xl font-semibold leading-tight mb-4">
            Intelligent hiring,<br /> powered by AI
          </h1>

          <p className="text-white/80 text-sm leading-relaxed">
            Screen candidates automatically with AI-driven resume analysis,
            technical assessments, and video interviews. Find the best talent
            faster.
          </p>
        </div>

        {/* Decorative Shape */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-3xl blur-2xl" />
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Sign in to your AI-powered candidate screening platform
          </p>

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              className="mt-2 w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <button className="text-sm text-indigo-600 hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative mt-2">
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Eye className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="button"
            onClick={() => navigate("/hr/dashboard")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-linear-to-r from-indigo-500 to-blue-600 text-white font-medium shadow-md hover:opacity-95"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => navigate("/hr/dashboard")}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">
              Sign in with Google
            </span>
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don’t have an account?{' '}
            <button className="text-indigo-600 hover:underline">
              Request access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
