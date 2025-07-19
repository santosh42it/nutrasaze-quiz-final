/*
  # Fix Quiz Response RLS Policies

  1. Changes
    - Update RLS policies for quiz_responses and quiz_answers tables
    - Enable public submissions while maintaining data security
    
  2. Security
    - Allow public users to submit quiz responses and answers
    - Restrict read access to authenticated users only
    - Prevent modification of existing records
*/

-- Update quiz_responses RLS policies
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
DROP POLICY IF EXISTS "Allow authenticated users to read responses" ON quiz_responses;

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

-- Update quiz_answers RLS policies
DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;
DROP POLICY IF EXISTS "Allow authenticated users to read answers" ON quiz_answers;

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