alter table public.products
  add column if not exists stripe_tax_code text,
  add column if not exists prices jsonb not null default '{}'::jsonb;
