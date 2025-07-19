/*
  # Definitive RLS Policy Fix for Quiz Responses

  This migration completely resets and fixes the RLS policies for quiz_responses and quiz_answers tables.
  
  1. Security Changes
    - Temporarily disable RLS to clean up
    - Drop all existing policies completely
    - Create simple, working policies for anonymous users
    - Re-enable RLS with proper permissions
  
  2. Tables Affected
    - quiz_responses: Allow anonymous INSERT, authenticated SELECT
    - quiz_answers: Allow anonymous INSERT, authenticated SELECT
*/

-- Temporarily disable RLS to clean up
ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (using dynamic SQL to handle any policy names)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on quiz_responses
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_responses' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_responses', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on quiz_answers
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_answers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_answers', policy_record.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for quiz_responses
CREATE POLICY "allow_anonymous_insert_quiz_responses" 
ON quiz_responses 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "allow_authenticated_select_quiz_responses" 
ON quiz_responses 
FOR SELECT 
TO authenticated 
USING (true);

-- Create simple, working policies for quiz_answers
CREATE POLICY "allow_anonymous_insert_quiz_answers" 
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
GRANT INSERT ON quiz_responses TO anon;
GRANT INSERT ON quiz_answers TO anon;
GRANT SELECT ON quiz_responses TO authenticated;
GRANT SELECT ON quiz_answers TO authenticated;

-- Grant sequence permissions for auto-increment IDs
GRANT USAGE, SELECT ON SEQUENCE quiz_responses_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE quiz_answers_id_seq TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies were created
DO $$
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_responses' 
        AND policyname = 'allow_anonymous_insert_quiz_responses'
    ) THEN
        RAISE EXCEPTION 'Failed to create quiz_responses insert policy';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_answers' 
        AND policyname = 'allow_anonymous_insert_quiz_answers'
    ) THEN
        RAISE EXCEPTION 'Failed to create quiz_answers insert policy';
    END IF;
    
    RAISE NOTICE 'All RLS policies created successfully';
END $$;