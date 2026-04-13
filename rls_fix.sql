-- Supabase RLS Recursion Fix
-- This script fixes the "infinite recursion" error by using a SECURITY DEFINER function.
-- Run this in the Supabase SQL Editor.

-- 1. Create the is_admin() helper function
-- SECURITY DEFINER allows the function to bypass RLS when checking the users table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing circular policies (to ensure a clean slate)
DROP POLICY IF EXISTS "Admin full access" ON public.settings;
DROP POLICY IF EXISTS "Admin full access" ON public.categories;
DROP POLICY IF EXISTS "Admin full access" ON public.products;
DROP POLICY IF EXISTS "Admin full access" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin full access" ON public.pages;
DROP POLICY IF EXISTS "Admin full access" ON public.orders;
DROP POLICY IF EXISTS "Admin full access" ON public.reviews;
DROP POLICY IF EXISTS "Admin full access" ON public.refund_requests;
DROP POLICY IF EXISTS "Admin full access" ON public.support_tickets;
DROP POLICY IF EXISTS "Admin full access" ON public.users;

-- 3. Re-apply Admin Policies using the is_admin() function
CREATE POLICY "Admin full access" ON public.settings FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.categories FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.products FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.blog_posts FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.pages FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.orders FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.reviews FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.refund_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.support_tickets FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON public.users FOR ALL USING (is_admin());

-- 4. Manual Admin Promotion
-- IMPORTANT: Run the following line replacing 'YOUR_USER_ID' with your actual user ID from the Auth -> Users table.
-- INSERT INTO public.users (id, role, full_name) VALUES ('YOUR_USER_ID', 'admin', 'Store Admin') 
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
