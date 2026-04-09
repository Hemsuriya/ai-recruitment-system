import React, { useRef, useEffect } from 'react';

export interface VideoFeedProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  recordingTime: string;
  error: string | null;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  stream,
  isCameraOn,
  recordingTime,
  error,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = isCameraOn && stream ? stream : null;
    }
  }, [stream, isCameraOn]);

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black rounded-xl overflow-hidden shadow-lg md:pb-8 flex flex-col">
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full z-10 shadow-[0_0_8px_rgba(239,68,68,1)]" />

      <div className="relative w-full flex-grow bg-gray-900 overflow-hidden sm:border-[16px] border-black sm:rounded-tl-2xl sm:rounded-tr-2xl sm:rounded-b-none">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 px-6">
            <div className="text-red-400 font-semibold text-lg mb-2">
              Camera / Microphone Error
            </div>
            <p className="text-white/60 text-sm text-center max-w-md">
              {error}
            </p>
            <p className="text-white/40 text-xs mt-4 text-center">
              Please allow camera and microphone access in your browser settings,
              then reload the page.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 font-medium text-lg bg-gray-900">
                Camera is off
              </div>
            )}
          </>
        )}

        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-semibold border border-white/10">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
          REC {recordingTime}
        </div>
      </div>

      <div className="hidden sm:block h-8 bg-[#111] w-full border-t border-[#333]" />
      <div className="hidden sm:block absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-b-sm shadow-lg border border-gray-700" />
    </div>
  );
};
