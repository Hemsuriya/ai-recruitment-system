import React from 'react';
import { SkipForward, ArrowRight } from 'lucide-react';

export interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  timeLeftSeconds: number;
  onSkip: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  questionText,
  timeLeftSeconds,
  onSkip,
  onNext,
  isLastQuestion
}) => {
  const formattedMinutes = String(Math.floor(timeLeftSeconds / 60)).padStart(2, '0');
  const formattedSeconds = String(timeLeftSeconds % 60).padStart(2, '0');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
          Question {questionNumber} of {totalQuestions}
        </div>
        <div className="text-sm font-medium text-gray-400">
          Remaining: {formattedMinutes}:{formattedSeconds}
        </div>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10 text-center max-w-4xl mx-auto">
        {questionText}
      </h2>

      <div className="flex justify-center items-center gap-4">
         <button 
           onClick={onSkip}
           className="flex items-center gap-2 px-6 py-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-semibold rounded-xl transition-colors text-sm"
         >
           <SkipForward className="w-5 h-5" /> Skip
         </button>
         <button 
           onClick={onNext}
           className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
         >
           {isLastQuestion ? 'Finish Interview' : 'Next Question'} <ArrowRight className="w-5 h-5" />
         </button>
      </div>
    </div>
  );
};
