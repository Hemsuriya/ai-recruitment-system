import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  Eye,
  Lightbulb,
  Monitor,
  RefreshCw,
  Shield,
  Smile,
  Timer,
  User,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const ID_SERVICE_URL = import.meta.env.VITE_ID_SERVICE_URL || "http://localhost:8000";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── types ────────────────────────────────────────────── */
type CaptureStage =
  | "ready"       // camera active, waiting for user
  | "countdown"   // 5-4-3-2-1 countdown
  | "capturing"   // flash + snapshot
  | "preview"     // review captured selfie
  | "verified";   // verification success

/* ── tip data ─────────────────────────────────────────── */
const tips = [
  {
    icon: Eye,
    title: "Clear Visibility",
    desc: "Ensure your face is clearly visible within the oval frame.",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    icon: Smile,
    title: "Neutral Expression",
    desc: "Maintain a neutral expression and look directly at the lens.",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    icon: Lightbulb,
    title: "Optimal Lighting",
    desc: "Find a well-lit area without strong backlighting or shadows.",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    icon: Monitor,
    title: "Auto Capture",
    desc: "Photo will be automatically captured after a 5-second countdown.",
    color: "#059669",
    bg: "#ecfdf5",
  },
];

/* ── page component ───────────────────────────────────── */
export default function SelfieVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screeningId = searchParams.get("id");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<CaptureStage>("ready");
  const [countdown, setCountdown] = useState(5);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    confidence_same_person_percent: number | null;
  } | null>(null);

  /* ── attach stream to video element ── */
  const attachStream = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    // If metadata already loaded (re-attach after retake), play immediately
    if (video.readyState >= 1) {
      video.play().catch(() => {});
      setCameraReady(true);
    } else {
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
        setCameraReady(true);
      };
    }
  }, []);

  /* ── start camera ── */
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null);
      // Re-use existing live stream if available
      if (streamRef.current?.active) {
        attachStream(streamRef.current);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      attachStream(stream);
    } catch {
      setCameraError(
        "Unable to access camera. Please allow camera permissions and try again."
      );
    }
  }, [attachStream]);

  useEffect(() => {
    initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [initCamera]);

  /* ── re-attach stream whenever the video element re-mounts (e.g. after retake) ── */
  useEffect(() => {
    if (
      (stage === "ready" || stage === "countdown" || stage === "capturing") &&
      !cameraReady &&
      streamRef.current?.active
    ) {
      attachStream(streamRef.current);
    }
  }, [stage, cameraReady, attachStream]);

  /* ── countdown logic ── */
  const captureSnapshotRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdown <= 0) {
      captureSnapshotRef.current();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, countdown]);

  /* ── capture snapshot from video ── */
  const captureSnapshot = useCallback((): void => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Guard: video must have real dimensions (stream fully started)
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setCameraError("Camera stream not ready. Please wait a moment and try again.");
      return;
    }

    setStage("capturing");

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // mirror the image (selfie camera is mirrored in CSS)
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    // brief "flash" effect then show preview
    setTimeout(() => setStage("preview"), 400);
  }, []);

  // Keep ref in sync so countdown useEffect can call it without stale closure
  useEffect(() => { captureSnapshotRef.current = captureSnapshot; }, [captureSnapshot]);

  /* ── start countdown ── */
  const startCountdown = () => {
    setCountdown(5);
    setStage("countdown");
  };

  /* ── manual capture (instant) ── */
  const manualCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Camera not ready yet. Please wait a moment.");
      return;
    }
    captureSnapshot();
  }, [captureSnapshot]);

  /* ── retake — reset state and re-attach existing stream ── */
  const retake = useCallback(() => {
    setCapturedImage(null);
    setVerifyError(null);
    setVerifying(false);
    setCameraReady(false);  // triggers the re-attach useEffect
    setStage("ready");
  }, []);

  /* ── confirm & continue ── */
  const CONFIDENCE_THRESHOLD = 60;

  const confirmAndContinue = async () => {
    if (!capturedImage) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`${ID_SERVICE_URL}/verify-selfie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: screeningId || "unknown",
          selfieBase64: capturedImage,
        }),
      });
      const data = await res.json();

      const confidence: number | null = data.confidence_same_person_percent ?? null;
      const meetsThreshold = confidence !== null && confidence >= CONFIDENCE_THRESHOLD;

      if (data.verified && meetsThreshold) {
        setVerifyResult({ verified: true, confidence_same_person_percent: confidence });
        setStage("verified");

        // Persist identity_verified to backend DB
        try {
          await fetch(`${API_BASE}/candidate/identity-verified`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ screening_id: screeningId, verified: true }),
          });
        } catch {
          // Non-blocking
        }
      } else {
        let msg: string;
        if (!data.verified) {
          msg = `Face not recognised${confidence !== null ? ` (${confidence.toFixed(1)}% match)` : ""}. Please retake your selfie and ensure it clearly matches your ID photo.`;
        } else {
          // verified but below threshold
          msg = `Match confidence too low: ${confidence?.toFixed(1)}% (minimum ${CONFIDENCE_THRESHOLD}% required). Please retake in better lighting or move closer to the camera.`;
        }
        setVerifyError(msg);
        setStage("preview");
      }
    } catch {
      setVerifyError("Unable to connect to verification service. Please try again.");
      setStage("preview");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* ── hidden canvas for capture ── */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── top progress bar ── */}
      <div className="h-1.5 w-full bg-blue-100">
        <div
          className="h-full rounded-r-full bg-blue-600 transition-all duration-700"
          style={{ width: stage === "verified" ? "75%" : "60%" }}
        />
      </div>

      <div className="mx-auto max-w-[560px] px-4 py-8">
        {/* ── breadcrumb ── */}
        <div className="mb-1 flex items-center gap-1.5 text-[13px] text-gray-400">
          <span>Assessment Hub</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-gray-700">
            Selfie Verification
          </span>
        </div>

        {/* ── branding ── */}
        <div className="mt-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="mt-2 text-[13px] font-bold tracking-[0.15em] text-blue-600">
            HIRE AI
          </span>
        </div>

        {/* ── heading ── */}
        <h1 className="mt-4 text-center text-[28px] font-bold leading-tight text-gray-900">
          Selfie Verification
        </h1>
        <p className="mt-1 text-center text-[14px] text-gray-500">
          Step 3 of 5: Facial Recognition
        </p>

        {/* ── camera / preview area ── */}
        <div className="mt-8">
          {stage !== "preview" && stage !== "verified" ? (
            /* ── LIVE CAMERA ── */
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* position label */}
              <div className="mb-3 flex justify-center">
                <span className="rounded-full bg-blue-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  Position Face Here
                </span>
              </div>

              {/* video container */}
              <div className="relative mx-auto aspect-[4/3] w-full max-w-[440px] overflow-hidden rounded-xl bg-gray-100">
                {cameraError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <Camera className="h-10 w-10 text-gray-300" />
                    <p className="text-[14px] text-gray-500">{cameraError}</p>
                    <button
                      type="button"
                      onClick={initCamera}
                      className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-blue-700"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />

                    {/* ── oval face guide overlay ── */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      {/* dark overlay with cutout */}
                      <svg
                        className="absolute inset-0 h-full w-full"
                        viewBox="0 0 440 330"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <defs>
                          <mask id="face-cutout">
                            <rect
                              width="440"
                              height="330"
                              fill="white"
                            />
                            <ellipse
                              cx="220"
                              cy="155"
                              rx="95"
                              ry="125"
                              fill="black"
                            />
                          </mask>
                        </defs>
                        <rect
                          width="440"
                          height="330"
                          fill="rgba(0,0,0,0.15)"
                          mask="url(#face-cutout)"
                        />
                        <ellipse
                          cx="220"
                          cy="155"
                          rx="95"
                          ry="125"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          strokeDasharray="8 6"
                          className={
                            stage === "countdown"
                              ? "animate-[spin_8s_linear_infinite]"
                              : ""
                          }
                        />
                      </svg>

                      {/* placeholder user icon (when no face detected) */}
                      {!cameraReady && (
                        <User className="h-16 w-16 text-gray-300" />
                      )}
                    </div>

                    {/* ── countdown number overlay ── */}
                    {stage === "countdown" && countdown > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/90 shadow-xl backdrop-blur-sm">
                          <span className="text-[48px] font-bold text-white animate-pulse">
                            {countdown}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ── flash effect ── */}
                    {stage === "capturing" && (
                      <div className="absolute inset-0 animate-[flash_0.4s_ease-out] bg-white" />
                    )}
                  </>
                )}
              </div>

              {/* camera status badge */}
              <div className="mt-3 flex justify-center">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${
                    cameraReady
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      cameraReady ? "bg-green-500 animate-pulse" : "bg-gray-300"
                    }`}
                  />
                  {cameraReady
                    ? stage === "countdown"
                      ? "Capturing in progress..."
                      : "Camera Ready"
                    : "Initializing..."}
                </span>
              </div>
            </div>
          ) : stage === "preview" ? (
            /* ── CAPTURED IMAGE PREVIEW ── */
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  <CheckCircle2 className="h-3 w-3" />
                  CAPTURED
                </span>
                <img
                  src={capturedImage!}
                  alt="Captured selfie"
                  className="mx-auto max-h-[360px] w-full object-cover"
                />
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <span className="text-[14px] font-medium text-gray-600">
                    Verifying your identity…
                  </span>
                </div>
              )}

              {verifyError && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-[13px] text-red-600">{verifyError}</p>
                </div>
              )}

              {!verifying && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={retake}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[14px] font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={confirmAndContinue}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[14px] font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm & Continue
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── VERIFIED SUCCESS ── */
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-[18px] font-bold text-gray-900">
                Identity Verified
              </h3>
              <p className="mt-1 text-[14px] text-gray-500">
                Your selfie has been verified successfully.
                {verifyResult?.confidence_same_person_percent != null && (
                  <span className="block mt-1 font-semibold text-green-600">
                    Match confidence: {verifyResult.confidence_same_person_percent.toFixed(1)}%
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/candidate/verification-confirm${screeningId ? `?id=${screeningId}` : ""}`)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-[14px] font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
              >
                Continue to Confirmation
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── action buttons (ready state) ── */}
        {stage === "ready" && cameraReady && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={startCountdown}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-600 px-10 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98]"
            >
              <Timer className="h-5 w-5" />
              Start Countdown
            </button>
            <button
              type="button"
              onClick={manualCapture}
              className="text-[13px] text-gray-400 underline decoration-gray-300 underline-offset-2 transition hover:text-gray-600"
            >
              Having trouble? Try manual capture
            </button>
          </div>
        )}

        {/* ── tip cards ── */}
        {(stage === "ready" || stage === "countdown") && (
          <div className="mt-8 grid grid-cols-2 gap-3">
            {tips.map((tip) => {
              const Icon = tip.icon;
              return (
                <div
                  key={tip.title}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: tip.bg }}
                    >
                      <Icon
                        className="h-4.5 w-4.5"
                        style={{ color: tip.color }}
                      />
                    </div>
                    <h4 className="text-[13px] font-bold text-gray-900">
                      {tip.title}
                    </h4>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-gray-400">
                    {tip.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── secure verification footer ── */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white px-6 py-5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-gray-600" />
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-700">
              Secure Verification
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-gray-400">
            Your facial data is encrypted and used only for identity
            authentication. We comply with global data protection standards.
          </p>
        </div>
      </div>

      {/* ── custom keyframes ── */}
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
