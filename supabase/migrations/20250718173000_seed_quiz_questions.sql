

-- Insert seed quiz questions
INSERT INTO questions (question_text, question_type, placeholder, description, has_text_area, has_file_upload, text_area_placeholder, accepted_file_types, order_index, status) VALUES
('What''s your name?', 'text', 'Enter your name', NULL, false, false, NULL, NULL, 0, 'active'),
('What''s your email address?', 'email', 'Enter your email', NULL, false, false, NULL, NULL, 1, 'active'),
('What''s your contact number?', 'tel', 'Enter 10-digit number', 'We''ll prefix +91 to your number', false, false, NULL, NULL, 2, 'active'),
('What''s your age?', 'number', 'Enter your age', NULL, false, false, NULL, NULL, 3, 'active'),
('What are your primary health goals?', 'select', NULL, NULL, false, false, NULL, NULL, 4, 'active'),
('Are you currently taking any supplements or medications?', 'select', NULL, NULL, true, false, 'Please list the supplements or medications you''re currently taking', NULL, 5, 'active'),
('Do you have any known allergies or dietary restrictions?', 'select', NULL, NULL, true, false, 'Please describe your allergies or dietary restrictions', NULL, 6, 'active'),
('Do you have any medical conditions or are under medical supervision?', 'select', NULL, NULL, true, false, 'Please describe your medical conditions', NULL, 7, 'active'),
('Do you have recent lab reports or health assessments?', 'select', NULL, NULL, false, true, NULL, '.pdf,.jpg,.jpeg,.png', 8, 'active')
ON CONFLICT DO NOTHING;

-- Insert options for health goals question
INSERT INTO question_options (question_id, option_text, order_index) 
SELECT q.id, option_text, order_index FROM (
  SELECT 'Weight management' as option_text, 0 as order_index UNION ALL
  SELECT 'Improved energy levels', 1 UNION ALL
  SELECT 'Better sleep quality', 2 UNION ALL
  SELECT 'Enhanced immune system', 3 UNION ALL
  SELECT 'Digestive health', 4 UNION ALL
  SELECT 'Muscle building', 5 UNION ALL
  SELECT 'General wellness', 6
) options
CROSS JOIN questions q 
WHERE q.question_text = 'What are your primary health goals?'
ON CONFLICT DO NOTHING;

-- Insert options for yes/no questions
INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, option_text, order_index FROM (
  SELECT 'Yes' as option_text, 0 as order_index UNION ALL
  SELECT 'No', 1
) options
CROSS JOIN questions q 
WHERE q.question_text IN (
  'Are you currently taking any supplements or medications?',
  'Do you have any known allergies or dietary restrictions?',
  'Do you have any medical conditions or are under medical supervision?',
  'Do you have recent lab reports or health assessments?'
)
ON CONFLICT DO NOTHING;

