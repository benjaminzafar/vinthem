-- Fix: Reset product stock to restore Add to Cart functionality
UPDATE public.products
SET stock = 50
WHERE stock IS NULL OR stock = 0;

-- Optional: Ensure all products are published for storefront visibility
UPDATE public.products
SET status = 'published'
WHERE status IS NULL;
