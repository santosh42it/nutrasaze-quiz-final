
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read answer keys" ON answer_key;
DROP POLICY IF EXISTS "Allow authenticated users to manage answer keys" ON answer_key;

-- Create new policy to allow public read access (since this is used by anonymous quiz users)
CREATE POLICY "Allow public read access to answer keys"
ON answer_key
FOR SELECT
TO public
USING (true);

-- Keep management restricted to authenticated users only  
CREATE POLICY "Allow authenticated users to manage answer keys"
ON answer_key
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
</sql>
