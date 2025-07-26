
import { supabase } from '../lib/supabase';
import type { Question as DBQuestion, QuestionOption } from '../types/database';
import type { Question } from '../components/Quiz/types';

export interface QuizQuestionFromDB extends DBQuestion {
  options?: QuestionOption[];
}

export const loadQuestionsFromDatabase = async (): Promise<Question[]> => {
  try {
    console.log('Loading questions from database...');
    
    // Fetch active questions with their options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        question_options (
          id,
          option_text,
          order_index
        )
      `)
      .eq('status', 'active')
      .order('order_index');

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    if (!questions || questions.length === 0) {
      console.log('No active questions found in database');
      return [];
    }

    // Transform database questions to match the Quiz component format
    const transformedQuestions: Question[] = questions.map((dbQuestion: any) => {
      const question: Question = {
        id: dbQuestion.id.toString(),
        question: dbQuestion.question_text,
        type: dbQuestion.question_type,
        placeholder: dbQuestion.placeholder || undefined,
        description: dbQuestion.description || undefined,
        hasTextArea: dbQuestion.has_text_area || false,
        hasFileUpload: dbQuestion.has_file_upload || false,
        textAreaPlaceholder: dbQuestion.text_area_placeholder || undefined,
        acceptedFileTypes: dbQuestion.accepted_file_types || undefined
      };

      // Add options if it's a select type question
      if (dbQuestion.question_type === 'select' && dbQuestion.question_options) {
        question.options = dbQuestion.question_options
          .sort((a: QuestionOption, b: QuestionOption) => a.order_index - b.order_index)
          .map((option: QuestionOption) => option.option_text);
      }

      // Add validation function based on question type
      if (dbQuestion.question_type === 'email') {
        question.validation = (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) ? "" : "Please enter a valid email address";
        };
      } else if (dbQuestion.question_type === 'tel') {
        question.validation = (value: string) => {
          const phoneRegex = /^[0-9]{10}$/;
          return phoneRegex.test(value) ? "" : "Please enter a 10-digit phone number";
        };
      } else if (dbQuestion.question_type === 'number') {
        question.validation = (value: string) => {
          const num = parseInt(value);
          if (isNaN(num)) return "Please enter a valid number";
          if (num < 1 || num > 120) return "Please enter a valid age between 1 and 120";
          return "";
        };
      }

      return question;
    });

    console.log(`Loaded ${transformedQuestions.length} questions from database`);
    return transformedQuestions;

  } catch (error) {
    console.error('Error loading questions from database:', error);
    throw error;
  }
};

// Fallback static questions (same as your current constants.ts)
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: "name",
    question: "What's your name?",
    type: "text",
    placeholder: "Enter your name"
  },
  {
    id: "email",
    question: "What's your email address?",
    type: "email",
    placeholder: "Enter your email",
    validation: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? "" : "Please enter a valid email address";
    }
  },
  {
    id: "contact",
    question: "What's your contact number?",
    type: "tel",
    placeholder: "Enter 10-digit number",
    description: "We'll prefix +91 to your number",
    validation: (value: string) => {
      if (value.length !== 10) return "Please enter exactly 10 digits";
      if (!/^[6-9]\d{9}$/.test(value)) return "Indian mobile numbers must start with 6, 7, 8, or 9";
      return "";
    }
  },
  {
    id: "age",
    question: "What's your age?",
    type: "number",
    placeholder: "Enter your age",
    validation: (value: string) => {
      const age = parseInt(value);
      if (isNaN(age)) return "Please enter a valid age";
      if (age < 1 || age > 120) return "Please enter a valid age between 1 and 120";
      return "";
    }
  },
  {
    id: "health_goals",
    question: "What are your primary health goals?",
    type: "select",
    options: [
      "Weight management",
      "Improved energy levels",
      "Better sleep quality",
      "Enhanced immune system",
      "Digestive health",
      "Muscle building",
      "General wellness"
    ]
  },
  {
    id: "current_supplements",
    question: "Are you currently taking any supplements or medications?",
    type: "select",
    options: ["Yes", "No"],
    hasTextArea: true,
    textAreaPlaceholder: "Please list the supplements or medications you're currently taking"
  },
  {
    id: "allergies",
    question: "Do you have any known allergies or dietary restrictions?",
    type: "select",
    options: ["Yes", "No"],
    hasTextArea: true,
    textAreaPlaceholder: "Please describe your allergies or dietary restrictions"
  },
  {
    id: "medical_conditions",
    question: "Do you have any medical conditions or are under medical supervision?",
    type: "select",
    options: ["Yes", "No"],
    hasTextArea: true,
    textAreaPlaceholder: "Please describe your medical conditions"
  },
  {
    id: "lab_reports",
    question: "Do you have recent lab reports or health assessments?",
    type: "select",
    options: ["Yes", "No"],
    hasFileUpload: true,
    acceptedFileTypes: ".pdf,.jpg,.jpeg,.png"
  }
];

export const getQuizQuestions = async (): Promise<Question[]> => {
  try {
    const dbQuestions = await loadQuestionsFromDatabase();
    
    // If we have questions from database, use them
    if (dbQuestions.length > 0) {
      console.log('Using questions from database');
      return dbQuestions;
    }
    
    // Otherwise, fallback to static questions
    console.log('Falling back to static questions');
    return FALLBACK_QUESTIONS;
    
  } catch (error) {
    console.error('Error loading questions, using fallback:', error);
    return FALLBACK_QUESTIONS;
  }
};
