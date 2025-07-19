/*
  # Final Fix for Quiz RLS Policies

  1. Changes
    - Completely reset RLS policies for quiz_responses and quiz_answers
    - Ensure anonymous users can insert quiz data
    - Ensure authenticated users can read quiz data
    - Grant explicit permissions to anon and authenticated roles
    
  2. Security
    - Allow public (anon) users to submit quiz responses and answers
    - Allow authenticated users to read all responses and answers
    - Prevent public users from reading or modifying existing data
*/

-- Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS quiz_responses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_answers (
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

-- Disable RLS temporarily to clean up
ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on quiz_responses
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'quiz_responses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON quiz_responses';
    END LOOP;
    
    -- Drop all policies on quiz_answers
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'quiz_answers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON quiz_answers';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create simple, clear policies for quiz_responses
CREATE POLICY "allow_anon_insert_quiz_responses"
ON quiz_responses
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "allow_authenticated_select_quiz_responses"
ON quiz_responses
FOR SELECT
TO authenticated
USING (true);

-- Create simple, clear policies for quiz_answers
CREATE POLICY "allow_anon_insert_quiz_answers"
ON quiz_answers
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "allow_authenticated_select_quiz_answers"
ON quiz_answers
FOR SELECT
TO authenticated
USING (true);

-- Grant explicit permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT INSERT ON quiz_responses TO anon;
GRANT INSERT ON quiz_answers TO anon;
GRANT SELECT ON quiz_responses TO authenticated;
GRANT SELECT ON quiz_answers TO authenticated;

-- Grant sequence permissions for auto-increment
GRANT USAGE, SELECT ON SEQUENCE quiz_responses_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE quiz_answers_id_seq TO anon;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created_at ON quiz_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email ON quiz_responses(email);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_response_id ON quiz_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- Verify the setup by checking if policies exist
DO $$
BEGIN
    -- Check if policies were created successfully
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_responses' 
        AND policyname = 'allow_anon_insert_quiz_responses'
    ) THEN
        RAISE EXCEPTION 'Failed to create quiz_responses insert policy';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_answers' 
        AND policyname = 'allow_anon_insert_quiz_answers'
    ) THEN
        RAISE EXCEPTION 'Failed to create quiz_answers insert policy';
    END IF;
    
    RAISE NOTICE 'Quiz RLS policies created successfully';
END $$;