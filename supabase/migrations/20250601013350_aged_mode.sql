/*
  # Fix Quiz RLS Policies

  1. Changes
    - Drop existing RLS policies for quiz_responses and quiz_answers tables
    - Create new policies that properly allow public quiz submission
    
  2. Security
    - Enable RLS on both tables
    - Add policies to allow:
      - Public users to insert new responses and answers
      - Authenticated users to read all responses and answers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
DROP POLICY IF EXISTS "Allow authenticated users to read responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;
DROP POLICY IF EXISTS "Allow authenticated users to read answers" ON quiz_answers;

-- Recreate policies for quiz_responses
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

-- Recreate policies for quiz_answers
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