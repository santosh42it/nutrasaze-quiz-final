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
  isSaving,
}) => {
  const showAdditionalInputs = (question.hasTextArea || question.hasFileUpload) &&
                              answers[question.id] &&
                              answers[question.id].toLowerCase().includes("yes");

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValidationError("");
  };

  return (
    <section className="relative w-full min-h-screen bg-[#1d0917] flex flex-col">
      <ProgressBar
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
      />

      <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-6 md:py-12">
        <div className="max-w-[800px] w-full">
          <div className="flex flex-col items-center gap-8 md:gap-12">
            <div className="text-center space-y-4 md:space-y-6">
              <h2 className="[font-family:'DM_Serif_Display',Helvetica] font-normal text-white text-xl sm:text-2xl md:text-3xl lg:text-[32px] text-center tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] lg:tracking-[2.50px] leading-[1.4] sm:leading-[1.35] md:leading-[1.3] max-w-[700px] mx-auto word-wrap break-words">
                {question.question}
              </h2>
              {question.description && (
                <p className="text-white/90 text-center text-sm sm:text-base md:text-lg max-w-[600px] mx-auto leading-relaxed">
                  {question.description}
                </p>
              )}
            </div>

            <div className="w-full space-y-3 md:space-y-4 max-w-[600px] mx-auto">
              {question.type === "select" ? (
                <div className="grid grid-cols-1 gap-3 md:gap-4 w-full">
                  {question.options?.map((option) => (
                    <Button
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full h-auto min-h-[56px] md:min-h-[64px] py-4 md:py-5 px-5 md:px-6 rounded-2xl border-2 ${
                        answers[question.id] === option
                          ? "bg-[#913177] border-[#913177] text-white shadow-lg"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                      } transition-all duration-300 text-left text-sm sm:text-base md:text-lg backdrop-blur-none whitespace-normal break-words leading-relaxed font-medium`}
                    >
                      <span className="block w-full text-left">{option}</span>
                    </Button>
                  ))}

                  {showAdditionalInputs && (
                    <div className="space-y-6 mt-6 max-w-[500px] mx-auto">
                      {question.hasTextArea && (
                        <div className="space-y-3">
                          <label className="text-white text-sm md:text-base font-medium block">
                            Please provide details:
                          </label>
                          <textarea
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            placeholder={question.textAreaPlaceholder || "Please provide details..."}
                            className="w-full h-32 md:h-36 px-5 py-4 rounded-2xl border-2 border-white/30 bg-white/15 text-white placeholder:text-white/70 resize-none focus:outline-none focus:border-[#913177] backdrop-blur-none text-base transition-all duration-200"
                            style={{ backdropFilter: 'none' }}
                          />
                          {!additionalInfo.trim() && (
                            <p className="text-red-400 text-sm font-medium">Please provide the required details</p>
                          )}
                        </div>
                      )}
                      {question.hasFileUpload && (
                        <div className="space-y-3">
                          <label className="text-white text-sm md:text-base font-medium block">
                            Please upload your blood test report:
                          </label>
                          <FileUpload
                            selectedFile={selectedFile}
                            validationError={validationError}
                            handleFileChange={handleFileChange}
                            acceptedFileTypes={question.acceptedFileTypes}
                          />
                          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-400/20">
                            <div className="flex items-start gap-2 text-blue-300 text-sm">
                              <span className="text-base flex-shrink-0">🏥</span>
                              <div>
                                <p className="font-medium">Medical Document Security</p>
                                <p className="text-blue-200/80 text-xs mt-1">
                                  Your reports are encrypted and only reviewed by certified health professionals for personalized recommendations.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={handleNext}
                        disabled={isSaving}
                        className="w-full h-14 md:h-16 rounded-2xl bg-[#913177] hover:bg-[#7a2a66] text-white font-semibold text-base md:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isSaving ? 'Saving...' : 'Continue'}
                      </Button>
                      {validationError && (
                        <p className="text-red-400 text-sm text-center font-medium">{validationError}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 w-full max-w-[400px] mx-auto">
                  <div className="relative">
                    {(question.id === "contact" || question.id === "3") && (
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white font-semibold select-none z-10 text-sm md:text-base">
                        +91
                      </div>
                    )}
                    <Input
                      type={question.type}
                      placeholder={question.placeholder}
                      value={inputValue}
                      onChange={(e) => {
                        if (question.id === "contact" || question.id === "3") {
                          // For phone numbers: only allow digits, max 10 characters
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          const limitedValue = digitsOnly.slice(0, 10);
                          handleInputChange(limitedValue);
                          return;
                        }

                        const value = e.target.value;
                        if ((question.id === "age" || question.id === "41") && !/^\d*$/.test(value)) return;
                        handleInputChange(value);
                      }}
                      onKeyPress={handleKeyPress}
                      className={`w-full h-14 md:h-16 ${
                        (question.id === "contact" || question.id === "3") ? "pl-14 md:pl-16" : "px-5 md:px-6"
                      } pr-5 md:pr-6 rounded-2xl border-2 border-white/30 bg-white/15 text-white placeholder:text-white/70 focus:outline-none focus:border-[#913177] focus:bg-white/20 backdrop-blur-none text-base md:text-lg transition-all duration-200`}
                      maxLength={(question.id === "contact" || question.id === "3") ? 10 : undefined}
                      inputMode={(question.id === "contact" || question.id === "3") ? "numeric" : undefined}
                      pattern={(question.id === "contact" || question.id === "3") ? "[0-9]*" : undefined}
                      onKeyDown={(question.id === "contact" || question.id === "3") ? (e) => {
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
                    <p className="text-red-400 text-sm text-center font-medium">{validationError}</p>
                  )}
                  <Button
                    onClick={handleNext}
                    className="w-full h-14 md:h-16 rounded-2xl bg-[#913177] hover:bg-[#7a2a66] text-white font-semibold text-base md:text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continue
                  </Button>

                  {/* Trust Indicator for Contact Information */}
                  {(question.id === "contact" || question.id === "3" || question.id === "email" || question.id === "1") && (
                    <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="text-green-400 text-lg flex-shrink-0 mt-0.5">🔒</div>
                        <div className="text-white/90 text-sm leading-relaxed">
                          <p className="font-medium mb-1">Your privacy is our priority</p>
                          <p className="text-white/80">
                            Your contact details will be used by NutraSage health coach to reach out to you via call/SMS/WhatsApp for personalized health recommendations only.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Trust Indicator for Health Information */}
                  {(question.type === "select" && !["contact", "3", "email", "1", "name", "2", "age", "4"].includes(question.id)) && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-400/20">
                      <div className="flex items-center gap-2 text-green-300 text-sm">
                        <span className="text-base">🛡️</span>
                        <span className="font-medium">All health information is kept confidential and secure</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="px-6 md:px-12 pb-6">
        <div className="max-w-[600px] mx-auto">
          <div className="flex items-center justify-center gap-4 text-white/60 text-xs md:text-sm">
            <div className="flex items-center gap-1">
              <span className="text-green-400">🔐</span>
              <span>SSL Secured</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400">🏥</span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-1">
              <span className="text-purple-400">🛡️</span>
              <span>Data Protected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};