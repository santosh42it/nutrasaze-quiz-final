-- Add icon_url column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS description TEXT;
