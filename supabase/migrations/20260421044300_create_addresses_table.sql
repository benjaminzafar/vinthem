-- Create Addresses Table
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  first_name text not null,
  last_name text not null,
  street text not null,
  city text not null,
  postal_code text not null,
  country text not null default 'SE',
  is_default boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.addresses enable row level security;

-- Policies
drop policy if exists "Users can manage own addresses" on public.addresses;
create policy "Users can manage own addresses"
on public.addresses
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admin View Policy
drop policy if exists "Admins can view all addresses" on public.addresses;
create policy "Admins can view all addresses"
on public.addresses
for select
to authenticated
using (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);

-- Ensure users table has full_name (standardization)
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='users' and column_name='full_name') then
        alter table public.users add column full_name text;
    end if;
end $$;

-- Create Integrations Table
create table if not exists public.integrations (
  id text primary key default 'primary',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now() not null
);

-- Enable RLS on integrations
alter table public.integrations enable row level security;
alter table public.integrations force row level security;

-- Admin Full Access: Admins can do everything
drop policy if exists "Admin full access" on public.integrations;
create policy "Admin full access"
on public.integrations
for all
using (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  )
);
