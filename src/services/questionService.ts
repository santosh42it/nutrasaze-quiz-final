
import { supabase } from '../lib/supabase';
import { questions as constantQuestions } from '../components/Quiz/constants';
import type { Question } from '../components/Quiz/types';

export interface DatabaseQuestion {
  id: number;
  question_text: string;
  question_type: 'text' | 'select' | 'number' | 'email' | 'tel';
  placeholder?: string;
  description?: string;
  has_text_area: boolean;
  has_file_upload: boolean;
  text_area_placeholder?: string;
  accepted_file_types?: string;
  order_index: number;
  status: 'draft' | 'active';
  question_options?: {
    option_text: string;
    order_index: number;
  }[];
}

// Convert database question to frontend Question type
const convertDatabaseQuestion = (dbQuestion: DatabaseQuestion, index: number): Question => {
  // Map database question IDs to constants IDs for validation
  const questionIdMap: { [key: number]: string } = {
    1: 'name',
    2: 'contact', 
    3: 'email',
    4: 'age',
    5: 'gender',
    6: 'mental_stress',
    7: 'energy_levels',
    8: 'joint_pain',
    9: 'skin_condition',
    10: 'sleep_quality',
    11: 'digestive_issues',
    12: 'physical_activity',
    13: 'supplements',
    14: 'health_conditions',
    15: 'blood_test'
  };

  const constantsQuestion = constantQuestions.find(q => q.id === questionIdMap[dbQuestion.id]);

  return {
    id: questionIdMap[dbQuestion.id] || `question_${dbQuestion.id}`,
    question: dbQuestion.question_text,
    type: dbQuestion.question_type,
    placeholder: dbQuestion.placeholder || undefined,
    description: dbQuestion.description || undefined,
    options: dbQuestion.question_options?.sort((a, b) => a.order_index - b.order_index).map(opt => opt.option_text),
    hasTextArea: dbQuestion.has_text_area,
    hasFileUpload: dbQuestion.has_file_upload,
    textAreaPlaceholder: dbQuestion.text_area_placeholder || undefined,
    acceptedFileTypes: dbQuestion.accepted_file_types || undefined,
    validation: constantsQuestion?.validation // Keep validation from constants
  };
};

export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    console.log('Fetching questions from database...');
    
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        question_type,
        placeholder,
        description,
        has_text_area,
        has_file_upload,
        text_area_placeholder,
        accepted_file_types,
        order_index,
        status,
        question_options (
          option_text,
          order_index
        )
      `)
      .eq('status', 'active')
      .order('order_index');

    if (questionsError) {
      console.error('Error fetching questions from database:', questionsError);
      console.log('Falling back to constants.ts questions');
      return constantQuestions;
    }

    if (!questionsData || questionsData.length === 0) {
      console.log('No questions found in database, falling back to constants.ts');
      return constantQuestions;
    }

    console.log(`Successfully fetched ${questionsData.length} questions from database`);
    
    const convertedQuestions = questionsData.map((dbQuestion, index) => 
      convertDatabaseQuestion(dbQuestion as DatabaseQuestion, index)
    );

    // Validate that we have all expected questions
    if (convertedQuestions.length < 15) {
      console.warn(`Only ${convertedQuestions.length} questions found, expected 15. Falling back to constants.ts`);
      return constantQuestions;
    }

    return convertedQuestions;

  } catch (error) {
    console.error('Exception while fetching questions:', error);
    console.log('Falling back to constants.ts questions');
    return constantQuestions;
  }
};
