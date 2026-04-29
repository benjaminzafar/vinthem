-- Reconcile recovered repository schema with the live public schema contract.
-- Goal: keep fresh environments compatible with the code paths currently used
-- in storefront checkout, profile, CRM, and admin surfaces.

begin;

-- Users/profile metadata relied on by auth, consent, and admin checks.
alter table if exists public.users
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  add column if not exists accepted_terms_at timestamp with time zone,
  add column if not exists accepted_privacy_at timestamp with time zone,
  add column if not exists marketing_consent boolean default false,
  add column if not exists marketing_consent_at timestamp with time zone;

-- Orders contract currently used by checkout, payments, profile, and admin.
alter table if exists public.orders
  add column if not exists customer_email text;

-- Support ticket contract used by profile and CRM conversations.
alter table if exists public.support_tickets
  add column if not exists customer_email text,
  add column if not exists description text,
  add column if not exists priority text default 'NORMAL',
  add column if not exists messages jsonb default '[]'::jsonb;

-- Helpful indexes for owner lookups and timeline views.
create index if not exists idx_orders_user_id_created_at
  on public.orders (user_id, created_at desc);

create index if not exists idx_orders_customer_email_created_at
  on public.orders (customer_email, created_at desc);

create index if not exists idx_support_tickets_user_id_created_at
  on public.support_tickets (user_id, created_at desc);

create index if not exists idx_support_tickets_customer_email_created_at
  on public.support_tickets (customer_email, created_at desc);

create index if not exists idx_refund_requests_user_id_created_at
  on public.refund_requests (user_id, created_at desc);

-- Canonical RLS cleanup for the drifted owner-facing tables.
drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can create orders" on public.orders;
drop policy if exists "Admins have full access to orders" on public.orders;
drop policy if exists "Admin full access" on public.orders;

create policy "Users can view own orders" on public.orders
  for select
  using (
    auth.uid() = user_id
    or lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Admins have full access to orders" on public.orders
  for all
  using (
    (auth.jwt() ->> 'role' = 'service_role')
    or exists (
      select 1
      from public.users
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    (auth.jwt() ->> 'role' = 'service_role')
    or exists (
      select 1
      from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Users can view own refunds" on public.refund_requests;
drop policy if exists "Users can create refund requests" on public.refund_requests;
drop policy if exists "Admins have full access to refunds" on public.refund_requests;
drop policy if exists "Admin full access" on public.refund_requests;

create policy "Users can view own refunds" on public.refund_requests
  for select
  using (auth.uid() = user_id);

create policy "Users can create refund requests" on public.refund_requests
  for insert
  with check (auth.uid() = user_id);

create policy "Admins have full access to refunds" on public.refund_requests
  for all
  using (
    (auth.jwt() ->> 'role' = 'service_role')
    or exists (
      select 1
      from public.users
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    (auth.jwt() ->> 'role' = 'service_role')
    or exists (
      select 1
      from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Users can view own tickets" on public.support_tickets;
drop policy if exists "Users can create support tickets" on public.support_tickets;
drop policy if exists "Public can create support tickets" on public.support_tickets;
drop policy if exists "Admins have full access to tickets" on public.support_tickets;
drop policy if exists "Admin full access" on public.support_tickets;

create policy "Users can view own tickets" on public.support_tickets
  for select
  using (
    auth.uid() = user_id
    or lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Users can create support tickets" on public.support_tickets
  for insert
  with check (auth.uid() = user_id);

create policy "Admins have full access to tickets" on public.support_tickets
  for all
  using (
    (auth.jwt() ->> 'role' = 'service_role')
    or exists (
      select 1
      from public.users
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    (auth.jwt() ->> 'role' = 'service_role')
    or exists (
      select 1
      from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

commit;
