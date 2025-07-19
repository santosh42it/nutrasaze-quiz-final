
import { supabase } from './supabase';

export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...');

    // Create questions table
    const { error: questionsError } = await supabase.rpc('create_questions_table');
    if (questionsError && !questionsError.message.includes('already exists')) {
      console.error('Error creating questions table:', questionsError);
    }

    // Create other tables...
    const tables = [
      'question_options',
      'tags', 
      'products',
      'quiz_responses',
      'quiz_answers'
    ];

    for (const table of tables) {
      const { error } = await supabase.rpc(`create_${table}_table`);
      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating ${table} table:`, error);
      }
    }

    console.log('Database setup completed');
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, error };
  }
};

// Insert sample data
export const insertSampleData = async () => {
  try {
    // Insert sample questions
    const sampleQuestions = [
      {
        question_text: 'What is your name?',
        question_type: 'text',
        placeholder: 'Enter your full name',
        has_text_area: false,
        has_file_upload: false,
        order_index: 0,
        status: 'active'
      },
      {
        question_text: 'What is your email?',
        question_type: 'email',
        placeholder: 'Enter your email address',
        has_text_area: false,
        has_file_upload: false,
        order_index: 1,
        status: 'active'
      },
      {
        question_text: 'What is your age?',
        question_type: 'number',
        placeholder: 'Enter your age',
        has_text_area: false,
        has_file_upload: false,
        order_index: 2,
        status: 'active'
      }
    ];

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(sampleQuestions);

    if (questionsError) {
      console.error('Error inserting sample questions:', questionsError);
    } else {
      console.log('Sample questions inserted successfully');
    }

    return { success: true };
  } catch (error) {
    console.error('Error inserting sample data:', error);
    return { success: false, error };
  }
};
