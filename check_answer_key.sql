-- Check the current answer key table structure and data
SELECT 
  id,
  tag_combination,
  recommended_products,
  LENGTH(tag_combination) - LENGTH(REPLACE(tag_combination, ',', '')) + 1 as tag_count
FROM answer_key 
ORDER BY tag_count, tag_combination;

-- Check for any potential duplicate or similar combinations
SELECT 
  tag_combination,
  COUNT(*) as count
FROM answer_key 
GROUP BY tag_combination 
HAVING COUNT(*) > 1;

-- Verify all tags are alphabetically sorted in combinations
SELECT 
  id,
  tag_combination,
  CASE 
    WHEN tag_combination = (
      SELECT STRING_AGG(tag, ',' ORDER BY tag)
      FROM unnest(string_to_array(tag_combination, ',')) as tag
    ) THEN 'SORTED'
    ELSE 'NOT_SORTED'
  END as sort_status
FROM answer_key
WHERE tag_combination != (
  SELECT STRING_AGG(tag, ',' ORDER BY tag)
  FROM unnest(string_to_array(tag_combination, ',')) as tag
);
