/*
  # Fix Quiz RLS Policies

  1. Changes
    - Update RLS policies for quiz_responses table
    - Update RLS policies for quiz_answers table
    - Enable proper public access for quiz submission
    
  2. Security
    - Allow public users to insert quiz responses and answers
    - Maintain read-only access for authenticated users
    - Ensure data integrity with proper foreign key constraints
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Enable public quiz submission" ON quiz_responses;
DROP POLICY IF EXISTS "Enable public quiz answer submission" ON quiz_answers;

-- Update quiz_responses policies
CREATE POLICY "Enable public quiz submission"
ON quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

-- Update quiz_answers policies
CREATE POLICY "Enable public quiz answer submission"
ON quiz_answers
FOR INSERT
TO public
WITH CHECK (true);