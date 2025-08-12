import React from "react";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentQuestion, totalQuestions }) => {
  const progressPercentage = Math.round(((currentQuestion + 1) / totalQuestions) * 100);

  return (
    <div className="w-full bg-[#1d0917] py-6 px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-white/90 text-sm md:text-base font-medium">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-white font-semibold text-sm md:text-base bg-white/10 px-3 py-1 rounded-full">
            {progressPercentage}%
          </span>
        </div>

        <div className="w-full bg-white/15 rounded-full h-2 md:h-2.5 shadow-inner">
          <div 
            className="bg-gradient-to-r from-[#913177] to-[#b8439c] h-2 md:h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};