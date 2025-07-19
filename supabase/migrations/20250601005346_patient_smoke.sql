-- Enable RLS on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated insert" ON questions;
DROP POLICY IF EXISTS "Allow authenticated update" ON questions;
DROP POLICY IF EXISTS "Allow authenticated delete" ON questions;
DROP POLICY IF EXISTS "Allow public read access" ON questions;

DROP POLICY IF EXISTS "Allow authenticated insert" ON question_options;
DROP POLICY IF EXISTS "Allow authenticated update" ON question_options;
DROP POLICY IF EXISTS "Allow authenticated delete" ON question_options;
DROP POLICY IF EXISTS "Allow public read access" ON question_options;

DROP POLICY IF EXISTS "Allow authenticated insert" ON tags;
DROP POLICY IF EXISTS "Allow authenticated update" ON tags;
DROP POLICY IF EXISTS "Allow authenticated delete" ON tags;
DROP POLICY IF EXISTS "Allow public read access" ON tags;

DROP POLICY IF EXISTS "Allow authenticated insert" ON products;
DROP POLICY IF EXISTS "Allow authenticated update" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete" ON products;
DROP POLICY IF EXISTS "Allow public read access" ON products;

DROP POLICY IF EXISTS "Allow authenticated insert" ON option_tags;
DROP POLICY IF EXISTS "Allow authenticated delete" ON option_tags;
DROP POLICY IF EXISTS "Allow public read access" ON option_tags;

DROP POLICY IF EXISTS "Allow authenticated insert" ON product_tags;
DROP POLICY IF EXISTS "Allow authenticated delete" ON product_tags;
DROP POLICY IF EXISTS "Allow public read access" ON product_tags;

-- Create new policies
CREATE POLICY "Allow authenticated insert" ON questions 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON questions 
    FOR UPDATE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON questions 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON questions 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "Allow authenticated insert" ON question_options 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON question_options 
    FOR UPDATE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON question_options 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON question_options 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "Allow authenticated insert" ON tags 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON tags 
    FOR UPDATE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON tags 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON tags 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "Allow authenticated insert" ON products 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON products 
    FOR UPDATE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON products 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON products 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "Allow authenticated insert" ON option_tags 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON option_tags 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON option_tags 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "Allow authenticated insert" ON product_tags 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON product_tags 
    FOR DELETE TO authenticated 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON product_tags 
    FOR SELECT TO public 
    USING (true);