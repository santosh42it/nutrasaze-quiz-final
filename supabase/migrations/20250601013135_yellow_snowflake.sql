/*
  # Fix Quiz Submission RLS Policies

  1. Changes
    - Update RLS policies for quiz_responses table to allow public submissions
    - Update RLS policies for quiz_answers table to allow public submissions
    - Ensure proper access control for both tables

  2. Security
    - Enable RLS on both tables (already enabled)
    - Allow public users to submit quiz responses and answers
    - Maintain authenticated users' read access
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;

-- Create new policies for quiz_responses
CREATE POLICY "Enable public quiz submission"
ON quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

-- Create new policies for quiz_answers
CREATE POLICY "Enable public quiz answer submission"
ON quiz_answers
FOR INSERT
TO public
WITH CHECK (true);