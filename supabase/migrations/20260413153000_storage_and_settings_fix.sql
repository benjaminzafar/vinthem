-- Storefront Infrastructure Fix: Storage & Settings Initialization

-- 1. STORAGE: Create 'images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE POLICIES: Public Read
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'images');

-- 3. STORAGE POLICIES: Admin Write
-- We use a SECURITY DEFINER function to check admin role without recursion issues in policies
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
CREATE POLICY "Admin Upload Access" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'images' AND 
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
)
WITH CHECK (
  bucket_id = 'images' AND 
  (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- 4. SETTINGS INITIALIZATION: Ensure 'primary' row exists
INSERT INTO public.settings (id, data)
VALUES ('primary', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
