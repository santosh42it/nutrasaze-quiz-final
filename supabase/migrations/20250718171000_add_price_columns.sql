
-- Add MRP and SRP columns to products table if they don't exist
DO $$ 
BEGIN
    -- Add mrp column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'mrp'
    ) THEN
        ALTER TABLE products ADD COLUMN mrp DECIMAL(10,2);
    END IF;
    
    -- Add srp column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'srp'
    ) THEN
        ALTER TABLE products ADD COLUMN srp DECIMAL(10,2);
    END IF;
END $$;
