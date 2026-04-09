-- Migration: living_catalog
-- Creates the catalog_entries table, indexes, RLS, and auto-promotion function.

-- ============================================================
-- 1. Table
-- ============================================================

create table catalog_entries (
  id uuid default gen_random_uuid() primary key,
  brand text,
  name text not null,
  category text not null,
  emoji text not null,
  size_system text not null,
  keywords text[] default '{}',
  source text default 'curated',        -- 'curated' | 'auto-promoted' | 'admin'
  status text default 'active',         -- 'active' | 'pending' | 'archived'
  promoted_from text,                   -- original custom_name if auto-promoted
  times_typed int,                      -- snapshot at promotion time
  unique_users int,                     -- snapshot at promotion time
  popularity int default 0,             -- how often this item is selected (updated monthly)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. Indexes
-- ============================================================

create index catalog_entries_keywords_gin on catalog_entries using gin (keywords);
create index catalog_entries_category_idx on catalog_entries (category);
create index catalog_entries_status_idx on catalog_entries (status);

-- ============================================================
-- 3. Row Level Security
-- ============================================================

alter table catalog_entries enable row level security;

create policy "Anyone can read active catalog"
  on catalog_entries
  for select
  using (status = 'active');

-- ============================================================
-- 4. Auto-promotion function
-- ============================================================

create or replace function auto_promote_catalog_items()
returns int
language plpgsql
security definer
as $$
declare
  v_count int := 0;
begin
  insert into catalog_entries (
    name,
    category,
    emoji,
    size_system,
    source,
    status,
    promoted_from,
    times_typed,
    unique_users
  )
  select
    initcap(r.item_name),
    coalesce(r.category, 'Free Stuff'),
    '📦',
    'one-size',
    'auto-promoted',
    'pending',
    r.item_name,
    r.times_typed,
    r.unique_users
  from custom_items_ranked r
  where r.unique_users >= 5
    and not exists (
      select 1
      from catalog_entries e
      where lower(e.name) = r.item_name
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ============================================================
-- 5. Popularity refresh function
-- ============================================================

-- Updates popularity scores from search_queries data.
-- Called monthly alongside auto-promote.
create or replace function refresh_catalog_popularity()
returns void
language plpgsql
security definer
as $$
begin
  -- Reset all scores, then update from popular_catalog_items view
  update catalog_entries set popularity = 0;

  update catalog_entries e
  set popularity = p.times_selected,
      updated_at = now()
  from popular_catalog_items p
  where lower(e.name) = lower(p.item_name)
    or (e.brand is not null and lower(e.brand || ' ' || e.name) = lower(p.item_name));
end;
$$;

-- ============================================================
-- 6. Combined monthly maintenance function
-- ============================================================

create or replace function monthly_catalog_maintenance()
returns text
language plpgsql
security definer
as $$
declare
  v_promoted int;
begin
  -- Step 1: promote popular custom items
  v_promoted := auto_promote_catalog_items();

  -- Step 2: refresh popularity scores
  perform refresh_catalog_popularity();

  return format('Promoted %s items. Popularity refreshed.', v_promoted);
end;
$$;

-- ============================================================
-- 7. Cron setup (run manually in Supabase dashboard)
-- ============================================================

-- To auto-run monthly, set up pg_cron in Supabase dashboard:
-- SELECT cron.schedule('monthly-catalog-maintenance', '0 0 1 * *', $$SELECT monthly_catalog_maintenance()$$);
