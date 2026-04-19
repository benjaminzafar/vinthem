-- Security Hardening: Enable RLS on integrations table
-- This table stores sensitive API keys (PostHog, Stripe, etc.)

alter table if exists public.integrations enable row level security;
alter table if exists public.integrations force row level security;

-- Admin Full Access: Admins can do everything
drop policy if exists "Admin full access" on public.integrations;
create policy "Admin full access"
on public.integrations
for all
using (app_private.is_admin())
with check (app_private.is_admin());

-- No regular user access is defined, which by default denies all other roles.
-- This ensures that only admins can read/write API keys.
