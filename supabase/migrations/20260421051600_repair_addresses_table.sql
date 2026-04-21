-- Repair: Re-create addresses table and harden RLS
-- This migration ensures the table exists and has full CRUD policies for users.

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

-- Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses FORCE ROW LEVEL SECURITY;

-- 1. SELECT Policy
DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses"
ON public.addresses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. INSERT Policy
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
CREATE POLICY "Users can insert own addresses"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE Policy
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
ON public.addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE Policy
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
ON public.addresses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Admin Policy
DROP POLICY IF EXISTS "Admin full access to addresses" ON public.addresses;
CREATE POLICY "Admin full access to addresses"
ON public.addresses
FOR ALL
TO authenticated
USING (app_private.is_admin())
WITH CHECK (app_private.is_admin());

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
