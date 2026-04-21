-- Deep Security Hardening: RLS Improvements
-- This migration fixes gaps in the user/order privacy model.

-- 1. Correct User Profile Visibility
-- Users must be able to read their own record for profile syncing and display.
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

-- 2. Explicit Order Visibility
-- While force RLS is on, an explicit policy for customers viewing their own history is essential.
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

-- 3. Explicit Address Visibility
drop policy if exists "Users can view own addresses" on public.addresses;
create policy "Users can view own addresses"
on public.addresses
for select
to authenticated
using (auth.uid() = user_id);

-- 4. Harden Admin Helpers
-- Ensure the admin check is cached and efficient.
create or replace function app_private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5. Rate Limiting Table (Infrastructure Verification)
-- Ensure the internal rate limiting table exists if we pivot to DB-backed or for tracking.
create table if not exists public.rate_limits (
  key text primary key,
  count integer default 1,
  reset_at timestamptz not null,
  created_at timestamptz default now()
);

-- RLS for rate_limits: Only service role should touch this, but we'll enable it for safety.
alter table public.rate_limits enable row level security;
drop policy if exists "Service role only" on public.rate_limits;
create policy "Service role only"
on public.rate_limits
for all
to service_role
using (true)
with check (true);
