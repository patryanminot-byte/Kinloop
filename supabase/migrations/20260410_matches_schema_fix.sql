-- Schema fix: Add columns to matches table that the app code references
-- These columns were assumed to exist but weren't in any migration

-- Core match flow columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS personal_line text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS offered_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Pricing columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pricing_type text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pricing_amount numeric;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS watasu_fee numeric;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stripe_fee numeric;

-- Handoff tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS handoff jsonb;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS receiver_child_id uuid REFERENCES children(id);

-- Post-handoff rating
ALTER TABLE matches ADD COLUMN IF NOT EXISTS rating text; -- 'up' | 'down'

-- Items table: condition and pricing
ALTER TABLE items ADD COLUMN IF NOT EXISTS condition text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS pricing_type text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS pricing_amount numeric;

-- Search tracking table (referenced by searchTracking.ts)
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  query text NOT NULL,
  category text,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own searches" ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own searches" ON search_queries FOR SELECT USING (auth.uid() = user_id);
