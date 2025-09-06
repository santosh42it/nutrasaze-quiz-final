
-- Cleanup duplicate quiz responses
-- This script will remove duplicate responses keeping only the latest one for each email

-- First, let's see the duplicates
SELECT 
    email,
    name,
    contact,
    COUNT(*) as duplicate_count,
    MIN(id) as first_id,
    MAX(id) as latest_id,
    MIN(created_at) as first_created,
    MAX(created_at) as latest_created
FROM quiz_responses 
GROUP BY email, name, contact 
HAVING COUNT(*) > 1
ORDER BY latest_created DESC;

-- Delete duplicate responses, keeping only the latest one for each email/name/contact combination
-- This will also cascade delete related quiz_answers due to foreign key constraints

WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY email, name, contact 
            ORDER BY created_at DESC, id DESC
        ) as rn
    FROM quiz_responses
)
DELETE FROM quiz_responses 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- Verify cleanup - this should return no rows if duplicates are cleaned
SELECT 
    email,
    name,
    contact,
    COUNT(*) as count
FROM quiz_responses 
GROUP BY email, name, contact 
HAVING COUNT(*) > 1;
