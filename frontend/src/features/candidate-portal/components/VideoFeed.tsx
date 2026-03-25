import React, { useRef, useEffect } from 'react';

export interface VideoFeedProps {
  isCameraOn: boolean;
  recordingTime: string;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ isCameraOn, recordingTime }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(console.error);
    } else if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    return () => stream?.getTracks().forEach(t => t.stop());
  }, [isCameraOn]);

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black rounded-xl overflow-hidden shadow-lg md:pb-8 flex flex-col">
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full z-10 shadow-[0_0_8px_rgba(239,68,68,1)]" />
       
       <div className="relative w-full flex-grow bg-gray-900 overflow-hidden sm:border-[16px] border-black sm:rounded-tl-2xl sm:rounded-tr-2xl sm:rounded-b-none">
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
