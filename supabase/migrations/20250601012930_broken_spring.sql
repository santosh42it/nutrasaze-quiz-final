/*
  # Fix Quiz Responses RLS Policies

  1. Changes
    - Update RLS policies for quiz_responses and quiz_answers tables
    - Enable proper public access for quiz submission
    - Maintain authenticated user access for reading responses

  2. Security
    - Allow public users to submit quiz responses and answers
    - Restrict read access to authenticated users only
    - Ensure data integrity with proper foreign key constraints
*/

-- Update quiz_responses policies
DROP POLICY IF EXISTS "Allow public insert" ON quiz_responses;
DROP POLICY IF EXISTS "Allow authenticated read access" ON quiz_responses;

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

-- Update quiz_answers policies
DROP POLICY IF EXISTS "Allow public insert" ON quiz_answers;
DROP POLICY IF EXISTS "Allow authenticated read access" ON quiz_answers;

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