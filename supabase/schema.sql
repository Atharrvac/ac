-- Supabase schema for EcoLink
-- Enable extensions
create extension if not exists pgcrypto;

-- profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  city text,
  address text,
  avatar_url text,
  eco_coins integer not null default 0,
  total_items_recycled integer not null default 0,
  total_co2_saved numeric not null default 0,
  badges text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- collectors table
create table if not exists public.collectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  address text,
  city text,
  latitude double precision,
  longitude double precision,
  rating numeric,
  specialties text[] not null default '{}',
  available boolean not null default true,
  created_at timestamptz not null default now()
);

-- bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collector_id uuid references public.collectors(id) on delete set null,
  pickup_address text not null,
  pickup_date timestamptz not null,
  items_description text,
  estimated_weight numeric,
  notes text,
  eco_coins_earned integer default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- rewards table
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  coins_required integer not null,
  discount_value text,
  icon text,
  active boolean default true,
  created_at timestamptz not null default now()
);

-- reward_redemptions
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  coins_spent integer not null,
  redeemed_at timestamptz not null default now()
);

-- waste_detections table
create table if not exists public.waste_detections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  detected_item text not null,
  category text not null,
  hazard_level text not null,
  disposal_method text,
  image_url text not null,
  eco_coins_earned integer not null default 0,
  detected_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.waste_detections enable row level security;

-- Policies
-- profiles: users can read their own and update their own
create policy if not exists "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy if not exists "profiles_upsert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy if not exists "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- bookings policies
create policy if not exists "bookings_select_own" on public.bookings for select using (auth.uid() = user_id);
create policy if not exists "bookings_insert_own" on public.bookings for insert with check (auth.uid() = user_id);
create policy if not exists "bookings_update_own" on public.bookings for update using (auth.uid() = user_id);

-- redemptions policies
create policy if not exists "reward_redemptions_select_own" on public.reward_redemptions for select using (auth.uid() = user_id);
create policy if not exists "reward_redemptions_insert_own" on public.reward_redemptions for insert with check (auth.uid() = user_id);

-- waste_detections policies
create policy if not exists "waste_detections_select_own" on public.waste_detections for select using (auth.uid() = user_id);
create policy if not exists "waste_detections_insert_own" on public.waste_detections for insert with check (auth.uid() = user_id);

-- public rewards & collectors readable
alter table public.rewards enable row level security;
create policy if not exists "rewards_read_all" on public.rewards for select using (true);
create policy if not exists "collectors_read_all" on public.collectors for select using (true);

-- Storage bucket for avatars (public read)
select storage.create_bucket('avatars', true);
-- Make objects publicly readable
create policy if not exists "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
-- Allow authenticated users to upload to avatars
create policy if not exists "avatars_authenticated_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
