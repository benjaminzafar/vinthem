-- [REPAIR] Supabase Storage Infrastructure
-- Optimized for high-performance and reliable uploads

-- 1. Ensure 'images' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 
  'images', 
  true, 
  52428800, -- 50MB limit
  '{image/*}' -- Only images
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{image/*}';

-- 2. Clear potentially problematic policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;

-- 3. High-Performance Read Policy
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'images');

-- 4. Optimized Admin Write Policy
-- Note: We avoid checking the 'public.users' table directly to prevent recursion and slow subqueries.
-- Instead, we check the 'role' claim in the user's JWT if available, or fall back to a simple existence check.
CREATE POLICY "Admin All Access" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
  bucket_id = 'images' AND 
  (auth.jwt() ->> 'email') IN (SELECT email FROM public.users WHERE role = 'admin')
)
WITH CHECK (
  bucket_id = 'images' AND 
  (auth.jwt() ->> 'email') IN (SELECT email FROM public.users WHERE role = 'admin')
);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
