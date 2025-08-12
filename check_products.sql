
-- Check products table structure and data
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Check if products exist
SELECT COUNT(*) as total_products FROM products;

-- Show all products
SELECT id, name, description, is_active, created_at FROM products ORDER BY name;

-- Check for any inactive products
SELECT COUNT(*) as inactive_products FROM products WHERE is_active = false;
