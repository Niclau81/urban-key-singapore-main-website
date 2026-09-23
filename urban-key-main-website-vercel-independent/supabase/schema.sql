-- UrbanKey independent main-site schema — Supabase Postgres
-- Run this idempotent migration in the Supabase SQL Editor before enabling the protected workflows.
-- Deliberately excluded: payments/Stripe, Coworking, all 3D floor-plan and 3D model features.

create extension if not exists "pgcrypto";

-- Preserve compatibility with earlier package versions while adding the independent parity contract.
do $$ begin
  create type public.listing_category as enum ('Buy', 'Rent', 'Commercial');
exception when duplicate_object then null; end $$;
alter type public.listing_category add value if not exists 'Residential';
do $$ begin
  create type public.listing_mode as enum ('Buy', 'Sell', 'Rent', 'Rent-Out');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.agent_verification_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.tour_review_status as enum ('draft', 'submitted', 'needs_review', 'approval_required', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 160),
  role text not null default 'customer' check (role in ('customer', 'agent', 'admin')),
  persona text check (persona in ('buyer_tenant', 'seller_landlord', 'agent_cobroker')),
  district text,
  budget text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists persona text check (persona in ('buyer_tenant', 'seller_landlord', 'agent_cobroker'));
alter table public.profiles add column if not exists district text;
alter table public.profiles add column if not exists budget text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.agent_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  professional_type text not null check (professional_type in ('agent', 'cobroker')),
  company_name text not null check (char_length(company_name) between 2 and 160),
  licence_number text not null unique check (char_length(licence_number) between 3 and 80),
  phone text not null check (char_length(phone) between 6 and 40),
  postal_code text not null check (postal_code ~ '^[0-9]{6}$'),
  terms_accepted_at timestamptz not null,
  verification_status public.agent_verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 240),
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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.listings add column if not exists market_id text not null default 'singapore' check (market_id in ('singapore', 'indonesia', 'malaysia', 'thailand', 'vietnam', 'philippines'));
alter table public.listings add column if not exists mode public.listing_mode not null default 'Buy';
alter table public.listings add column if not exists listing_status text not null default 'draft' check (listing_status in ('draft', 'active', 'paused'));
alter table public.listings add column if not exists price numeric check (price >= 0);
alter table public.listings add column if not exists monthly_rent numeric check (monthly_rent is null or monthly_rent >= 0);
alter table public.listings add column if not exists size numeric check (size is null or size > 0);
alter table public.listings add column if not exists tenure text;
alter table public.listings add column if not exists latitude double precision check (latitude between -90 and 90);
alter table public.listings add column if not exists longitude double precision check (longitude between -180 and 180);
alter table public.listings add column if not exists gallery_urls text[] not null default '{}';
alter table public.listings add column if not exists is_planning_demo boolean not null default false;
alter table public.listings add column if not exists virtual_tour_available boolean not null default false;
alter table public.listings add column if not exists commercial_usage text;
alter table public.listings add column if not exists floor_loading numeric check (floor_loading is null or floor_loading >= 0);
alter table public.listings add column if not exists ceiling_height numeric check (ceiling_height is null or ceiling_height >= 0);
alter table public.listings add column if not exists loading_access text;
alter table public.listings add column if not exists parking_lots integer check (parking_lots is null or parking_lots >= 0);
alter table public.listings add column if not exists available_from date;
create index if not exists listings_public_catalog_idx on public.listings (is_published, market_id, mode, district, property_type);
create index if not exists listings_owner_idx on public.listings (created_by, updated_at desc);

create table if not exists public.favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Packaged demonstration records use stable string IDs rather than database UUIDs.
-- Store these saves separately so a public demo never becomes a fictional database listing.
create table if not exists public.catalog_favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null check (char_length(property_id) between 1 and 160),
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  catalog_listing_id text check (catalog_listing_id is null or char_length(catalog_listing_id) between 1 and 160),
  user_id uuid references auth.users(id) on delete set null,
  enquiry_type text not null check (enquiry_type in ('viewing', 'property_agent', 'general')),
  contact_name text not null check (char_length(contact_name) between 1 and 160),
  contact_email text not null check (char_length(contact_email) <= 320),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);
alter table public.enquiries add column if not exists catalog_listing_id text check (catalog_listing_id is null or char_length(catalog_listing_id) between 1 and 160);
create index if not exists enquiries_owner_idx on public.enquiries (user_id, created_at desc);

-- Standard 2D image/floor-plan attachment metadata only. No floor-plan renderer or model is stored.
create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_kind text not null check (media_kind in ('image', 'floor_plan_2d')),
  position integer not null default 0 check (position between 0 and 6),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 6291456),
  created_at timestamptz not null default now(),
  unique (listing_id, media_kind, position)
);

create table if not exists public.property_agent_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  journey text not null check (journey in ('buy', 'sell', 'rent', 'rent_out')),
  status text not null default 'intake' check (status in ('intake', 'sourcing', 'viewings', 'paperwork', 'professional_review', 'awaiting_authorisation', 'coordination', 'completed', 'on_hold', 'closed')),
  requirements text not null check (char_length(requirements) between 1 and 4000),
  consent_recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists property_agent_cases_owner_idx on public.property_agent_cases (owner_id, created_at desc);

create table if not exists public.property_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.property_agent_cases(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 280),
  category text not null check (category in ('sourcing', 'paperwork', 'appointment', 'professional', 'government', 'communication')),
  owner_role text not null check (owner_role in ('customer', 'agent', 'lawyer', 'government', 'system')),
  requires_authorization boolean not null default false,
  authorization_recorded_at timestamptz,
  status text not null default 'open' check (status in ('open', 'in_review', 'blocked', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not requires_authorization or status <> 'complete' or authorization_recorded_at is not null)
);

create table if not exists public.property_agent_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.property_agent_cases(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  category text not null check (category in ('identity', 'financial', 'property', 'offer', 'tenancy', 'tax', 'legal', 'other')),
  storage_path text,
  requires_authorization boolean not null default false,
  authorization_recorded_at timestamptz,
  status text not null default 'requested' check (status in ('requested', 'uploaded', 'prepared', 'approval_required', 'reviewed')),
  created_at timestamptz not null default now(),
  check (not requires_authorization or authorization_recorded_at is not null or storage_path is null)
);

create table if not exists public.property_agent_handoffs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.property_agent_cases(id) on delete cascade,
  destination text not null check (destination in ('lawyer', 'licensed_agent', 'hdb', 'iras', 'sla', 'ura', 'bank', 'other')),
  title text not null,
  purpose text not null,
  requires_authorization boolean not null default false,
  authorization_recorded_at timestamptz,
  status text not null default 'prepared' check (status in ('prepared', 'approval_required', 'connection_required', 'completed')),
  created_at timestamptz not null default now(),
  check (status <> 'completed')
);

create table if not exists public.property_agent_audit_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.property_agent_cases(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Retained for older agent-dashboard records; it remains user-scoped and cannot be shared across accounts.
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  status text not null default 'open' check (status in ('open', 'in_review', 'blocked', 'complete')),
  due_at timestamptz,
  category text,
  requires_authorization boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.agent_tasks add column if not exists category text;
alter table public.agent_tasks add column if not exists requires_authorization boolean not null default false;

create table if not exists public.tour_captures (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/webp')),
  byte_size integer not null check (byte_size > 0 and byte_size <= 20971520),
  room_label text not null check (char_length(room_label) between 1 and 120),
  authority_confirmed boolean not null,
  consent_confirmed boolean not null,
  privacy_status text not null default 'pending' check (privacy_status in ('pending', 'clear', 'needs_redaction', 'rejected')),
  reviewer_notes text check (char_length(reviewer_notes) <= 2000),
  manual_review_acknowledged boolean not null default false,
  review_status public.tour_review_status not null default 'submitted',
  created_at timestamptz not null default now(),
  check (authority_confirmed and consent_confirmed)
);
create index if not exists tour_captures_owner_idx on public.tour_captures (owner_id, created_at desc);

-- The browser can never set a role. Provision initial customer profiles automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'member'), '@', 1)), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_agent_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_profile_role() in ('agent', 'admin'), false)
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

-- Atomic consent-gated Property Agent case creation. The application never sends communications or files documents.
create or replace function public.create_property_agent_case(p_journey text, p_requirements text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_case_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_journey not in ('buy', 'sell', 'rent', 'rent_out') then raise exception 'Unsupported journey'; end if;
  if char_length(trim(p_requirements)) < 1 then raise exception 'Requirements are required'; end if;
  insert into public.property_agent_cases (owner_id, journey, requirements, consent_recorded_at)
  values (auth.uid(), p_journey, trim(p_requirements), now()) returning id into new_case_id;
  insert into public.property_agent_tasks (case_id, title, category, owner_role, requires_authorization)
  values
    (new_case_id, 'Confirm requirements, budget range, and shortlist', 'sourcing', 'customer', false),
    (new_case_id, 'Prepare a viewing-request draft for review', 'appointment', 'system', true),
    (new_case_id, 'Collect the document checklist', 'paperwork', 'customer', false),
    (new_case_id, 'Prepare professional hand-off checklist', 'professional', 'lawyer', true);
  insert into public.property_agent_documents (case_id, owner_id, label, category, requires_authorization)
  values
    (new_case_id, auth.uid(), 'Identity and contact checklist', 'identity', false),
    (new_case_id, auth.uid(), 'Property shortlist and viewing notes', 'property', false),
    (new_case_id, auth.uid(), 'Authorisation-required discussion pack', case when p_journey in ('rent', 'rent_out') then 'tenancy' else 'offer' end, true);
  insert into public.property_agent_handoffs (case_id, destination, title, purpose, requires_authorization, status)
  values (new_case_id, 'lawyer', 'Professional review hand-off', 'Prepared for an appointed professional after explicit authorisation.', true, 'approval_required');
  insert into public.property_agent_audit_logs (case_id, actor_id, action, payload)
  values (new_case_id, auth.uid(), 'case_created_with_recorded_consent', jsonb_build_object('journey', p_journey));
  return new_case_id;
end;
$$;
revoke all on function public.create_property_agent_case(text, text) from public;
grant execute on function public.create_property_agent_case(text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favourites enable row level security;
alter table public.catalog_favourites enable row level security;
alter table public.enquiries enable row level security;
alter table public.listing_media enable row level security;
alter table public.property_agent_cases enable row level security;
alter table public.property_agent_tasks enable row level security;
alter table public.property_agent_documents enable row level security;
alter table public.property_agent_handoffs enable row level security;
alter table public.property_agent_audit_logs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.tour_captures enable row level security;

-- Replace permissive earlier policies.
drop policy if exists "profiles are readable by their owner" on public.profiles;
drop policy if exists "profiles are inserted by their owner" on public.profiles;
drop policy if exists "profiles are updated by their owner" on public.profiles;
create policy "profile owner reads own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profile owner creates default profile" on public.profiles for insert to authenticated with check (id = auth.uid() and role = 'customer');
create policy "profile owner updates safe fields" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = public.current_profile_role());

create policy "agent profile owner reads" on public.agent_profiles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "agent profile owner registers" on public.agent_profiles for insert to authenticated with check (user_id = auth.uid() and verification_status = 'pending');
create policy "agent profile owner updates pending record" on public.agent_profiles for update to authenticated using (user_id = auth.uid() and verification_status = 'pending') with check (user_id = auth.uid() and verification_status = 'pending');

-- Public catalog is read-only to anonymous visitors. Agent/admin users may manage only their own records.
drop policy if exists "published listings are public" on public.listings;
create policy "public reads active listings" on public.listings for select using (is_published = true or created_by = auth.uid() or public.is_admin());
create policy "verified agent creates own draft" on public.listings for insert to authenticated with check (created_by = auth.uid() and public.is_agent_or_admin() and is_published = false and listing_status = 'draft');
create policy "verified agent updates own listing" on public.listings for update to authenticated using (created_by = auth.uid() and public.is_agent_or_admin()) with check (created_by = auth.uid() and public.is_agent_or_admin());
create policy "verified agent deletes own listing" on public.listings for delete to authenticated using (created_by = auth.uid() and public.is_agent_or_admin());

create policy "favourite owner access" on public.favourites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "favourites belong to the signed-in user" on public.favourites;
create policy "catalog favourite owner access" on public.catalog_favourites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anonymous enquiries cannot claim an account" on public.enquiries;
drop policy if exists "signed-in enquiries belong to the sender" on public.enquiries;
drop policy if exists "signed-in users can read their own enquiries" on public.enquiries;
create policy "enquiry owner reads own" on public.enquiries for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "signed in user creates own enquiry" on public.enquiries for insert to authenticated with check (user_id = auth.uid() and char_length(message) between 10 and 2000);

create policy "listing media owner access" on public.listing_media for all to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid());
create policy "case owner reads own case" on public.property_agent_cases for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy "case owner updates safe case fields" on public.property_agent_cases for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and consent_recorded_at is not null);
create policy "case owner reads tasks" on public.property_agent_tasks for select to authenticated using (exists (select 1 from public.property_agent_cases c where c.id = case_id and (c.owner_id = auth.uid() or public.is_admin())));
create policy "case owner reads documents" on public.property_agent_documents for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy "case owner reads handoffs" on public.property_agent_handoffs for select to authenticated using (exists (select 1 from public.property_agent_cases c where c.id = case_id and (c.owner_id = auth.uid() or public.is_admin())));
create policy "case owner reads audit" on public.property_agent_audit_logs for select to authenticated using (exists (select 1 from public.property_agent_cases c where c.id = case_id and (c.owner_id = auth.uid() or public.is_admin())));

drop policy if exists "agents manage their own tasks" on public.agent_tasks;
create policy "agent task owner access" on public.agent_tasks for all to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid());
create policy "tour capture owner access" on public.tour_captures for all to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() and authority_confirmed and consent_confirmed);

-- Private buckets and owner-only object access. Paths always begin with auth.uid().
insert into storage.buckets (id, name, public) values
  ('tour-media', 'tour-media', false),
  ('listing-media', 'listing-media', false),
  ('property-agent-documents', 'property-agent-documents', false)
on conflict (id) do update set public = false;
drop policy if exists "users upload their own tour media" on storage.objects;
drop policy if exists "users read their own tour media" on storage.objects;
drop policy if exists "users delete their own tour media" on storage.objects;
drop policy if exists "owner private media access" on storage.objects;
create policy "owner private media access" on storage.objects for all to authenticated
  using (bucket_id in ('tour-media', 'listing-media', 'property-agent-documents') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('tour-media', 'listing-media', 'property-agent-documents') and (storage.foldername(name))[1] = auth.uid()::text);

-- Admin-only status/role promotion is performed from Supabase Dashboard or a server-side service-role job,
-- never by a browser client. Keep service-role, AI, and other secrets out of VITE_* environment variables.
