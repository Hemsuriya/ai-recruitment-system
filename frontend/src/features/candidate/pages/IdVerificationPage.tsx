import { useCallback, useRef, useState } from "react";
import {
  Camera,
  ChevronRight,
  Clock,
  Eye,
  Info,
  Lightbulb,
  RefreshCw,
  ScanLine,
  Shield,
  CheckCircle2,
  Upload,
  X,
} from "lucide-react";

/* ── static mock data ─────────────────────────────────── */
const MOCK_RESULT = {
  name: "ADITYA VERMA",
  dob: "15/08/1992",
  idNumber: "XXXX XXXX 8823",
  gender: "Male",
};

const instructions = [
  { icon: Lightbulb, text: "Place your Aadhaar card on a flat surface with good lighting." },
  { icon: ScanLine, text: "Ensure all four corners of the card are visible within the frame." },
  { icon: Eye, text: "Avoid glare or reflections that might obscure the details." },
  { icon: Clock, text: "The verification process typically takes less than 60 seconds." },
  { icon: Shield, text: "Your data is encrypted and used only for identity verification." },
];

/* ── page component ───────────────────────────────────── */
export default function IdVerificationPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    // simulate backend verification after a short delay
    setTimeout(() => setVerified(true), 1200);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const reset = () => {
    setPreview(null);
    setVerified(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* ── top progress bar ── */}
      <div className="h-1.5 w-full bg-blue-100">
        <div className="h-full w-1/2 rounded-r-full bg-blue-600 transition-all" />
      </div>

      <div className="mx-auto max-w-[760px] px-4 py-8">
        {/* ── breadcrumb ── */}
        <div className="mb-1 flex items-center gap-1.5 text-[13px] text-gray-400">
          <span>Assessment Hub</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-gray-700">Identity Verification</span>
        </div>

        {/* ── heading ── */}
        <h1 className="text-[28px] font-bold leading-tight text-gray-900">Verify Your Identity</h1>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="text-[14px] text-gray-500">Step 2 of 4: Documentation Submission</p>
          <span className="text-[13px] font-semibold text-blue-600">50% Complete</span>
        </div>

        {/* ── progress track ── */}
        <div className="mt-2 h-1 w-full rounded-full bg-blue-100">
          <div className="h-full w-1/2 rounded-full bg-blue-600" />
        </div>

        {/* ── instructions card ── */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-[15px] font-semibold text-gray-800">Instructions</h2>
          </div>
          <div className="space-y-2">
            {instructions.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-2.5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="text-[13.5px] text-gray-600">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── capture / upload zone ── */}
        {!preview ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-blue-200 bg-white px-6 py-12 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <Camera className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900">Capture Front Side</h3>
            <p className="mt-1 max-w-xs text-[13.5px] text-gray-400">
              Click to open camera or drag and drop your high-quality ID scan here.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
              >
                <Camera className="h-4 w-4" />
                Open Camera
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-[14px] font-medium text-blue-600 transition hover:bg-blue-50"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            <p className="mt-4 text-[12px] text-gray-400">
              Allowed formats: JPG, PNG, PDF (Up to 10MB)
            </p>
          </div>
        ) : (
          /* ── preview + verification result ── */
          <div className="mt-6 space-y-5">
            {/* uploaded image preview */}
            <div className="relative overflow-hidden rounded-2xl bg-[#1a5c4c]">
              {verified && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  <CheckCircle2 className="h-3 w-3" />
                  SHARP QUALITY
                </span>
              )}
              <img
                src={preview}
                alt="Uploaded ID"
                className="mx-auto max-h-[340px] object-contain p-6"
              />
              <button
                type="button"
                onClick={reset}
                className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* verification info */}
            {verified && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-gray-900">Verification Information</h3>
                  <span className="text-[12px] text-gray-400">
                    Captured {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  READY TO CONFIRM
                </span>

                {/* extracted fields */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Field label="NAME" value={MOCK_RESULT.name} />
                  <Field label="DATE OF BIRTH (DOB)" value={MOCK_RESULT.dob} />
                  <Field label="ID NUMBER" value={MOCK_RESULT.idNumber} />
                  <Field label="GENDER" value={MOCK_RESULT.gender} />
                </div>

                {/* action buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[14px] font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[14px] font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm &amp; Continue
                  </button>
                </div>
              </div>
            )}

            {/* loading state */}
            {!verified && (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="text-[14px] font-medium text-gray-600">Verifying your document…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── tiny helper ──────────────────────────────────────── */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="text-[15px] font-bold text-gray-900">{value}</p>
    </div>
  );
}