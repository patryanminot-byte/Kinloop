-- Kinloop Database Schema
-- Run this in the Supabase SQL Editor

-- Users
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  phone text unique,
  location_zip text,
  location_city text,
  avatar_initials text,
  created_at timestamptz default now()
);

-- Children
create table children (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  dob date not null,
  emoji text not null,
  created_at timestamptz default now()
);

-- Items / Inventory
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  category text not null,
  age_range text not null,
  status text default 'available',
  emoji text not null,
  is_bundle boolean default false,
  bundle_count int,
  has_photo boolean default false,
  photo_url text,
  condition text,
  pricing_type text,
  pricing_amount int,
  visible_nearby boolean default false,
  stripe_product_id text,
  stripe_price_id text,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

-- Friendships (bidirectional)
create table friendships (
  id uuid default gen_random_uuid() primary key,
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  status text default 'active',
  items_shared int default 0,
  created_at timestamptz default now(),
  unique(user_a, user_b)
);

-- Matches
create table matches (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references items(id) on delete cascade,
  giver_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  receiver_child_id uuid references children(id),
  status text default 'ready',
  message text,
  personal_line text,
  pricing_type text,
  pricing_amount int,
  kinloop_fee int,
  created_at timestamptz default now(),
  offered_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz
);

-- Handoff ratings
create table ratings (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  rater_id uuid references profiles(id),
  rating boolean not null,
  note text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table children enable row level security;
alter table items enable row level security;
alter table friendships enable row level security;
alter table matches enable row level security;
alter table ratings enable row level security;

-- RLS Policies
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users read own children" on children for select using (auth.uid() = user_id);
create policy "Users manage own children" on children for all using (auth.uid() = user_id);
create policy "Users manage own items" on items for all using (auth.uid() = user_id);
create policy "Friends see items" on items for select using (
  auth.uid() = user_id
  or exists (
    select 1 from friendships
    where status = 'active'
    and ((user_a = auth.uid() and user_b = user_id)
      or (user_b = auth.uid() and user_a = user_id))
  )
);
create policy "Nearby see visible items" on items for select using (visible_nearby = true);
create policy "Match participants see matches" on matches for select using (
  auth.uid() = giver_id or auth.uid() = receiver_id
);
create policy "Givers manage matches" on matches for all using (auth.uid() = giver_id);
