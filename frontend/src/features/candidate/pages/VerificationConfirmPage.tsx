import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Shield,
  IdCard,
  Camera,
} from "lucide-react";

export default function VerificationConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screeningId = searchParams.get("id");
  const flow = searchParams.get("flow");
  const isVideoFlow = flow === "video";
  const flowQuery = flow ? `&flow=${encodeURIComponent(flow)}` : "";

  const proceedToAssessment = () => {
    // Go to pre-screening first. It will route to MCQ or Video based on flow.
    navigate(
      `/candidate-portal/pre-screening${screeningId ? `?id=${screeningId}${flowQuery}` : ""}`
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* ── top progress bar ── */}
      <div className="h-1.5 w-full bg-blue-100">
        <div className="h-full w-4/5 rounded-r-full bg-blue-600 transition-all" />
      </div>

      <div className="mx-auto max-w-[560px] px-4 py-8">
        {/* ── breadcrumb ── */}
        <div className="mb-1 flex items-center gap-1.5 text-[13px] text-gray-400">
          <span>Assessment Hub</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-gray-700">Verification Complete</span>
        </div>

        {/* ── heading ── */}
        <div className="mt-0.5 flex items-center justify-between">
          <p className="text-[14px] text-gray-500">Step 4 of 5: Confirmation</p>
          <span className="text-[13px] font-semibold text-blue-600">80% Complete</span>
        </div>

        {/* ── progress track ── */}
        <div className="mt-2 h-1 w-full rounded-full bg-blue-100">
          <div className="h-full w-4/5 rounded-full bg-blue-600" />
        </div>

        {/* ── success card ── */}
        <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-5 text-[26px] font-bold text-gray-900">
            Identity Verified
          </h1>
          <p className="mt-2 text-[15px] text-gray-500">
            Your ID and selfie have been successfully verified. You are now
            cleared to proceed to the technical assessment.
          </p>
        </div>

        {/* ── verification summary ── */}
        <div className="mt-6 space-y-3">
          <VerificationItem
            icon={<IdCard className="h-5 w-5 text-blue-600" />}
            title="ID Document"
            status="Uploaded & Stored"
          />
          <VerificationItem
            icon={<Camera className="h-5 w-5 text-purple-600" />}
            title="Selfie Verification"
            status="Face Matched"
          />
          <VerificationItem
            icon={<Shield className="h-5 w-5 text-green-600" />}
            title="Identity Confirmed"
            status="Ready for Assessment"
          />
        </div>

        {/* ── proceed button ── */}
        <button
          type="button"
          onClick={proceedToAssessment}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl"
        >
          {isVideoFlow ? "Proceed to Video Interview" : "Proceed to MCQ Assessment"}
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* ── secure footer ── */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white px-6 py-5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-700">
              Secure Verification
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-gray-400">
            Your identity data is encrypted and used only for authentication
            purposes. We comply with global data protection standards.
          </p>
        </div>
      </div>
    </div>
  );
}

function VerificationItem({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-gray-900">{title}</p>
        <p className="text-[12px] text-gray-400">{status}</p>
      </div>
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    </div>
  );
}
