/*
  # Temporarily disable RLS for quiz tables

  This migration temporarily disables RLS for quiz_responses and quiz_answers tables
  to allow the quiz functionality to work while we debug the RLS policy issues.
  
  1. Disable RLS on quiz tables
  2. Grant necessary permissions to anon role
  3. Add comments for future re-enabling
*/

-- Temporarily disable RLS on quiz tables
ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers DISABLE ROW LEVEL SECURITY;

-- Ensure anon role has necessary permissions
GRANT INSERT ON quiz_responses TO anon;
GRANT INSERT ON quiz_answers TO anon;
GRANT SELECT ON quiz_responses TO authenticated;
GRANT SELECT ON quiz_answers TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE quiz_responses_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE quiz_answers_id_seq TO anon;

-- Add comments for future reference
COMMENT ON TABLE quiz_responses IS 'RLS temporarily disabled - needs proper policies';
COMMENT ON TABLE quiz_answers IS 'RLS temporarily disabled - needs proper policies';