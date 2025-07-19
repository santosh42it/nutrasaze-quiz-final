/*
  # Final Quiz Tables Setup

  1. New Tables
    - Ensure quiz_responses table exists with proper structure
    - Ensure quiz_answers table exists with proper structure
    - Add proper indexes for performance
    
  2. Security
    - Enable RLS on both tables
    - Add policies for public quiz submission
    - Add policies for authenticated admin access
    
  3. Data Integrity
    - Add proper foreign key constraints
    - Add check constraints for data validation
*/

-- Create quiz_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_responses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_answers table if it doesn't exist
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created_at ON quiz_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email ON quiz_responses(email);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_response_id ON quiz_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- Add trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_quiz_responses_updated_at ON quiz_responses;
CREATE TRIGGER update_quiz_responses_updated_at
  BEFORE UPDATE ON quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
DROP POLICY IF EXISTS "Allow authenticated users to read responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;
DROP POLICY IF EXISTS "Allow authenticated users to read answers" ON quiz_answers;

-- Create policies for quiz_responses
CREATE POLICY "Enable public quiz submission"
ON quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read responses"
ON quiz_responses
FOR SELECT
TO authenticated
USING (true);

-- Create policies for quiz_answers
CREATE POLICY "Enable public quiz answer submission"
ON quiz_answers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read answers"
ON quiz_answers
FOR SELECT
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT INSERT ON quiz_responses TO anon;
GRANT INSERT ON quiz_answers TO anon;
GRANT USAGE ON SEQUENCE quiz_responses_id_seq TO anon;
GRANT USAGE ON SEQUENCE quiz_answers_id_seq TO anon;

GRANT SELECT ON quiz_responses TO authenticated;
GRANT SELECT ON quiz_answers TO authenticated;
GRANT SELECT ON questions TO authenticated;