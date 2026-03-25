import React from 'react';
import { Timer } from 'lucide-react';

export interface InterviewTimerProps {
  timeLeftInSeconds: number;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({ timeLeftInSeconds }) => {
  const formattedMinutes = String(Math.floor(timeLeftInSeconds / 60)).padStart(2, '0');
  const formattedSeconds = String(timeLeftInSeconds % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full font-medium text-sm border border-blue-100">
      <Timer className="w-4 h-4" />
      <span>{formattedMinutes}:{formattedSeconds}</span>
    </div>
  );
};
