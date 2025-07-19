-- Insert questions in the correct order
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
  ('Have you done any blood test in past 2 months?', 'select', NULL, NULL, false, true, NULL, '.pdf,.doc,.docx,.jpg,.jpeg,.png', 14, 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert options for select questions
INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['Male', 'Female', 'Other', 'Prefer not to say']), generate_series(0, 3)
FROM questions q WHERE question_text = 'What is your gender?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['rarely', 'occassionaly', 'frequently', 'almost everyday']), generate_series(0, 3)
FROM questions q WHERE question_text = 'How often do you feel mentally stressed or anxious?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['High and consistent', 'Normal but dips in afternoon', 'Low most of the day', 'Always tired and sluggish']), generate_series(0, 3)
FROM questions q WHERE question_text = 'How would you rate your energy levels throughout the day?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['no', 'occassionally', 'frequently', 'yes, severely']), generate_series(0, 3)
FROM questions q WHERE question_text = 'Do you experience joint pain, bone stiffness or muscle weakness?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['Healthy and clear', 'Dry or flaky', 'Oily or acne prone', 'Sensitive or easily irritated']), generate_series(0, 3)
FROM questions q WHERE question_text = 'How would you describe your skin condition most of the time?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['i sleep well and wake refreshed', 'i fall asleep easily but often wake up in middle of the night', 'i struggle to fall asleep', 'i rarely get a restful sleep']), generate_series(0, 3)
FROM questions q WHERE question_text = 'How well do you sleep at night';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['never', 'occassionally', 'frequently', 'daily']), generate_series(0, 3)
FROM questions q WHERE question_text = 'How often do you experience digestive issues like bloating, constipation, acidity or gas?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['sedentary', 'light active (walk 1-2x/week)', 'moderate active (exercise 3-4x/week)', 'highly active (daily workout/physically demanding job)']), generate_series(0, 3)
FROM questions q WHERE question_text = 'How physically active are you?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['yes, daily', 'occassionally', 'no, but open to trying', 'no and not interested']), generate_series(0, 3)
FROM questions q WHERE question_text = 'Are you currently taking any health supplements?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['no', 'yes (please specify in the box)']), generate_series(0, 1)
FROM questions q WHERE question_text = 'Do you have any known health condtions or allergies we should be aware of?';

INSERT INTO question_options (question_id, option_text, order_index)
SELECT q.id, unnest(ARRAY['no', 'yes (please upload for Doctor''s review)']), generate_series(0, 1)
FROM questions q WHERE question_text = 'Have you done any blood test in past 2 months?';