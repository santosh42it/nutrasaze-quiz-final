
-- Verify answer_key table structure and data
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'answer_key'
ORDER BY ordinal_position;

-- Check if data exists
SELECT COUNT(*) as total_rows FROM answer_key;

-- Show first few rows
SELECT * FROM answer_key LIMIT 5;

-- Check specifically for the bone,omega3 combination
SELECT * FROM answer_key WHERE tag_combination = 'bone,omega3';

-- Check for any similar combinations
SELECT * FROM answer_key WHERE tag_combination LIKE '%bone%' AND tag_combination LIKE '%omega3%';
