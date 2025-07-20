
-- Create option_tags table to link options with tags for product recommendations
CREATE TABLE IF NOT EXISTS option_tags (
  id SERIAL PRIMARY KEY,
  option_id INTEGER NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(option_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_option_tags_option_id ON option_tags(option_id);
CREATE INDEX IF NOT EXISTS idx_option_tags_tag_id ON option_tags(tag_id);

-- Drop the old question_tags table since we're moving tags to options
DROP TABLE IF EXISTS question_tags;
