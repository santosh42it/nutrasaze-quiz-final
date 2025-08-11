import React from "react";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentQuestion,
  totalQuestions,
}) => {
  return (
    <div className="fixed top-[72px] left-0 right-0 z-50 bg-[#1d0917] px-4 md:px-8 py-4">
      <div className="max-w-[700px] mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-desktop-body-m-bold">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-white font-desktop-body-m-bold">
            {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full">
          <div
            className="h-full bg-[#913177] rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};