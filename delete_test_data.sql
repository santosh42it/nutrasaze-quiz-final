-- Delete all quiz answers first (due to foreign key constraint)
DELETE FROM quiz_answers;

-- Delete all quiz responses
DELETE FROM quiz_responses;

-- Reset the auto-increment sequences to start from 1 again
ALTER SEQUENCE quiz_responses_id_seq RESTART WITH 1;
ALTER SEQUENCE quiz_answers_id_seq RESTART WITH 1;
