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
  watasu_fee int,
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

-- Search intelligence (Layer 3)
-- Tracks what users search for to improve catalog over time
create table search_queries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  query text not null,
  matched_catalog boolean default false, -- did they pick a catalog suggestion?
  selected_entry text, -- what they picked (brand + name) or null for custom
  custom_name text, -- what they typed if custom
  category text,
  is_bundle boolean default false,
  created_at timestamptz default now()
);

-- View: top custom items people type that don't match catalog
-- Use this to find items to add to the catalog
create view custom_items_ranked as
  select
    lower(trim(custom_name)) as item_name,
    category,
    count(*) as times_typed,
    count(distinct user_id) as unique_users,
    max(created_at) as last_typed
  from search_queries
  where matched_catalog = false
    and custom_name is not null
    and length(trim(custom_name)) > 2
  group by lower(trim(custom_name)), category
  order by times_typed desc;

-- View: top catalog searches (what's popular)
create view popular_catalog_items as
  select
    selected_entry as item_name,
    count(*) as times_selected,
    count(distinct user_id) as unique_users,
    max(created_at) as last_selected
  from search_queries
  where matched_catalog = true
    and selected_entry is not null
  group by selected_entry
  order by times_selected desc;

-- Living Catalog (auto-growing item database)
create table catalog_entries (
  id uuid default gen_random_uuid() primary key,
  brand text,
  name text not null,
  category text not null,
  emoji text not null default '📦',
  size_system text not null default 'one-size',
  keywords text[] default '{}',
  source text default 'curated',        -- 'curated' | 'auto-promoted' | 'admin'
  status text default 'active',          -- 'active' | 'pending' | 'archived'
  promoted_from text,                    -- original custom_name if auto-promoted
  times_typed int,                       -- snapshot at promotion time
  unique_users int,                      -- snapshot at promotion time
  popularity int default 0,              -- how often selected (refreshed monthly)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_catalog_keywords on catalog_entries using gin (keywords);
create index idx_catalog_category on catalog_entries (category);
create index idx_catalog_status on catalog_entries (status);

-- Auto-promote function: promotes custom items with 5+ unique users
create or replace function auto_promote_catalog_items()
returns int language plpgsql as $$
declare
  rec record;
  promoted int := 0;
  already_exists boolean;
begin
  for rec in
    select item_name, category, times_typed, unique_users
    from custom_items_ranked
    where unique_users >= 5
  loop
    -- item_name from the view is already lowercased
    select exists(
      select 1 from catalog_entries where lower(name) = rec.item_name
    ) into already_exists;

    if not already_exists then
      insert into catalog_entries (name, category, emoji, size_system, keywords, source, status, promoted_from, times_typed, unique_users)
      values (
        initcap(rec.item_name),
        coalesce(rec.category, 'Free Stuff'),
        '📦',
        'one-size',
        array[rec.item_name],
        'auto-promoted',
        'pending',
        rec.item_name,
        rec.times_typed,
        rec.unique_users
      );
      promoted := promoted + 1;
    end if;
  end loop;
  return promoted;
end;
$$;

-- Refresh popularity scores from search data
create or replace function refresh_catalog_popularity()
returns void language plpgsql security definer as $$
begin
  update catalog_entries set popularity = 0;
  update catalog_entries e
  set popularity = p.times_selected, updated_at = now()
  from popular_catalog_items p
  where lower(e.name) = lower(p.item_name)
    or (e.brand is not null and lower(e.brand || ' ' || e.name) = lower(p.item_name));
end;
$$;

-- Combined monthly maintenance: promote + refresh popularity
create or replace function monthly_catalog_maintenance()
returns text language plpgsql security definer as $$
declare v_promoted int;
begin
  v_promoted := auto_promote_catalog_items();
  perform refresh_catalog_popularity();
  return format('Promoted %s items. Popularity refreshed.', v_promoted);
end;
$$;

-- To auto-run monthly, enable pg_cron in Supabase dashboard and run:
-- SELECT cron.schedule('monthly-catalog-maintenance', '0 0 1 * *', $$SELECT monthly_catalog_maintenance()$$);

-- Row Level Security
alter table profiles enable row level security;
alter table children enable row level security;
alter table items enable row level security;
alter table friendships enable row level security;
alter table matches enable row level security;
alter table ratings enable row level security;
alter table search_queries enable row level security;
alter table catalog_entries enable row level security;

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
create policy "Users insert own searches" on search_queries for insert with check (auth.uid() = user_id);
create policy "Users read own searches" on search_queries for select using (auth.uid() = user_id);
create policy "Anyone can read active catalog" on catalog_entries for select using (status = 'active');
