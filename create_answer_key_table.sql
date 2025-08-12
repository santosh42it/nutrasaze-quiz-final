-- Create answer_key table
CREATE TABLE IF NOT EXISTS answer_key (
  id SERIAL PRIMARY KEY,
  tag_combination TEXT NOT NULL UNIQUE,
  recommended_products TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE answer_key ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read answer keys"
ON answer_key
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage answer keys"
ON answer_key
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert data from CSV
INSERT INTO answer_key (tag_combination, recommended_products) VALUES
('bone,omega3', 'Elixir,Pulse'),
('bone,gut,omega3', 'Elixir,Pulse,Core'),
('bone,omega3,sleep', 'Noxis,Elixir,Pulse'),
('bone,gut,omega3,sleep', 'Noxis,Elixir,Pulse,Core'),
('bone,omega3,skin', 'Lumen,Elixir,Pulse'),
('bone,gut,omega3,skin', 'Lumen,Elixir,Pulse,Core'),
('bone,omega3,skin,sleep', 'Velora,Elixir,Pulse'),
('bone,gut,omega3,skin,sleep', 'Velora,Elixir,Pulse,Core'),
('bone,metabolism booster,omega3', 'Elixir,Ignite,Pulse'),
('bone,gut,metabolism booster,omega3', 'Elixir,Ignite,Pulse,Core'),
('bone,metabolism booster,omega3,sleep', 'Noxis,Elixir,Ignite,Pulse'),
('bone,gut,metabolism booster,omega3,sleep', 'Noxis,Elixir,Ignite,Pulse,Core'),
('bone,metabolism booster,omega3,skin', 'Lumen,Elixir,Ignite,Pulse'),
('bone,gut,metabolism booster,omega3,skin', 'Lumen,Elixir,Ignite,Pulse,Core'),
('bone,metabolism booster,omega3,skin,sleep', 'Velora,Elixir,Ignite,Pulse'),
('bone,gut,metabolism booster,omega3,skin,sleep', 'Velora,Elixir,Ignite,Pulse,Core'),
('bone,energy,metabolism booster,mood,omega3,stress', 'Zest,Elixir,Ignite,Pulse'),
('bone,energy,gut,metabolism booster,mood,omega3,stress', 'Zest,Elixir,Ignite,Pulse,Core'),
('bone,energy,metabolism booster,mood,omega3,sleep,stress', 'Noxis,Elixir,Ignite,Pulse'),
('bone,energy,gut,metabolism booster,mood,omega3,sleep,stress', 'Noxis,Elixir,Ignite,Pulse,Core'),
('bone,energy,metabolism booster,mood,omega3,skin,stress', 'Lumen,Elixir,Ignite,Pulse')
ON CONFLICT (tag_combination) DO UPDATE SET
  recommended_products = EXCLUDED.recommended_products,
  updated_at = NOW();
