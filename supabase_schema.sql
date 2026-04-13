-- Mavren Shop Supabase Schema
-- Run this in the Supabase SQL Editor to initialize all required tables and RLS policies.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Users / Profiles
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings
create table if not exists public.settings (
  id text primary key, -- 'primary'
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  translations jsonb default '{}'::jsonb,
  is_featured boolean default false,
  show_in_hero boolean default false,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  icon_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price numeric(10, 2),
  stock integer default 0,
  category text,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  additional_images text[],
  rating numeric(3, 2) default 5.0,
  review_count integer default 0,
  is_featured boolean default false,
  is_new boolean default false,
  is_sale boolean default false,
  sale_price numeric(10, 2),
  translations jsonb default '{}'::jsonb,
  prices jsonb default '{}'::jsonb,
  options jsonb default '[]'::jsonb,
  variants jsonb default '[]'::jsonb,
  tags text[],
  sku text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blog Posts
create table if not exists public.blog_posts (
  id uuid default uuid_generate_v4() primary key,
  title jsonb not null, -- LocalizedString
  excerpt jsonb not null, -- LocalizedString
  content jsonb not null, -- LocalizedString
  image_url text,
  author text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Static Pages
create table if not exists public.pages (
  id uuid default uuid_generate_v4() primary key,
  title jsonb not null, -- LocalizedString
  slug text unique not null,
  content jsonb not null, -- LocalizedString
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_id text unique,
  user_id uuid references auth.users on delete set null,
  items jsonb not null,
  total numeric(10, 2) not null,
  subtotal numeric(10, 2) not null,
  shipping_cost numeric(10, 2) default 0,
  currency text default 'sek',
  status text default 'Pending',
  shipping_details jsonb not null,
  payment_method text,
  payment_intent_id text,
  is_test_data boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  user_name text,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  admin_reply text,
  admin_reply_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Refund Requests
create table if not exists public.refund_requests (
  id uuid default uuid_generate_v4() primary key,
  order_id text, -- Custom order ID
  reason text not null,
  status text default 'Pending',
  user_id uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Support Tickets
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete set null,
  subject text not null,
  message text not null,
  status text default 'open',
  is_test_data boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE RLS
alter table public.users enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.blog_posts enable row level security;
alter table public.pages enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.refund_requests enable row level security;
alter table public.support_tickets enable row level security;

-- 4. RLS POLICIES (Simplified for Admin + Public Read)

-- Public Read Policies
create policy "Allow public read" on public.settings for select using (true);
create policy "Allow public read" on public.categories for select using (true);
create policy "Allow public read" on public.products for select using (true);
create policy "Allow public read" on public.blog_posts for select using (true);
create policy "Allow public read" on public.pages for select using (true);
create policy "Allow public read" on public.reviews for select using (true);

-- Authenticated User Policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create orders" on public.orders for insert with check (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users can create refund requests" on public.refund_requests for insert with check (true);
create policy "Users can create support tickets" on public.support_tickets for insert with check (true);

-- Admin Policies (Assuming 'role' in users table or specific admin UIDs)
-- You can replace 'admin' with your specific user ID or logic
create policy "Admin full access" on public.settings for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.categories for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.products for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.blog_posts for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.pages for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.orders for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.reviews for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.refund_requests for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.support_tickets for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "Admin full access" on public.users for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
