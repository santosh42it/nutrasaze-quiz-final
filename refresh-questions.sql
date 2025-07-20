
-- Clear existing questions data only
DELETE FROM quiz_answers WHERE response_id IN (
  SELECT response_id FROM quiz_answers qa
  JOIN questions q ON qa.question_id = q.id
);
DELETE FROM question_options;
DELETE FROM questions;

-- Reset sequences
ALTER SEQUENCE questions_id_seq RESTART WITH 1;
ALTER SEQUENCE question_options_id_seq RESTART WITH 1;

-- Insert questions from constants.ts
INSERT INTO questions (question_text, question_type, placeholder, description, has_text_area, has_file_upload, text_area_placeholder, accepted_file_types, order_index, status)
VALUES
  ('What is your name?', 'text', 'Enter your name', NULL, false, false, NULL, NULL, 0, 'active'),
  ('What is your contact number?', 'tel', 'Enter your contact number', 'Our NutraSage will send you complementary personalized diet and exercise chart here', false, false, NULL, NULL, 1, 'active'),
  ('What is your email address?', 'email', 'Enter your email', NULL, false, false, NULL, NULL, 2, 'active'),
  ('What is your age?', 'number', 'Enter your age', NULL, false, false, NULL, NULL, 3, 'active'),
  ('What is your gender?', 'select', NULL, NULL, false, false, NULL, NULL, 4, 'active'),
  ('How often do you feel mentally stressed or anxious?', 'select', NULL, NULL, false, false, NULL, NULL, 5, 'active'),
  ('How would you rate your energy levels throughout the day?', 'select', NULL, NULL, false, false, NULL, NULL, 6, 'active'),
  ('Do you experience joint pain, bone stiffness or muscle weakness?', 'select', NULL, NULL, false, false, NULL, NULL, 7, 'active'),
  ('How would you describe your skin condition most of the time?', 'select', NULL, NULL, false, false, NULL, NULL, 8, 'active'),
  ('How well do you sleep at night', 'select', NULL, NULL, false, false, NULL, NULL, 9, 'active'),
  ('How often do you experience digestive issues like bloating, constipation, acidity or gas?', 'select', NULL, NULL, false, false, NULL, NULL, 10, 'active'),
  ('How physically active are you?', 'select', NULL, NULL, false, false, NULL, NULL, 11, 'active'),
  ('Are you currently taking any health supplements?', 'select', NULL, NULL, false, false, NULL, NULL, 12, 'active'),
  ('Do you have any known health condtions or allergies we should be aware of?', 'select', NULL, NULL, true, false, 'Please describe your health conditions or allergies...', NULL, 13, 'active'),
  ('Have you done any blood test in past 2 months?', 'select', NULL, NULL, false, true, NULL, '.pdf,.doc,.docx,.jpg,.jpeg,.png', 14, 'active');

-- Insert options for gender question (id will be 5 after insert)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 5, unnest(ARRAY['Male', 'Female', 'Other', 'Prefer not to say']), generate_series(0, 3);

-- Insert options for mental stress question (id will be 6)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 6, unnest(ARRAY['rarely', 'occassionaly', 'frequently', 'almost everyday']), generate_series(0, 3);

-- Insert options for energy levels question (id will be 7)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 7, unnest(ARRAY['High and consistent', 'Normal but dips in afternoon', 'Low most of the day', 'Always tired and sluggish']), generate_series(0, 3);

-- Insert options for joint pain question (id will be 8)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 8, unnest(ARRAY['no', 'occassionally', 'frequently', 'yes, severely']), generate_series(0, 3);

-- Insert options for skin condition question (id will be 9)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 9, unnest(ARRAY['Healthy and clear', 'Dry or flaky', 'Oily or acne prone', 'Sensitive or easily irritated']), generate_series(0, 3);

-- Insert options for sleep quality question (id will be 10)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 10, unnest(ARRAY['i sleep well and wake refreshed', 'i fall asleep easily but often wake up in middle of the night', 'i struggle to fall asleep', 'i rarely get a restful sleep']), generate_series(0, 3);

-- Insert options for digestive issues question (id will be 11)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 11, unnest(ARRAY['never', 'occassionally', 'frequently', 'daily']), generate_series(0, 3);

-- Insert options for physical activity question (id will be 12)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 12, unnest(ARRAY['sedentary', 'light active (walk 1-2x/week)', 'moderate active (exercise 3-4x/week)', 'highly active (daily workout/physically demanding job)']), generate_series(0, 3);

-- Insert options for supplements question (id will be 13)
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 13, unnest(ARRAY['yes, daily', 'occassionally', 'no, but open to trying', 'no and not interested']), generate_series(0, 3);

-- Insert options for health conditions question (id will be 14) - HAS TEXT AREA
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 14, unnest(ARRAY['no', 'yes (please specify in the box)']), generate_series(0, 1);

-- Insert options for blood test question (id will be 15) - HAS FILE UPLOAD
INSERT INTO question_options (question_id, option_text, order_index)
SELECT 15, unnest(ARRAY['no', 'yes (please upload for Doctor''s review)']), generate_series(0, 1);
