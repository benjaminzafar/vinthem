-- Mavren Shop: Beautiful Storefront Seed Data
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/xeatyjjiywcrkuvifyhm/sql/new)
-- to restore your "Beautiful Hero Section" and "Featured Products".

-- 1. SEED CATEGORIES
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  show_in_hero = EXCLUDED.show_in_hero,
  image_url = EXCLUDED.image_url;

-- 2. SEED PRODUCTS
INSERT INTO public.products (title, description, price, stock, category, category_id, image_url, is_featured, sku)
VALUES 
  (
    'Mavren Modular Sofa', 
    'Handcrafted with premium linen and sustainable oak. Designed for comfort and longevity.', 
    12499.00, 
    5, 
    'Living Room', 
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
    'Bedroom', 
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
    'Living Room', 
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
    'Kitchen', 
    '85f4d8a1-c8b2-4d5e-9f0a-1a2b3c4d5e8f', 
    'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=2940&auto=format&fit=crop', 
    true, 
    'MAV-CLOCK-04'
  )
ON CONFLICT (sku) DO NOTHING;
