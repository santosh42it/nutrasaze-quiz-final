
-- Create question_tags table to link questions with tags for product recommendations
CREATE TABLE IF NOT EXISTS question_tags (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(question_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_tags_question_id ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_tags_tag_id ON question_tags(tag_id);
