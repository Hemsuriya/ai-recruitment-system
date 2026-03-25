export interface InterviewQuestion {
  id: string;
  text: string;
  durationSeconds: number;
}

export const TOTAL_INTERVIEW_TIME_SECONDS = 45 * 60; // 45 minutes

export const mockQuestions: InterviewQuestion[] = [
  { 
    id: '1', 
    text: "Can you tell us about your background and experience?", 
    durationSeconds: 120 
  },
  { 
    id: '2', 
    text: "What are your greatest strengths and weaknesses?", 
    durationSeconds: 120 
  },
  { 
    id: '3', 
    text: "Can you describe a time you handled a difficult situation with a coworker? How did you approach the resolution?", 
    durationSeconds: 105 
  },
  { 
    id: '4', 
    text: "Where do you see yourself in 5 years?", 
    durationSeconds: 60 
  },
  { 
    id: '5', 
    text: "Why do you want to work for our company?", 
    durationSeconds: 90 
  },
  { 
    id: '6', 
    text: "Describe a successful project you led.", 
    durationSeconds: 150 
  },
  { 
    id: '7', 
    text: "How do you handle tight deadlines?", 
    durationSeconds: 90 
  },
  { 
    id: '8', 
    text: "What is your approach to learning new technologies?", 
    durationSeconds: 90 
  },
  { 
    id: '9', 
    text: "Tell us about a time you failed and what you learned.", 
    durationSeconds: 120 
  },
  { 
    id: '10', 
    text: "Do you have any questions for us?", 
    durationSeconds: 60 
  },
];
