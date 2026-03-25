import React from 'react';
import { Mic, MicOff, Video, VideoOff, Settings } from 'lucide-react';

export interface InterviewControlsProps {
  isMuted: boolean;
  isCameraOn: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
}

export const InterviewControls: React.FC<InterviewControlsProps> = ({
  isMuted,
  isCameraOn,
  toggleMute,
  toggleCamera
}) => {
  return (
    <div className="flex flex-col items-center pb-16">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-8 italic">
         <div className="flex items-end gap-1 h-3.5 text-blue-500 mr-1">
            {[6, 14, 18, 10].map((h, i) => (
              <div key={i} className="w-1 bg-current rounded-full animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 150}ms` }} />
            ))}
         </div>
         Listening for your response...
      </div>
      
      <div className="flex items-center gap-6">
        <button onClick={toggleMute} className="flex flex-col items-center gap-2 group">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white shadow-sm border border-gray-100 text-gray-500' : 'bg-white shadow-md text-gray-700 group-hover:bg-gray-50'}`}>
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </div>
          <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Mute</span>
        </button>

        <button onClick={toggleCamera} className="flex flex-col items-center gap-2 group">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isCameraOn ? 'bg-blue-600 text-white shadow-md group-hover:bg-blue-700' : 'bg-white border-2 border-gray-200 text-gray-700 group-hover:bg-gray-50'}`}>
            {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
            Camera {isCameraOn ? 'On' : 'Off'}
          </span>
        </button>

        <button className="flex flex-col items-center gap-2 group">
          <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 text-gray-500 rounded-full flex items-center justify-center group-hover:bg-gray-50 transition-all">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Settings</span>
        </button>
      </div>
    </div>
  );
};
