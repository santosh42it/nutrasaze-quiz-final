import React, { useState, useEffect } from "react";
import { Header } from "../../components/ui/header";
import { Footer } from "../../components/ui/footer";
import { QuizQuestion } from "../../components/Quiz/QuizQuestion";
import { QuizResults } from "../../components/Quiz/QuizResults";
import { questions as constantQuestions } from "../../components/Quiz/constants";
import { fetchQuestions } from "../../services/questionService";
import type { Question } from "../../components/Quiz/types";

interface QuizAnswers {
  [key: string]: string;
}

export const QuizScreen = (): JSX.Element => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>(constantQuestions);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);

  // Load questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        const fetchedQuestions = await fetchQuestions();
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        // Already falls back to constants in fetchQuestions
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  const validateInput = (value: string, questionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    if (question?.validation) {
      return question.validation(value);
    }
    return "";
  };

  const handleNext = () => {
    const currentQuestionData = questions[currentQuestion];

    // For text input questions
    if (currentQuestionData.type !== "select") {
      if (inputValue.trim() === "") {
        setValidationError("This field is required");
        return;
      }

      const error = validateInput(inputValue, currentQuestionData.id);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    // For questions with additional inputs after selecting "yes"
    if (currentQuestionData.hasTextArea && 
        answers[currentQuestionData.id] && 
        answers[currentQuestionData.id].toLowerCase().includes("yes") && 
        !additionalInfo.trim()) {
      setValidationError("Please provide the required details");
      return;
    }

    if (currentQuestionData.hasFileUpload && 
        answers[currentQuestionData.id] && 
        answers[currentQuestionData.id].toLowerCase().includes("yes") && 
        !selectedFile) {
      setValidationError("Please upload the required file");
      return;
    }

    const finalValue = currentQuestionData.id === "contact" ? 
      `+91${inputValue}` : inputValue;

    const newAnswers = {
      ...answers,
      ...(currentQuestionData.type !== "select" && {
        [currentQuestionData.id]: finalValue
      }),
      ...(currentQuestionData.hasTextArea && additionalInfo.trim() && {
        [`${currentQuestionData.id}_details`]: additionalInfo
      })
    };
    setAnswers(newAnswers);

    if (currentQuestion === questions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setInputValue("");
      setAdditionalInfo("");
      setSelectedFile(null);
      setValidationError("");
    }
  };

  const handleOptionSelect = (option: string) => {
    const currentQuestionData = questions[currentQuestion];
    const newAnswers = { ...answers };

    // Store the selected option
    newAnswers[currentQuestionData.id] = option;

    // If the question has additional inputs and "yes" is selected, wait for those inputs
    if ((currentQuestionData.hasTextArea || currentQuestionData.hasFileUpload) && 
        option.toLowerCase().includes("yes")) {
      setAnswers(newAnswers);
      setValidationError(""); // Clear any previous errors
      return; // Don't proceed to next question yet
    }

    // If "no" is selected or no additional inputs are needed, proceed to next question
    setAnswers(newAnswers);
    if (currentQuestion === questions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setInputValue("");
      setAdditionalInfo("");
      setSelectedFile(null);
      setValidationError("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setValidationError('Please upload only PDF, JPG, or PNG files');
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        setValidationError('File size should be less than 5MB');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
      setValidationError("");
    }
  };

  // Show loading state while questions are being fetched
  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e9d6e4] mx-auto mb-4"></div>
            <p className="text-[#e9d6e4] text-lg">Loading questions...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-0">
        {!showResults ? (
          <div className="min-h-[calc(100vh-72px)]">
            <QuizQuestion
              question={questions[currentQuestion] as Question}
              currentQuestion={currentQuestion}
              totalQuestions={questions.length}
              inputValue={inputValue}
              setInputValue={setInputValue}
              additionalInfo={additionalInfo}
              setAdditionalInfo={setAdditionalInfo}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              validationError={validationError}
              setValidationError={setValidationError}
              answers={answers}
              handleNext={handleNext}
              handleOptionSelect={handleOptionSelect}
              handleKeyPress={handleKeyPress}
              handleFileChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="min-h-[calc(100vh-72px)] pb-16">
            <QuizResults 
              answers={answers}
              userInfo={{
                name: answers.name,
                email: answers.email,
                contact: answers.contact,
                age: parseInt(answers.age) || 0
              }}
              selectedFile={selectedFile}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};