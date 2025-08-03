import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { QuestionProps } from "./types";
import { FileUpload } from "./components/FileUpload";
import { ProgressBar } from "./components/ProgressBar";

export const QuizQuestion: React.FC<QuestionProps> = ({
  question,
  currentQuestion,
  totalQuestions,
  inputValue,
  setInputValue,
  additionalInfo,
  setAdditionalInfo,
  selectedFile,
  setSelectedFile,
  validationError,
  setValidationError,
  answers,
  handleNext,
  handleOptionSelect,
  handleKeyPress,
  handleFileChange,
}) => {
  const showAdditionalInputs = (question.hasTextArea || question.hasFileUpload) && 
                              answers[question.id] && 
                              answers[question.id].toLowerCase().includes("yes");

  return (
    <section className="relative w-full min-h-screen bg-[#1d0917] px-4 md:px-8 py-20 md:py-24">
      <ProgressBar 
        currentQuestion={currentQuestion} 
        totalQuestions={totalQuestions} 
      />

      <div className="max-w-[700px] mx-auto mt-16">
        <div className="flex flex-col items-center gap-8">
          <h2 className="[font-family:'DM_Serif_Display',Helvetica] font-normal text-white text-2xl md:text-[32px] text-center tracking-[2.50px] leading-[1.2] md:leading-[48px]">
            {question.question}
          </h2>
          {question.description && (
            <p className="text-white text-center text-base md:text-lg max-w-[600px]">
              {question.description}
            </p>
          )}

          <div className="w-full space-y-4">
            {question.type === "select" ? (
              <div className="grid grid-cols-1 gap-4 w-full">
                {question.options?.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full h-auto py-4 px-6 rounded-xl border-2 ${
                      answers[question.id] === option
                        ? "bg-[#913177] border-[#913177] text-white"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    } transition-all duration-300 text-left text-base md:text-lg backdrop-blur-none`}
                  >
                    {option}
                  </Button>
                ))}
                
                {showAdditionalInputs && (
                  <div className="space-y-4 mt-4">
                    {question.hasTextArea && (
                      <div className="space-y-2">
                        <label className="text-white text-sm font-medium">
                          Please provide details:
                        </label>
                        <textarea
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          placeholder={question.textAreaPlaceholder || "Please provide details..."}
                          className="w-full h-32 px-4 py-3 rounded-xl border-2 border-white/30 bg-white/15 text-white placeholder:text-white/70 resize-none focus:outline-none focus:border-[#913177] backdrop-blur-none"
                          style={{ backdropFilter: 'none' }}
                        />
                        {!additionalInfo.trim() && (
                          <p className="text-red-400 text-sm">Please provide the required details</p>
                        )}
                      </div>
                    )}
                    {question.hasFileUpload && (
                      <div className="space-y-2">
                        <label className="text-white text-sm font-medium">
                          Please upload your blood test report:
                        </label>
                        <FileUpload
                          selectedFile={selectedFile}
                          validationError={validationError}
                          handleFileChange={handleFileChange}
                          acceptedFileTypes={question.acceptedFileTypes}
                        />
                      </div>
                    )}
                    <Button
                      onClick={handleNext}
                      className="w-full h-12 rounded-3xl bg-[#913177] text-white font-desktop-body-m-bold shadow-drop-shadow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </Button>
                    {validationError && (
                      <p className="text-red-400 text-sm text-center">{validationError}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 w-full">
                <div className="relative">
                  {question.id === "contact" && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-semibold select-none z-10">
                      +91
                    </div>
                  )}
                  <Input
                    type={question.type}
                    placeholder={question.placeholder}
                    value={inputValue}
                    onChange={(e) => {
                      if (question.id === "contact") {
                        // For phone numbers: only allow digits, max 10 characters
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        const limitedValue = digitsOnly.slice(0, 10);
                        setInputValue(limitedValue);
                        setValidationError("");
                        return;
                      }
                      
                      const value = e.target.value;
                      if (question.id === "age" && !/^\d*$/.test(value)) return;
                      setInputValue(value);
                      setValidationError("");
                    }}
                    onKeyPress={handleKeyPress}
                    className={`w-full h-12 ${
                      question.id === "contact" ? "pl-12" : "px-6"
                    } rounded-xl border-2 border-white/30 bg-white/15 text-white placeholder:text-white/70 focus:outline-none focus:border-[#913177] focus:bg-white/20 backdrop-blur-none`}
                    maxLength={question.id === "contact" ? 10 : undefined}
                    inputMode={question.id === "contact" ? "numeric" : undefined}
                    pattern={question.id === "contact" ? "[0-9]*" : undefined}
                    onKeyDown={question.id === "contact" ? (e) => {
                      // Prevent typing if already at 10 digits (except backspace, delete, arrow keys)
                      if (inputValue.length >= 10 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                      // Only allow numbers and control keys
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    } : undefined}
                    style={{ backdropFilter: 'none' }}
                  />
                </div>
                {validationError && (
                  <p className="text-red-500 text-sm">{validationError}</p>
                )}
                <Button
                  onClick={handleNext}
                  className="w-full h-12 rounded-3xl bg-[#913177] text-white font-desktop-body-m-bold shadow-drop-shadow-button-primary"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};