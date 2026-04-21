-- Mavren Shop: Schema Repair & Beautiful Seed Data
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/xeatyjjiywcrkuvifyhm/sql/new

-- 0. HARDEN CORE SCHEMA (Enforce SKU uniqueness for UPSERT)
-- First, fix any existing products with missing or duplicate empty SKUs to avoid index conflicts
UPDATE public.products SET sku = id::text WHERE sku IS NULL OR sku = '';

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);

-- 1. REPAIR STORAGE (Create 'images' bucket if missing)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access') THEN
        CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Access') THEN
        CREATE POLICY "Public Insert Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update Access') THEN
        CREATE POLICY "Public Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'images');
    END IF;
END $$;

-- 1. CRM & ORDERS TABLES (New Fixes)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    display_name text,
    role text DEFAULT 'client',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    street text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL DEFAULT 'SE',
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS for addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Users can manage own addresses') THEN
        CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Admin full access to addresses') THEN
        CREATE POLICY "Admin full access to addresses" ON public.addresses FOR ALL TO authenticated USING (app_private.is_admin()) WITH CHECK (app_private.is_admin());
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.integrations (
    id text PRIMARY KEY DEFAULT 'primary',
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text UNIQUE NOT NULL,
    customer_email text NOT NULL,
    total numeric(10, 2) DEFAULT 0.00,
    status text DEFAULT 'Processing',
    items jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email text NOT NULL,
    subject text NOT NULL,
    description text,
    status text DEFAULT 'open',
    priority text DEFAULT 'NORMAL',
    image_url text,
    messages jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    subscribed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    content text NOT NULL,
    sent_at timestamptz DEFAULT now(),
    recipient_count integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.refund_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    order_id text NOT NULL,
    status text DEFAULT 'Pending',
    reason text,
    created_at timestamptz DEFAULT now()
);

-- 2. REPAIR CATEGORIES TABLE
DO $$ 
BEGIN 
    -- Add missing columns to categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='slug') THEN
        ALTER TABLE public.categories ADD COLUMN slug text;
        UPDATE public.categories SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;
        ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='description') THEN
        ALTER TABLE public.categories ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='translations') THEN
        ALTER TABLE public.categories ADD COLUMN translations jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='is_featured') THEN
        ALTER TABLE public.categories ADD COLUMN is_featured boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='show_in_hero') THEN
        ALTER TABLE public.categories ADD COLUMN show_in_hero boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='parent_id') THEN
        ALTER TABLE public.categories ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='image_url') THEN
        ALTER TABLE public.categories ADD COLUMN image_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='icon_url') THEN
        ALTER TABLE public.categories ADD COLUMN icon_url text;
    END IF;
END $$;

-- 2. REPAIR PRODUCTS TABLE
DO $$ 
BEGIN 
    -- Add missing columns to products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category_id') THEN
        ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='description') THEN
        ALTER TABLE public.products ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_featured') THEN
        ALTER TABLE public.products ADD COLUMN is_featured boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_new') THEN
        ALTER TABLE public.products ADD COLUMN is_new boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_sale') THEN
        ALTER TABLE public.products ADD COLUMN is_sale boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sale_price') THEN
        ALTER TABLE public.products ADD COLUMN sale_price numeric(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='translations') THEN
        ALTER TABLE public.products ADD COLUMN translations jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='prices') THEN
        ALTER TABLE public.products ADD COLUMN prices jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='options') THEN
        ALTER TABLE public.products ADD COLUMN options jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='variants') THEN
        ALTER TABLE public.products ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tags') THEN
        ALTER TABLE public.products ADD COLUMN tags text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sku') THEN
        ALTER TABLE public.products ADD COLUMN sku text UNIQUE;
    END IF;
END $$;

-- 3. SEED BEAUTIFUL DATA
-- First, ensure the categories exist so we can link products
INSERT INTO public.categories (id, name, slug, description, is_featured, show_in_hero, image_url)
VALUES 
  (
    '65f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e6f', 
    'Living Room', 
    'living-room', 
    'Serene and minimal designs for your gathering space.', 
    true, 
    true, 
    'https://images.unsplash.com/photo-1618220179428-22790b46a015?q=80&w=2727&auto=format&fit=crop'
  ),
  (
    '75f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e7f', 
    'Bedroom', 
    'bedroom', 
    'Restful textures and calming tones for your sanctuary.', 
    true, 
    true, 
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2940&auto=format&fit=crop'
  ),
  (
    '85f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e8f', 
    'Kitchen', 
    'kitchen', 
    'Functional elegance for the heart of your home.', 
    true, 
    false, 
    'https://images.unsplash.com/photo-1556911220-e15224bbaf40?q=80&w=2940&auto=format&fit=crop'
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  show_in_hero = EXCLUDED.show_in_hero,
  image_url = EXCLUDED.image_url;

-- Now insert products with verified category_id
INSERT INTO public.products (title, description, price, stock, category_id, image_url, is_featured, sku)
VALUES 
  (
    'Mavren Modular Sofa', 
    'Handcrafted with premium linen and sustainable oak. Designed for comfort and longevity.', 
    12499.00, 
    5, 
    '65f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e6f', 
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2940&auto=format&fit=crop', 
    true, 
    'MAV-SOFA-01'
  ),
  (
    'Nordic Oak Bed Frame', 
    'Solid European oak with a natural oil finish. A timeless piece for any bedroom.', 
    8990.00, 
    8, 
    '75f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e7f', 
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2940&auto=format&fit=crop', 
    true, 
    'MAV-BED-02'
  ),
  (
    'Ceramic Arch Vase', 
    'Matte white stoneware, individually hand-thrown. Perfect for sculptural simplicity.', 
    450.00, 
    25, 
    '65f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e6f', 
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?q=80&w=2940&auto=format&fit=crop', 
    true, 
    'MAV-VASE-03'
  ),
  (
    'Minimalist Wall Clock', 
    'Silent movement with brushed aluminum markers. Elegance in every second.', 
    699.00, 
    12, 
    '85f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e8f', 
    'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=2940&auto=format&fit=crop', 
    true, 
    'MAV-CLOCK-04'
  )
ON CONFLICT (sku) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category_id = EXCLUDED.category_id,
  image_url = EXCLUDED.image_url;

-- 4. FINAL HARDENING: Restore commercial flow
UPDATE public.products SET stock = 50 WHERE stock IS NULL OR stock = 0;
UPDATE public.products SET status = 'published' WHERE status IS NULL;
