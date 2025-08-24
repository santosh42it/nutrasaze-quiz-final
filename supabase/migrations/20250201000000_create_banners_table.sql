
-- Create banners table for admin-managed banners
CREATE TABLE IF NOT EXISTS banners (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active banners
CREATE POLICY "Allow public read access to active banners" ON banners 
    FOR SELECT TO public 
    USING (is_active = true);

-- Allow authenticated insert, update, delete for admin management
CREATE POLICY "Allow authenticated insert" ON banners 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON banners 
    FOR UPDATE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON banners 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to read all banners (for admin panel)
CREATE POLICY "Allow authenticated read access" ON banners 
    FOR SELECT TO authenticated 
    USING (auth.role() = 'authenticated');
