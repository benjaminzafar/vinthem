-- REPAIR PRODUCTS SCHEMA
-- Adding missing columns expected by the modern Admin Dashboard

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_coming_soon boolean DEFAULT false;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}'::text[];

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}'::text[];

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS shipping_class text DEFAULT '';

-- Fix mismatch if is_new was missing (though usually present)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;

-- Notify schema change
NOTIFY pgrst, 'reload schema';
