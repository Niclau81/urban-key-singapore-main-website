-- UrbanKey independent main-site schema. Run in the Supabase SQL editor before deployment.
-- No payment or Stripe tables are included. Coworking and 3D model data are intentionally excluded.
create extension if not exists "pgcrypto";

create type public.listing_category as enum ('Buy', 'Rent', 'Commercial');
create type public.enquiry_type as enum ('viewing', 'property_agent', 'general');
create type public.task_status as enum ('open', 'in_review', 'complete');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer' check (role in ('customer', 'agent', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  district text not null,
  address text not null,
  category public.listing_category not null,
  property_type text not null,
  price_label text not null,
  bedrooms integer,
  bathrooms integer,
  size_label text not null,
  mrt_name text,
  mrt_minutes integer,
  tags text[] not null default '{}',
  image_tone text not null default 'city',
  image_url text,
  description text not null,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  enquiry_type public.enquiry_type not null,
  contact_name text not null check (char_length(contact_name) between 1 and 160),
  contact_email text not null check (char_length(contact_email) <= 320),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  status public.task_status not null default 'open',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favourites enable row level security;
alter table public.enquiries enable row level security;
alter table public.agent_tasks enable row level security;

create policy "profiles are readable by their owner" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles are inserted by their owner" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles are updated by their owner" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "published listings are public" on public.listings for select using (is_published = true);
create policy "favourites belong to the signed-in user" on public.favourites for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "anonymous enquiries cannot claim an account" on public.enquiries for insert to anon with check (user_id is null and char_length(contact_name) between 1 and 160 and char_length(contact_email) <= 320 and char_length(message) between 1 and 4000);
create policy "signed-in enquiries belong to the sender" on public.enquiries for insert to authenticated with check (((select auth.uid()) = user_id or user_id is null) and char_length(contact_name) between 1 and 160 and char_length(contact_email) <= 320 and char_length(message) between 1 and 4000);
create policy "signed-in users can read their own enquiries" on public.enquiries for select to authenticated using ((select auth.uid()) = user_id);
create policy "agents manage their own tasks" on public.agent_tasks for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- In Storage, create a private bucket called tour-media, then run the policies below.
create policy "users upload their own tour media" on storage.objects for insert to authenticated with check (bucket_id = 'tour-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "users read their own tour media" on storage.objects for select to authenticated using (bucket_id = 'tour-media' and owner_id = (select auth.uid()));
create policy "users delete their own tour media" on storage.objects for delete to authenticated using (bucket_id = 'tour-media' and owner_id = (select auth.uid()));
