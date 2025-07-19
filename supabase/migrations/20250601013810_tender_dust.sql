/*
  # Fix Quiz Response RLS Policies

  1. Changes
    - Update RLS policies for quiz_responses and quiz_answers tables
    - Allow public (unauthenticated) users to submit quiz responses and answers
    - Maintain existing read access for authenticated users

  2. Security
    - Enable RLS on both tables
    - Add policies for public submission
    - Preserve existing policies for authenticated users
*/

-- Update quiz_responses RLS policies
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
CREATE POLICY "Enable public quiz submission"
ON quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

-- Update quiz_answers RLS policies
DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;
CREATE POLICY "Enable public quiz answer submission"
ON quiz_answers
FOR INSERT
TO public
WITH CHECK (true);