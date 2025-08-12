import React from "react";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentQuestion, totalQuestions }) => {
  const progressPercentage = Math.round(((currentQuestion + 1) / totalQuestions) * 100);
  
  // Define quiz sections based on question flow
  const sections = [
    { name: "Basic Info", start: 0, end: 3, icon: "👤" },
    { name: "Health Profile", start: 4, end: 8, icon: "🏥" },
    { name: "Lifestyle", start: 9, end: 12, icon: "🏃‍♂️" },
    { name: "Assessment", start: 13, end: totalQuestions - 1, icon: "📋" }
  ];

  const getCurrentSection = () => {
    return sections.find(section => 
      currentQuestion >= section.start && currentQuestion <= section.end
    ) || sections[0];
  };

  const currentSection = getCurrentSection();

  return (
    <div className="w-full bg-[#1d0917] py-4 md:py-6 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Steps */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          {sections.map((section, index) => {
            const isActive = currentQuestion >= section.start && currentQuestion <= section.end;
            const isCompleted = currentQuestion > section.end;
            const sectionProgress = isCompleted ? 100 : 
              isActive ? Math.round(((currentQuestion - section.start + 1) / (section.end - section.start + 1)) * 100) : 0;

            return (
              <div key={section.name} className="flex flex-col items-center flex-1 relative">
                {/* Step Circle */}
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-[#913177] text-white shadow-lg' 
                    : isActive 
                      ? 'bg-[#913177] text-white shadow-lg ring-2 ring-[#913177]/30' 
                      : 'bg-white/20 text-white/60'
                }`}>
                  {isCompleted ? '✓' : section.icon}
                </div>
                
                {/* Step Label */}
                <div className={`mt-2 text-center transition-all duration-300 ${
                  isActive ? 'text-white font-semibold' : 'text-white/70'
                }`}>
                  <div className="text-xs md:text-sm font-medium hidden sm:block">
                    {section.name}
                  </div>
                  {isActive && (
                    <div className="text-xs text-[#913177] font-bold bg-white/10 px-2 py-1 rounded-full mt-1">
                      {sectionProgress}%
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < sections.length - 1 && (
                  <div className="absolute top-4 md:top-5 left-1/2 w-full h-0.5 bg-white/20 -z-10">
                    <div 
                      className={`h-full bg-[#913177] transition-all duration-500 ${
                        isCompleted ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Question Counter and Overall Progress */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/90 text-sm md:text-base font-medium">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-white font-bold text-sm md:text-base bg-gradient-to-r from-[#913177] to-[#b8439c] px-3 py-1 rounded-full shadow-lg">
            {progressPercentage}%
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-white/15 rounded-full h-2 md:h-3 shadow-inner overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#913177] to-[#b8439c] h-full rounded-full transition-all duration-700 ease-out shadow-sm relative"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Current Section Info */}
        <div className="mt-3 text-center">
          <span className="text-white/80 text-xs md:text-sm">
            {currentSection.icon} {currentSection.name}
          </span>
        </div>
      </div>
    </div>
  );
};