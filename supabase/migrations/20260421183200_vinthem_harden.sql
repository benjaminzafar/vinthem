-- VINTHEM: ULTIMATE RLS HARDENING (FIXED - NON-RECURSIVE)
-- This script ensures every table has RLS enabled without infinite recursion blocks.
-- Applies to: users, settings, products, categories, blog_posts, pages, reviews, 
-- integrations, orders, addresses, support_tickets, refund_requests, newsletter_subscribers, newsletter_campaigns.

-- 1. ENABLE RLS FOR ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- 2. DEFINE POLICIES

-- SETTINGS: Public READ, Admin WRITE.
DROP POLICY IF EXISTS "Public read access to settings" ON public.settings;
CREATE POLICY "Public read access to settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins have full access to settings" ON public.settings;
CREATE POLICY "Admins have full access to settings" ON public.settings FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- USERS: Non-recursive policies.
-- CRITICAL: We avoid recursion by only allowing a user to see themselves.
-- CRM visibility is handled by the service_role in the backend.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
CREATE POLICY "Admins have full access to users" ON public.users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- PRODUCTS: Public READ, Admin WRITE.
DROP POLICY IF EXISTS "Public read access to products" ON public.products;
CREATE POLICY "Public read access to products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- CATEGORIES: Public READ, Admin WRITE.
DROP POLICY IF EXISTS "Public read access to categories" ON public.categories;
CREATE POLICY "Public read access to categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories" ON public.categories FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- BLOG POSTS: Public READ, Admin WRITE.
DROP POLICY IF EXISTS "Public read access to blog_posts" ON public.blog_posts;
CREATE POLICY "Public read access to blog_posts" ON public.blog_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins have full access to blog_posts" ON public.blog_posts;
CREATE POLICY "Admins have full access to blog_posts" ON public.blog_posts FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- PAGES: Public READ, Admin WRITE.
DROP POLICY IF EXISTS "Public read access to pages" ON public.pages;
CREATE POLICY "Public read access to pages" ON public.pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins have full access to pages" ON public.pages;
CREATE POLICY "Admins have full access to pages" ON public.pages FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- REVIEWS: Public READ, Auth User CREATE, Admin FULL.
DROP POLICY IF EXISTS "Public read access to reviews" ON public.reviews;
CREATE POLICY "Public read access to reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.reviews;
CREATE POLICY "Admins have full access to reviews" ON public.reviews FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- ADDRESSES: Owner ACCESS, Admin FULL.
DROP POLICY IF EXISTS "Users have full access to own addresses" ON public.addresses;
CREATE POLICY "Users have full access to own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins have full access to addresses" ON public.addresses;
CREATE POLICY "Admins have full access to addresses" ON public.addresses FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- ORDERS & REFUND REQUESTS: Owner ACCESS, Admin FULL.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "Users can view own refunds" ON public.refund_requests;
CREATE POLICY "Users can view own refunds" ON public.refund_requests FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins have full access to refunds" ON public.refund_requests;
CREATE POLICY "Admins have full access to refunds" ON public.refund_requests FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- SUPPORT TICKETS: Public INSERT, Owner SELECT, Admin FULL.
DROP POLICY IF EXISTS "Public can create support tickets" ON public.support_tickets;
CREATE POLICY "Public can create support tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins have full access to tickets" ON public.support_tickets;
CREATE POLICY "Admins have full access to tickets" ON public.support_tickets FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- NEWSLETTER: Public INSERT, Admin FULL.
DROP POLICY IF EXISTS "Public can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Public can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins have full access to subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins have full access to subscribers" ON public.newsletter_subscribers FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

DROP POLICY IF EXISTS "Admins have full access to campaigns" ON public.newsletter_campaigns;
CREATE POLICY "Admins have full access to campaigns" ON public.newsletter_campaigns FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- INTEGRATIONS: Admin FULL.
DROP POLICY IF EXISTS "Admins have full access to integrations" ON public.integrations;
CREATE POLICY "Admins have full access to integrations" ON public.integrations FOR ALL USING (
    (auth.jwt() ->> 'role' = 'service_role') OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);
