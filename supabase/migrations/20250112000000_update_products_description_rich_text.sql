
-- Update products table to ensure description column can handle rich text (HTML content)
-- TEXT type in PostgreSQL can handle large HTML content

-- Add a check constraint to ensure description is not empty when provided
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_description_check;

ALTER TABLE products 
ADD CONSTRAINT products_description_check 
CHECK (description IS NULL OR length(trim(description)) > 0);

-- Add comment to indicate this field supports HTML content
COMMENT ON COLUMN products.description IS 'Product description supporting HTML/rich text content';

-- Update any existing plain text descriptions to ensure they display properly
-- This is a safe operation that won't affect existing HTML content
UPDATE products 
SET description = CASE 
  WHEN description IS NOT NULL AND description NOT LIKE '%<%>%' 
  THEN '<p>' || description || '</p>'
  ELSE description 
END
WHERE description IS NOT NULL AND description != '';
