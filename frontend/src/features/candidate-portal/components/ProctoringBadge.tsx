import React from 'react';
import { Mic, Shield } from 'lucide-react';

export interface ProctoringBadgeProps {
  isMicActive?: boolean;
  isSecure?: boolean;
}

export const ProctoringBadge: React.FC<ProctoringBadgeProps> = ({ 
  isMicActive = true, 
  isSecure = true 
}) => {
  return (
    <div className="flex flex-col sm:flex-row w-full gap-4 max-w-5xl mx-auto">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="bg-blue-50 p-2.5 rounded-full text-blue-600 shrink-0">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-0.5">
            Mic Level
          </div>
          <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
            {isMicActive ? 'Active' : 'Inactive'}
            {isMicActive && (
              <div className="flex gap-1 items-center h-4 ml-1">
                {[8, 14, 8, 10].map((h, i) => (
                   <div key={i} className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
        <div className="bg-blue-50 p-2.5 rounded-full text-blue-600 shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-0.5">
            Live Proctoring
          </div>
          <div className="text-sm font-bold text-gray-800">
            {isSecure ? 'Secure' : 'Warning'}
          </div>
        </div>
      </div>
    </div>
  );
};
