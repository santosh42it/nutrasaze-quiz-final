
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: supabaseAnonKey !== 'placeholder-key',
  hasValidCredentials
});

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});

// Create database tables if they don't exist
export const setupDatabase = async () => {
  if (!hasValidCredentials) {
    console.error('Please set up your Supabase credentials in .env file');
    return { success: false, error: 'Missing Supabase credentials' };
  }

  try {
    console.log('Setting up database tables...');

    // Create questions table
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          question_text TEXT NOT NULL,
          question_type VARCHAR(50) NOT NULL DEFAULT 'text',
          placeholder TEXT,
          has_text_area BOOLEAN DEFAULT false,
          has_file_upload BOOLEAN DEFAULT false,
          order_index INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create question_options table
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS question_options (
          id SERIAL PRIMARY KEY,
          question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
          option_text TEXT NOT NULL,
          option_value TEXT,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create tags table
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create products table
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          image_url TEXT,
          price DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create quiz_responses table
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS quiz_responses (
          id SERIAL PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          user_contact VARCHAR(50),
          user_age INTEGER,
          file_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create quiz_answers table
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS quiz_answers (
          id SERIAL PRIMARY KEY,
          response_id INTEGER REFERENCES quiz_responses(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
          answer_text TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Insert sample questions
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('count(*)', { count: 'exact' });

    if (!existingQuestions || existingQuestions.length === 0) {
      await supabase.from('questions').insert([
        {
          question_text: 'What is your name?',
          question_type: 'text',
          placeholder: 'Enter your full name',
          order_index: 0,
          status: 'active'
        },
        {
          question_text: 'What is your email?',
          question_type: 'email',
          placeholder: 'Enter your email address',
          order_index: 1,
          status: 'active'
        },
        {
          question_text: 'What is your contact number?',
          question_type: 'tel',
          placeholder: 'Enter your phone number',
          order_index: 2,
          status: 'active'
        },
        {
          question_text: 'What is your age?',
          question_type: 'number',
          placeholder: 'Enter your age',
          order_index: 3,
          status: 'active'
        }
      ]);
    }

    console.log('Database setup completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, error };
  }
};

// Create admin user function
export const createAdminUser = async () => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@nutrasage.com',
      password: 'nutrasage@123'
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Test database connection
export const testConnection = async () => {
  if (!hasValidCredentials) {
    return { connected: false, error: 'Missing Supabase credentials' };
  }

  try {
    const { data, error } = await supabase.from('questions').select('count(*)', { count: 'exact' });
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
};
