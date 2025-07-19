/*
  # Update Quiz Submission Policies

  1. Changes
    - Update RLS policies for quiz_responses table to allow public quiz submissions
    - Update RLS policies for quiz_answers table to allow public quiz submissions
    
  2. Security
    - Enable RLS on both tables
    - Allow public (anonymous) users to insert quiz responses and answers
    - Allow authenticated users to read all responses and answers
    - Prevent public users from reading or modifying existing data
*/

-- Update quiz_responses policies
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
CREATE POLICY "Enable public quiz submission"
ON quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read responses" ON quiz_responses;
CREATE POLICY "Allow authenticated users to read responses"
ON quiz_responses
FOR SELECT
TO authenticated
USING (true);

-- Update quiz_answers policies
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;
CREATE POLICY "Enable public quiz answer submission"
ON quiz_answers
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read answers" ON quiz_answers;
CREATE POLICY "Allow authenticated users to read answers"
ON quiz_answers
FOR SELECT
TO authenticated
USING (true);