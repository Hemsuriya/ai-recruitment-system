import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { InterviewTimer } from '../components/InterviewTimer';
import { ProctoringBadge } from '../components/ProctoringBadge';
import { VideoFeed } from '../components/VideoFeed';
import { QuestionCard } from '../components/QuestionCard';
import { InterviewControls } from '../components/InterviewControls';
import { mockQuestions, TOTAL_INTERVIEW_TIME_SECONDS } from '../../../mock/interviewData';
import SubmissionPage from './SubmissionPage';

const formatRecordingTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const VideoInterviewPage: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  const currentQuestion = mockQuestions[currentQuestionIndex];
  const [questionTimeLeft, setQuestionTimeLeft] = useState(currentQuestion?.durationSeconds ?? 0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(TOTAL_INTERVIEW_TIME_SECONDS);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setQuestionTimeLeft(mockQuestions[currentQuestionIndex]?.durationSeconds ?? 0);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (isComplete) return;
    
    const interval = setInterval(() => {
      setTotalTimeLeft((prev) => Math.max(0, prev - 1));
      
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentQuestionIndex((idx) => {
            if (idx < mockQuestions.length - 1) return idx + 1;
            setIsComplete(true);
            return idx;
          });
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete]);

  const advanceQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
     return <SubmissionPage />;
  }

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
          onClick={() => setIsComplete(true)}
          className="px-5 py-2 border border-blue-200 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors"
        >
          End Interview
        </button>
      </header>

      <main className="px-6 max-w-5xl mx-auto space-y-8">
        <ProctoringBadge isMicActive={!isMuted} />
        
        <VideoFeed 
          isCameraOn={isCameraOn} 
          recordingTime={formatRecordingTime(TOTAL_INTERVIEW_TIME_SECONDS - totalTimeLeft)} 
        />

        {currentQuestion && (
          <QuestionCard
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={mockQuestions.length}
            questionText={currentQuestion.text}
            timeLeftSeconds={questionTimeLeft}
            onSkip={advanceQuestion}
            onNext={advanceQuestion}
            isLastQuestion={currentQuestionIndex === mockQuestions.length - 1}
          />
        )}

        <InterviewControls
           isMuted={isMuted}
           isCameraOn={isCameraOn}
           toggleMute={() => setIsMuted(!isMuted)}
           toggleCamera={() => setIsCameraOn(!isCameraOn)}
        />
      </main>
    </div>
  );
};

export default VideoInterviewPage;
