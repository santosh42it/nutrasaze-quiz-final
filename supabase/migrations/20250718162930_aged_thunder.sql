/*
  # Fix Quiz Response RLS Policies

  1. Changes
    - Drop existing conflicting RLS policies
    - Create new policies that properly allow public quiz submission
    - Ensure anonymous users can insert quiz responses and answers
    - Maintain authenticated user read access
    
  2. Security
    - Enable RLS on both tables
    - Allow public (anonymous) users to insert quiz responses and answers
    - Allow authenticated users to read all responses and answers
    - Prevent public users from reading or modifying existing data
*/

-- Ensure RLS is enabled
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
DROP POLICY IF EXISTS "Allow authenticated users to read responses" ON quiz_responses;
DROP POLICY IF EXISTS "Allow authenticated read access" ON quiz_responses;
DROP POLICY IF EXISTS "Allow public insert" ON quiz_responses;

DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;
DROP POLICY IF EXISTS "Allow authenticated users to read answers" ON quiz_answers;
DROP POLICY IF EXISTS "Allow authenticated read access" ON quiz_answers;
DROP POLICY IF EXISTS "Allow public insert" ON quiz_answers;

-- Create new policies for quiz_responses
CREATE POLICY "Allow public quiz submission"
ON quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated read access"
ON quiz_responses
FOR SELECT
TO authenticated
USING (true);

-- Create new policies for quiz_answers
CREATE POLICY "Allow public quiz answer submission"
ON quiz_answers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated read access"
ON quiz_answers
FOR SELECT
TO authenticated
USING (true);

-- Grant necessary permissions explicitly
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant INSERT permissions to anonymous users
GRANT INSERT ON quiz_responses TO anon;
GRANT INSERT ON quiz_answers TO anon;

-- Grant sequence usage to anonymous users
GRANT USAGE ON SEQUENCE quiz_responses_id_seq TO anon;
GRANT USAGE ON SEQUENCE quiz_answers_id_seq TO anon;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON quiz_responses TO authenticated;
GRANT SELECT ON quiz_answers TO authenticated;
GRANT SELECT ON questions TO authenticated;
GRANT SELECT ON question_options TO authenticated;

-- Ensure the tables exist with proper structure
DO $$ 
BEGIN
  -- Check if quiz_responses table exists and has correct structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_responses') THEN
    CREATE TABLE quiz_responses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      contact TEXT NOT NULL,
      age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;

  -- Check if quiz_answers table exists and has correct structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_answers') THEN
    CREATE TABLE quiz_answers (
      id SERIAL PRIMARY KEY,
      response_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      additional_info TEXT,
      file_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_quiz_answers_response_id 
        FOREIGN KEY (response_id) 
        REFERENCES quiz_responses(id) 
        ON DELETE CASCADE
    );
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created_at ON quiz_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email ON quiz_responses(email);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_response_id ON quiz_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);