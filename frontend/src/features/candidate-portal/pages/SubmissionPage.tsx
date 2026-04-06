import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SubmissionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-sans p-6">
       <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm text-center max-w-lg w-full border border-gray-100 transition-shadow">
          
          <div className="mx-auto mb-8 w-24 h-24 flex items-center justify-center relative animate-in fade-in zoom-in duration-500">
             <div className="absolute inset-0 bg-green-100 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></div>
             <div className="relative w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-10 h-10" strokeWidth={3} />
             </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Interview Submitted!</h1>
          
          <p className="text-slate-500 mb-10 text-base leading-relaxed px-4">
            Thank you for completing your interview. Our team will review your responses and be in touch shortly.
          </p>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm focus:ring-4 focus:ring-blue-100"
          >
            Return to Dashboard
          </button>
       </div>
    </div>
  );
};

export default SubmissionPage;
