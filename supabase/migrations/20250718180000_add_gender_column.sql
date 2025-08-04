
-- Add gender column to quiz_responses table
ALTER TABLE quiz_responses 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_gender ON quiz_responses(gender);
