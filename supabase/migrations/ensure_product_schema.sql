-- REPAIR PRODUCTS SCHEMA
-- Run this in the Supabase SQL Editor to ensure all columns exist
-- This enables "Save as Draft", proper shipping metrics, and status tracking.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_class text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_coming_soon boolean DEFAULT false;

-- Comment out the following if you want to keep old data as 'published'
-- UPDATE public.products SET status = 'published' WHERE status IS NULL;

-- Enable PostgREST reload
NOTIFY pgrst, 'reload schema';
