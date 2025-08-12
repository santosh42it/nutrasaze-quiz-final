
-- Check for any remaining references to product_tags table

-- 1. Check if product_tags table still exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'product_tags' AND table_schema = 'public';

-- 2. Check for any foreign key constraints that might reference product_tags
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (ccu.table_name = 'product_tags' OR tc.table_name = 'product_tags');

-- 3. Check for any views that might reference product_tags
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE view_definition LIKE '%product_tags%';

-- 4. Check for any functions that might reference product_tags
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_definition LIKE '%product_tags%';

-- 5. Clean up: Drop product_tags table if it exists
DROP TABLE IF EXISTS product_tags CASCADE;

-- 6. Verify the table is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'product_tags' AND table_schema = 'public';

-- 7. Check current products table structure to ensure it's clean
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
