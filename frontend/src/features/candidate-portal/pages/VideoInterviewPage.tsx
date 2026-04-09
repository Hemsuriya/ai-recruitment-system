import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, AlertTriangle, Loader2, CheckCircle, X } from 'lucide-react';
import { InterviewTimer } from '../components/InterviewTimer';
import { ProctoringBadge } from '../components/ProctoringBadge';
import { VideoFeed } from '../components/VideoFeed';
import { QuestionCard } from '../components/QuestionCard';
import { InterviewControls } from '../components/InterviewControls';
import SubmissionPage from './SubmissionPage';
import {
  videoInterviewApi,
  type VideoQuestion,
} from '../../../services/api';

interface DeviceOption {
  deviceId: string;
  label: string;
}

const formatRecordingTime = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

const VideoInterviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoAssessmentId = searchParams.get('id') || '';

  // ── Data fetching state ──────────────────────────────────
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // ── Interview progress ───────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const currentQIdxRef = useRef(0);

  // ── Media state ──────────────────────────────────────────
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState<DeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceOption[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isApplyingDevices, setIsApplyingDevices] = useState(false);

  // ── Recording state ──────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobsRef = useRef<Map<number, Blob>>(new Map());
  const advancingRef = useRef(false);
  const submittingRef = useRef(false);
  const interviewStartedRef = useRef(false);

  // ── Missing assessment ID ────────────────────────────────
  if (!videoAssessmentId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md border border-gray-100">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Missing Assessment ID</h1>
          <p className="text-gray-500 text-sm">
            Please use the link from your invitation email to access the video interview.
          </p>
        </div>
      </div>
    );
  }

  // ── Fetch questions from backend ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await videoInterviewApi.getQuestions(videoAssessmentId);
        if (cancelled) return;
        if (data.questions.length === 0) {
          setFetchError('No interview questions are available yet. Please try again later.');
          return;
        }
        setQuestions(data.questions);
        setTotalDuration(data.total_duration);
        setTotalTimeLeft(data.total_duration);
        setQuestionTimeLeft(data.questions[0].time_limit);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load interview questions';
          if (msg.toLowerCase().includes('already completed')) {
            setAlreadyCompleted(true);
          } else {
            setFetchError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [videoAssessmentId]);

  // ── Acquire camera + mic stream ──────────────────────────
  useEffect(() => {
    let acquired: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        acquired = s;
        setStream(s);
      })
      .catch((err) => {
        let msg = 'Could not access camera or microphone.';
        if (err.name === 'NotAllowedError') {
          msg = 'Camera and microphone permissions were denied.';
        } else if (err.name === 'NotFoundError') {
          msg = 'No camera or microphone found on this device.';
        }
        setStreamError(msg);
      });

    return () => {
      acquired?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const refreshDeviceOptions = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const nextVideo = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${idx + 1}`,
        }));

      const nextAudio = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${idx + 1}`,
        }));

      setVideoDevices(nextVideo);
      setAudioDevices(nextAudio);

      if (!selectedVideoDeviceId && nextVideo.length > 0) {
        setSelectedVideoDeviceId(nextVideo[0].deviceId);
      }
      if (!selectedAudioDeviceId && nextAudio.length > 0) {
        setSelectedAudioDeviceId(nextAudio[0].deviceId);
      }
    } catch {
      setSettingsError('Unable to read media devices. Check browser permissions and try again.');
    }
  }, [selectedAudioDeviceId, selectedVideoDeviceId]);

  useEffect(() => {
    if (!stream) return;

    const currentVideo = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
    const currentAudio = stream.getAudioTracks()[0]?.getSettings()?.deviceId;

    if (currentVideo) setSelectedVideoDeviceId(currentVideo);
    if (currentAudio) setSelectedAudioDeviceId(currentAudio);
  }, [stream]);

  const openSettings = useCallback(async () => {
    setSettingsError(null);
    setIsSettingsOpen(true);
    await refreshDeviceOptions();
  }, [refreshDeviceOptions]);

  const applySelectedDevices = useCallback(async () => {
    setSettingsError(null);
    setIsApplyingDevices(true);

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true,
        audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true,
      });

      nextStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      nextStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });

      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return nextStream;
      });

      setIsSettingsOpen(false);
    } catch {
      setSettingsError('Could not apply selected devices. Verify permissions and selected hardware.');
    } finally {
      setIsApplyingDevices(false);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId, isMuted, isCameraOn]);

  // ── Recording helpers ────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    if (!mimeType) return;

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error('MediaRecorder start failed:', err);
    }
  }, [stream]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        resolve(blob.size > 0 ? blob : null);
      };
      recorder.stop();
    });
  }, []);

  // ── Start recording when both stream + questions are ready
  useEffect(() => {
    if (stream && questions.length > 0 && !interviewStartedRef.current && !isComplete) {
      interviewStartedRef.current = true;
      startRecording();
    }
  }, [stream, questions, isComplete, startRecording]);

  // ── Advance to next question ─────────────────────────────
  const advanceQuestion = useCallback(async () => {
    if (advancingRef.current || isComplete) return;
    advancingRef.current = true;

    const blob = await stopRecording();
    if (blob) recordedBlobsRef.current.set(currentQIdxRef.current, blob);

    const nextIdx = currentQIdxRef.current + 1;
    if (nextIdx < questions.length) {
      currentQIdxRef.current = nextIdx;
      setCurrentQuestionIndex(nextIdx);
      startRecording();
    } else {
      setIsComplete(true);
    }

    advancingRef.current = false;
  }, [questions.length, stopRecording, startRecording, isComplete]);

  // ── End interview manually ───────────────────────────────
  const endInterview = useCallback(async () => {
    if (submittingRef.current || advancingRef.current) return;
    submittingRef.current = true;
    const blob = await stopRecording();
    if (blob) recordedBlobsRef.current.set(currentQIdxRef.current, blob);
    setIsComplete(true);
  }, [stopRecording]);

  // ── Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (isComplete || loading || questions.length === 0) return;

    const interval = setInterval(() => {
      setTotalTimeLeft((prev) => Math.max(0, prev - 1));
      setQuestionTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete, loading, questions.length]);

  // Auto-advance when question timer expires
  useEffect(() => {
    if (questionTimeLeft === 0 && questions.length > 0 && !isComplete && interviewStartedRef.current) {
      advanceQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTimeLeft]);

  // Force-finish when total timer expires
  useEffect(() => {
    if (totalTimeLeft === 0 && questions.length > 0 && !isComplete && interviewStartedRef.current) {
      endInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTimeLeft]);

  // Reset question timer on question change
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setQuestionTimeLeft(questions[currentQuestionIndex].time_limit);
    }
  }, [currentQuestionIndex, questions]);

  // ── Proctoring: tab visibility listeners ─────────────────
  useEffect(() => {
    if (!videoAssessmentId || isComplete || questions.length === 0) return;

    const handleVisibilityChange = () => {
      const eventType = document.hidden ? 'tab_blur' : 'tab_focus';
      videoInterviewApi.logProctoringEvent(
        videoAssessmentId,
        eventType,
        currentQIdxRef.current
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [videoAssessmentId, isComplete, questions.length]);

  // ── Media controls (real stream track toggling) ──────────
  const toggleMute = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setIsMuted((prev) => !prev);
  }, [stream]);

  const toggleCamera = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setIsCameraOn((prev) => !prev);
  }, [stream]);

  // ── Cleanup stream on interview complete ─────────────────
  useEffect(() => {
    if (isComplete && stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  }, [isComplete, stream]);

  // ── Render: Submission ───────────────────────────────────
  if (isComplete) {
    return (
      <SubmissionPage
        blobs={recordedBlobsRef.current}
        videoAssessmentId={videoAssessmentId}
        questions={questions}
      />
    );
  }

  // ── Render: Already completed ─────────────────────────────
  if (alreadyCompleted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            This interview has already been submitted.
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your responses were received. Our team will review them and be in touch shortly.
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close This Tab
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 font-medium">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  // ── Render: Fetch error ──────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md border border-gray-100">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Interview</h1>
          <p className="text-gray-500 text-sm mb-6">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Interview ────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];
  const elapsed = totalDuration - totalTimeLeft;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 sticky top-0 z-10 w-full mb-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Candidate Interview</h1>
        </div>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <InterviewTimer timeLeftInSeconds={totalTimeLeft} />
        </div>

        <button
          onClick={endInterview}
          className="px-5 py-2 border border-blue-200 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors"
        >
          End Interview
        </button>
      </header>

      <main className="px-6 max-w-5xl mx-auto space-y-8">
        <ProctoringBadge isMicActive={!isMuted} />

        <VideoFeed
          stream={stream}
          isCameraOn={isCameraOn}
          recordingTime={formatRecordingTime(elapsed)}
          error={streamError}
        />

        {currentQuestion && (
          <QuestionCard
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            questionText={currentQuestion.text}
            timeLeftSeconds={questionTimeLeft}
            onSkip={advanceQuestion}
            onNext={advanceQuestion}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
          />
        )}

        <InterviewControls
          isMuted={isMuted}
          isCameraOn={isCameraOn}
          toggleMute={toggleMute}
          toggleCamera={toggleCamera}
          openSettings={openSettings}
        />
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Interview Settings</h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Camera</label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  {videoDevices.length === 0 ? (
                    <option value="">No camera devices found</option>
                  ) : (
                    videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Microphone</label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  {audioDevices.length === 0 ? (
                    <option value="">No microphone devices found</option>
                  ) : (
                    audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {settingsError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {settingsError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applySelectedDevices}
                disabled={isApplyingDevices}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isApplyingDevices ? 'Applying...' : 'Apply Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInterviewPage;
