-- TestFlight launch features migration
-- Run this in the Supabase SQL Editor

-- 1. Add fields to profiles for location, visibility, consent, invite tokens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lat float;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lng float;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS item_visibility text DEFAULT 'circle';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consented_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Add score to matches for ranking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;

-- 3. Add current_size to children for smart sizing
ALTER TABLE children ADD COLUMN IF NOT EXISTS current_size text;

-- 3. Reports table for safety reporting
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  note text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users read own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- 4. Nudges table to track sent nudges (prevent duplicates)
CREATE TABLE IF NOT EXISTS nudges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,  -- 'birthday_quarter', 'seasonal', 'post_give', 'post_receive', 'friend_joined'
  ref_id text,         -- optional reference (child_id, match_id, friend_id)
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own nudges" ON nudges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts nudges" ON nudges FOR INSERT WITH CHECK (true);

-- 5. Generate invite tokens for existing users who don't have one
UPDATE profiles SET invite_token = encode(gen_random_bytes(8), 'hex')
WHERE invite_token IS NULL;

-- 6. RPC: Find which phone numbers are already on Watasu
-- Takes an array of normalized phone numbers (digits only), returns matching profiles
-- Uses security definer so it can read all profiles (RLS would block cross-user reads)
CREATE OR REPLACE FUNCTION find_contacts_on_watasu(phone_numbers text[])
RETURNS TABLE(user_id uuid, name text, phone text, avatar_initials text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT p.id, p.name, p.phone, p.avatar_initials
  FROM profiles p
  WHERE p.phone = ANY(phone_numbers)
  AND p.id != auth.uid();
$$;

-- 7. RPC: Create friendship (bidirectional, idempotent)
CREATE OR REPLACE FUNCTION create_friendship(friend_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  -- Always store with smaller UUID as user_a for consistency
  IF auth.uid() < friend_id THEN
    a := auth.uid(); b := friend_id;
  ELSE
    a := friend_id; b := auth.uid();
  END IF;

  INSERT INTO friendships (user_a, user_b, status)
  VALUES (a, b, 'active')
  ON CONFLICT (user_a, user_b) DO NOTHING;
END;
$$;

-- 8. RPC: Accept invite token and create friendship
CREATE OR REPLACE FUNCTION accept_invite(token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  inviter_id uuid;
  a uuid;
  b uuid;
BEGIN
  SELECT id INTO inviter_id FROM profiles WHERE invite_token = token;
  IF inviter_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite token';
  END IF;
  IF inviter_id = auth.uid() THEN
    RETURN inviter_id; -- can't friend yourself
  END IF;

  IF auth.uid() < inviter_id THEN
    a := auth.uid(); b := inviter_id;
  ELSE
    a := inviter_id; b := auth.uid();
  END IF;

  INSERT INTO friendships (user_a, user_b, status)
  VALUES (a, b, 'active')
  ON CONFLICT (user_a, user_b) DO NOTHING;

  RETURN inviter_id;
END;
$$;

-- 9. Auto-generate invite token for new profiles
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invite_token IS NULL THEN
    NEW.invite_token := encode(gen_random_bytes(8), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_invite_token ON profiles;
CREATE TRIGGER set_invite_token
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_invite_token();

-- 10. Allow users to read friend profiles (needed for contact matching display)
CREATE POLICY "Users read friend profiles" ON profiles FOR SELECT USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'active'
    AND ((user_a = auth.uid() AND user_b = id)
      OR (user_b = auth.uid() AND user_a = id))
  )
);

-- 11. RPC: Find nearby families with similar-age kids (friend finder)
-- Returns users within ~5 miles who have kids within 12 months of your kids' ages
-- Excludes existing friends and yourself
CREATE OR REPLACE FUNCTION find_nearby_families(
  my_lat float,
  my_lng float,
  radius_miles float DEFAULT 5.0
)
RETURNS TABLE(
  user_id uuid,
  name text,
  avatar_initials text,
  distance_miles float,
  kid_name text,
  kid_age_months integer
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH my_kids AS (
    SELECT dob FROM children WHERE user_id = auth.uid()
  ),
  candidates AS (
    SELECT
      p.id,
      p.name,
      p.avatar_initials,
      -- Haversine approximation in miles
      3959 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(p.location_lat - my_lat) / 2), 2) +
        COS(RADIANS(my_lat)) * COS(RADIANS(p.location_lat)) *
        POWER(SIN(RADIANS(p.location_lng - my_lng) / 2), 2)
      )) as dist
    FROM profiles p
    WHERE p.id != auth.uid()
      AND p.location_lat IS NOT NULL
      AND p.location_lng IS NOT NULL
      -- Quick bounding box filter (roughly 5 miles = 0.07 degrees)
      AND ABS(p.location_lat - my_lat) < radius_miles * 0.015
      AND ABS(p.location_lng - my_lng) < radius_miles * 0.02
      -- Not already friends
      AND NOT EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'active'
        AND ((f.user_a = auth.uid() AND f.user_b = p.id)
          OR (f.user_b = auth.uid() AND f.user_a = p.id))
      )
  )
  SELECT
    c.id as user_id,
    c.name,
    c.avatar_initials,
    ROUND(c.dist::numeric, 1)::float as distance_miles,
    ch.name as kid_name,
    (EXTRACT(YEAR FROM AGE(NOW(), ch.dob)) * 12 +
     EXTRACT(MONTH FROM AGE(NOW(), ch.dob)))::integer as kid_age_months
  FROM candidates c
  JOIN children ch ON ch.user_id = c.id
  WHERE c.dist <= radius_miles
  -- Only include families with kids within 12 months of one of your kids
  AND EXISTS (
    SELECT 1 FROM my_kids mk
    WHERE ABS(
      EXTRACT(EPOCH FROM AGE(NOW(), ch.dob)) -
      EXTRACT(EPOCH FROM AGE(NOW(), mk.dob))
    ) / (30.44 * 24 * 3600) <= 12
  )
  ORDER BY c.dist ASC
  LIMIT 20;
$$;
