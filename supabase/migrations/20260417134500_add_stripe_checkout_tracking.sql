alter table public.orders
  add column if not exists checkout_session_id text,
  add column if not exists presentment_currency text,
  add column if not exists presentment_total numeric(10, 2),
  add column if not exists tax_amount numeric(10, 2);
