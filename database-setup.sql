
-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) CHECK (question_type IN ('text', 'select', 'number', 'email', 'tel')) NOT NULL,
  placeholder TEXT,
  description TEXT,
  has_text_area BOOLEAN DEFAULT FALSE,
  has_file_upload BOOLEAN DEFAULT FALSE,
  text_area_placeholder TEXT,
  accepted_file_types TEXT,
  validation_rules TEXT,
  order_index INTEGER DEFAULT 0,
  status VARCHAR(10) CHECK (status IN ('draft', 'active')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create question_options table
CREATE TABLE IF NOT EXISTS question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  age INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER REFERENCES quiz_responses(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  additional_info TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample questions
INSERT INTO questions (question_text, question_type, placeholder, has_text_area, has_file_upload, order_index, status) VALUES
('What is your name?', 'text', 'Enter your full name', FALSE, FALSE, 0, 'active'),
('What is your email?', 'email', 'Enter your email address', FALSE, FALSE, 1, 'active'),
('What is your contact number?', 'tel', 'Enter your phone number', FALSE, FALSE, 2, 'active'),
('What is your age?', 'number', 'Enter your age', FALSE, FALSE, 3, 'active')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, is_active) VALUES
('NutraSage Premium', 'Premium nutrition supplement', TRUE),
('NutraSage Essential', 'Essential daily vitamins', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample tags
INSERT INTO tags (name) VALUES
('Health'), ('Nutrition'), ('Wellness'), ('Fitness')
ON CONFLICT DO NOTHING;
