-- Create quiz_responses table
CREATE TABLE quiz_responses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT NOT NULL,
  age INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_answers table for individual question answers
CREATE TABLE quiz_answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER REFERENCES quiz_responses(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  additional_info TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at
CREATE TRIGGER update_quiz_responses_updated_at
  BEFORE UPDATE ON quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all responses
CREATE POLICY "Allow authenticated read access" ON quiz_responses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON quiz_answers
  FOR SELECT TO authenticated USING (true);

-- Allow public to insert responses
CREATE POLICY "Allow public insert" ON quiz_responses
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public insert" ON quiz_answers
  FOR INSERT TO public WITH CHECK (true);