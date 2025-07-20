

-- Add URL column to products table if it doesn't exist
DO $$ 
BEGIN
    -- Add url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'url'
    ) THEN
        ALTER TABLE products ADD COLUMN url TEXT;
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE products ADD COLUMN image_url TEXT;
    END IF;
END $$;

