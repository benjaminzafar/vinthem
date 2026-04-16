-- Security Hardening Phase 6: tighten RLS and move admin helper into a private schema

create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated, anon, service_role;

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated, anon, service_role;

alter table public.users force row level security;
alter table public.settings force row level security;
alter table public.categories force row level security;
alter table public.products force row level security;
alter table public.blog_posts force row level security;
alter table public.pages force row level security;
alter table public.orders force row level security;
alter table public.reviews force row level security;
alter table public.refund_requests force row level security;
alter table public.support_tickets force row level security;

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can create orders" on public.orders;

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and product_id is not null
  and rating between 1 and 5
  and nullif(btrim(comment), '') is not null
);

drop policy if exists "Users can create refund requests" on public.refund_requests;
create policy "Users can create refund requests"
on public.refund_requests
for insert
to authenticated
with check (
  auth.uid() = user_id
  and nullif(btrim(reason), '') is not null
);

drop policy if exists "Users can create support tickets" on public.support_tickets;
create policy "Users can create support tickets"
on public.support_tickets
for insert
to authenticated
with check (
  auth.uid() = user_id
  and nullif(btrim(subject), '') is not null
  and nullif(btrim(message), '') is not null
);

drop policy if exists "Users can view own refund requests" on public.refund_requests;
create policy "Users can view own refund requests"
on public.refund_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own support tickets" on public.support_tickets;
create policy "Users can view own support tickets"
on public.support_tickets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admin full access" on public.settings;
create policy "Admin full access"
on public.settings
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.categories;
create policy "Admin full access"
on public.categories
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.products;
create policy "Admin full access"
on public.products
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.blog_posts;
create policy "Admin full access"
on public.blog_posts
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.pages;
create policy "Admin full access"
on public.pages
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.orders;
create policy "Admin full access"
on public.orders
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.reviews;
create policy "Admin full access"
on public.reviews
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.refund_requests;
create policy "Admin full access"
on public.refund_requests
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.support_tickets;
create policy "Admin full access"
on public.support_tickets
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admin full access" on public.users;
create policy "Admin full access"
on public.users
for all
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Public Read Access" on storage.objects;
create policy "Public Read Access"
on storage.objects
for select
to public
using (bucket_id = 'images');

drop policy if exists "Admin Upload Access" on storage.objects;
drop policy if exists "Admin Insert Access" on storage.objects;
create policy "Admin Insert Access"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'images' and app_private.is_admin());

drop policy if exists "Admin Update Access" on storage.objects;
create policy "Admin Update Access"
on storage.objects
for update
to authenticated
using (bucket_id = 'images' and app_private.is_admin())
with check (bucket_id = 'images' and app_private.is_admin());

drop policy if exists "Admin Delete Access" on storage.objects;
create policy "Admin Delete Access"
on storage.objects
for delete
to authenticated
using (bucket_id = 'images' and app_private.is_admin());

drop function if exists public.is_admin();
