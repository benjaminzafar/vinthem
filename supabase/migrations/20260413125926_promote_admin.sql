-- Promote main owner to admin role
-- Step 1: Promote via public.users using join with auth.users
UPDATE public.users u
SET role = 'admin'
FROM auth.users a
WHERE u.id = a.id AND a.email = 'benjaminzafar10@gmail.com';

-- Step 2: Ensure the user exists in public.users if they haven't been created yet
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, 'Store Admin', 'admin'
FROM auth.users
WHERE email = 'benjaminzafar10@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email;

-- Step 3: Initialize primary settings row if missing
INSERT INTO public.settings (id, data)
VALUES (
  'primary', 
  '{
    "storeName": {"en": "Mavren Shop", "sv": "Mavren Shop"},
    "primaryColor": "#000000",
    "heroBackgroundColor": "#f8f8f8"
  }'
)
ON CONFLICT (id) DO NOTHING;
