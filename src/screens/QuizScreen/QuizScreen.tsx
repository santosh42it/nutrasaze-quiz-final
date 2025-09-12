import React, { useState, useEffect } from "react";
import { Header } from "../../components/ui/header";
import { Footer } from "../../components/ui/footer";
import { QuizQuestion } from "../../components/Quiz/QuizQuestion";
import { QuizResults } from "../../components/Quiz/QuizResults";
import { getQuizQuestions } from "../../services/quizService";
import { useProgressiveSave } from "../../components/Quiz/useProgressiveSave";
import { supabase } from "../../lib/supabase";
import type { Question } from "../../components/Quiz/types"; 

interface QuizAnswers {
  [key: string]: string;
}

interface QuizScreenProps {
  onNavigateToContent?: () => void;
}

export const QuizScreen = ({ onNavigateToContent }: QuizScreenProps): JSX.Element => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  // Progressive auto-save functionality
  const {
    saveData,
    isSaving,
    handleEmailSave,
    handleUserInfoSave,
    handleAnswerSave,
    handleQuizComplete,
    handleBasicInfoSave
  } = useProgressiveSave();

  // Function to handle basic information saving (name, contact, age)
  const handleBasicInfoSaveLocal = async (questionId: string, value: string): Promise<void> => {
    console.log(`Attempting to save basic info for question ${questionId} with value: ${value}`);
    try {
      if (questionId === "38") { // Name question
        console.log('Progressive save: Saving name');
        await handleBasicInfoSave('name', value);
      } else if (questionId === "3") { // Contact question
        console.log('Progressive save: Saving contact');
        const cleanContact = value.replace('+91', '');
        await handleBasicInfoSave('contact', cleanContact);
      } else if (questionId === "41") { // Age question
        console.log('Progressive save: Saving age');
        await handleBasicInfoSave('age', value);
      }
    } catch (error) {
      console.error(`Progressive save error for basic info (QID ${questionId}):`, error);
    }
  };


  // Load questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Starting to load questions...');

        // This part assumes you have a Supabase client configured and imported
        // Replace with your actual data fetching logic if not using Supabase
        // For demonstration, let's assume getQuizQuestions() fetches data correctly
        const loadedQuestions = await getQuizQuestions(); 

        if (!loadedQuestions || loadedQuestions.length === 0) {
          setError('No questions found. Please contact support.');
          return;
        }

        console.log('Loaded questions successfully:', loadedQuestions);
        setQuestions(loadedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        setError('Failed to load quiz questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Properly handle the async function to avoid unhandled promise rejections
    const initializeQuiz = async () => {
      try {
        await loadQuestions();
      } catch (error) {
        console.error('Failed to initialize quiz:', error);
        setError('Failed to initialize quiz. Please refresh the page.');
      }
    };

    initializeQuiz().catch((error) => {
      console.error('Unhandled error in quiz initialization:', error);
      setError('Quiz failed to load. Please refresh the page.');
    });
  }, []);

  const validateInput = (value: string, questionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    if (question?.validation) {
      return question.validation(value);
    }
    return "";
  };

  const handleNext = async () => {
    const currentQuestionData = questions[currentQuestion];

    if (!currentQuestionData) return; // Safety check

    // Validation for text input questions
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

    // Validation for questions with additional inputs after selecting "yes"
    if (currentQuestionData.hasTextArea && 
        answers[currentQuestionData.id] && 
        answers[currentQuestionData.id].toLowerCase().includes("yes") && 
        !additionalInfo.trim()) {
      setValidationError("Please provide the required details");
      return;
    }

    // Validation for file uploads
    if (currentQuestionData.hasFileUpload && 
        answers[currentQuestionData.id] && 
        answers[currentQuestionData.id].toLowerCase().includes("yes") && 
        !selectedFile) {
      setValidationError("Please upload the required file");
      return;
    }

    const finalValue = currentQuestionData.id === "3" ? 
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

    console.log(`Setting answer for question ${currentQuestionData.id}: ${finalValue}`);
    setAnswers(newAnswers);

    // Progressive auto-save functionality
    try {
      // We'll handle file upload securely in the handleAnswerSave function
      // No need to upload file here anymore - it will be handled securely with proper validation

      // Start progressive save from name question (first question)
      if (currentQuestionData.id === "38" && currentQuestionData.type === "text" && finalValue) {
        console.log('Progressive save: Starting with name (first question)');
        await handleBasicInfoSaveLocal(currentQuestionData.id, finalValue).catch(err => console.error('Name save error:', err));
      }
      // Save email
      else if (currentQuestionData.type === "email" && finalValue) {
        console.log('Progressive save: Saving email');
        await handleEmailSave(finalValue).catch(err => console.error('Email save error:', err));
      }
      // Save other basic info (contact, age)
      else if (["tel", "number"].includes(currentQuestionData.type) && finalValue) {
        await handleBasicInfoSaveLocal(currentQuestionData.id, finalValue).catch(err => console.error('Basic info save error:', err));
      }

      // Save all other answers (only after we have a response ID)
      if (saveData.responseId && currentQuestionData.type === "select") {
        console.log('Progressive save: Saving answer for question', currentQuestionData.id);
        await handleAnswerSave(
          currentQuestionData.id,
          answers[currentQuestionData.id] || finalValue,
          additionalInfo || undefined,
          selectedFile || undefined // Pass file directly for secure upload
        ).catch(err => console.error('Answer save error:', err));
      } else if (saveData.responseId && currentQuestionData.type !== "select") {
        // Also save other types of answers if they are not basic info and have a responseId
        await handleAnswerSave(
          currentQuestionData.id,
          finalValue,
          additionalInfo || undefined,
          selectedFile || undefined // Pass file directly for secure upload
        ).catch(err => console.error('Answer save error:', err));
      }

    } catch (error) {
      console.error('Progressive save error:', error);
      // Don't block user progress on save errors
    }

    if (currentQuestion === questions.length - 1) {
      console.log('Quiz completed, showing results with answers:', newAnswers);

      // Mark quiz as completed
      try {
        if (saveData.responseId) {
          await handleQuizComplete();
        }
      } catch (error) {
        console.error('Error completing quiz:', error);
      }

      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setInputValue("");
      setAdditionalInfo("");
      setSelectedFile(null);
      setValidationError("");
    }
  };

  const handleOptionSelect = async (option: string) => {
    const currentQuestionData = questions[currentQuestion];
    if (!currentQuestionData) return;

    const newAnswers = { ...answers };
    newAnswers[currentQuestionData.id] = option;

    // If the question has additional inputs and "yes" is selected, wait for those inputs
    if ((currentQuestionData.hasTextArea || currentQuestionData.hasFileUpload) && 
        option.toLowerCase().includes("yes")) {
      setAnswers(newAnswers);
      setValidationError(""); // Clear any previous errors
      return; // Don't proceed to next question yet
    }

    // Progressive auto-save for select options
    try {
      if (saveData.responseId) {
        console.log('Progressive save: Saving option selection for question', currentQuestionData.id);
        await handleAnswerSave(
          currentQuestionData.id, 
          option, 
          additionalInfo || undefined, 
          selectedFile || undefined // Pass file directly for secure upload
        ).catch(err => console.error('Option save error:', err));
      }
    } catch (error) {
      console.error('Progressive save error for option:', error);
    }

    // If "no" is selected or no additional inputs are needed, proceed to next question
    setAnswers(newAnswers);
    if (currentQuestion === questions.length - 1) {
      console.log('Quiz completed via option select, showing results with answers:', newAnswers);

      // Mark quiz as completed
      try {
        if (saveData.responseId) {
          await handleQuizComplete();
        }
      } catch (error) {
        console.error('Error completing quiz:', error);
      }

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

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#913177] mx-auto mb-4"></div>
            <p className="text-[#1d0917] font-desktop-body-l-regular">Loading quiz questions...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-desktop-body-l-regular mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#913177] text-white px-6 py-2 rounded hover:bg-[#913177]/90"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show quiz if questions are loaded and we have at least one question
  if (questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#1d0917] font-desktop-body-l-regular">No quiz questions available.</p>
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
          // Add urgency timer here for customers on the results page
          <div className="min-h-[calc(100vh-72px)] pb-16">
            <QuizResults 
              answers={answers}
              userInfo={{
                name: answers['38'] || answers.name || '', // Question ID 38 is the name question
                email: answers['39'] || answers.email || '', // Question ID 39 is the email question  
                contact: (answers['3'] || answers.contact || '').replace(/^\+91/, ''), // Question ID 3 is contact
                age: answers['41'] || answers.age || '0' // Question ID 41 is age
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