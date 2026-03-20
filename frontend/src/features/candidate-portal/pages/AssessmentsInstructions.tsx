import React from "react";
import {
  ClipboardList,
  Camera,
  Mic,
  Wifi,
  Clock,
  Monitor,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function AssessmentInstructions() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <ClipboardList size={20} />
          </div>
          <h1 className="text-lg font-semibold">Assessment Instructions</h1>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-500">Step 1 of 10</span>
          <button className="px-4 py-1.5 bg-gray-100 rounded-md text-sm">
            Help
          </button>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="text-xs text-gray-500 mb-1">OVERALL PROGRESS</div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div className="w-[10%] h-2 bg-blue-600 rounded-full"></div>
        </div>
        <div className="text-right text-xs text-blue-600 mt-1">10%</div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome to your Assessment
        </h2>
        <p className="text-gray-500 max-w-2xl mb-8">
          We&apos;re excited to have you. Please complete the following identity
          verification and technical evaluation steps to proceed to the main
          assessment.
        </p>

        <div className="flex items-center gap-6 mb-10 flex-wrap md:flex-nowrap">
          <Step active title="1. ID Upload" subtitle="Government issued photo ID" />
          <Divider />
          <Step title="2. Selfie with ID" subtitle="Match your face to the ID" />
          <Divider />
          <Step title="3. Technical Assessment" subtitle="Coding and logic evaluation" />
        </div>

        <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <CheckCircle className="text-blue-600" size={18} />
          Before You Begin
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <InfoCard icon={<ClipboardList />} label="Valid ID" />
          <InfoCard icon={<Camera />} label="Working Camera" />
          <InfoCard icon={<Mic />} label="Microphone" />
          <InfoCard icon={<Wifi />} label="Stable Internet" />
          <InfoCard icon={<Clock />} label="~15 Minutes" />
          <InfoCard icon={<Monitor />} label="Single Monitor" />
        </div>

        <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold mb-4">Important Guidelines</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              "Ensure a stable internet connection throughout the entire session. Disconnections may invalidate your progress.",
              "Allow camera and microphone access when prompted by the browser. These are mandatory for the evaluation.",
              "The browser will enter locked mode. Navigating away or switching tabs will be flagged as a violation.",
              "Make sure you are in a quiet, well-lit room. No other person should be visible or audible during the assessment.",
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="text-yellow-600 mt-1 shrink-0" size={18} />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">
              Interview Policy &amp; Conduct
            </h4>
            <p className="text-sm text-yellow-700">
              Leaving your seat during the assessment is strictly prohibited.
              Any form of malpractice, including using external materials or AI
              assistance, will result in immediate disqualification and a
              permanent ban from future opportunities.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 mb-10">
          <input type="checkbox" className="mt-1" />
          <p className="text-sm text-gray-600">
            I understand and agree to the assessment guidelines, interview
            policies, and privacy policy. I am ready to begin the verification
            process.
          </p>
        </div>

        <div className="flex justify-between items-center gap-4 flex-wrap">
          <span className="text-sm text-gray-500">
            Estimated time to complete: <b>15–20 mins</b>
          </span>

          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2">
            Start Assessment →
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 flex justify-between px-6 py-4 border-t bg-white gap-4 flex-wrap">
        <span>© 2024 Assessment Portal. All rights reserved.</span>
        <div className="flex gap-4 flex-wrap">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Support</span>
        </div>
      </div>
    </div>
  );
}

function Step({ title, subtitle, active = false }: { title: string; subtitle: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        ●
      </div>
      <div>
        <div className={`text-sm font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>
          {title}
        </div>
        <div className="text-xs text-gray-400">{subtitle}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="flex-1 h-px bg-gray-200 min-w-8"></div>;
}

function InfoCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center shadow-sm">
      <div className="text-blue-600">{icon}</div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}
