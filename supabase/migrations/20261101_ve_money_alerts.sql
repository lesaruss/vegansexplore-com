-- Money in: one email to the team for every live payment the Stripe webhook receives (Sean, 2026-11-01: "Is there something
-- that can be sent to me whenever we receive money?... branded and let me know what was purchased and by whom").
-- One row per payment (a Checkout session, or a renewal invoice), so a Stripe retry never sends twice; the month's totals in
-- the email are read from here.
create table if not exists public.ve_money_alerts (
  id uuid primary key default gen_random_uuid(),
  stripe_id text not null unique,            -- cs_... or in_...
  kind text not null,                        -- checkout | renewal
  account text,                              -- vegans-explore | lesaruss | meatless-muscle
  brand text,
  product text,
  amount_cents integer not null,
  currency text not null default 'usd',
  buyer_email text,
  buyer_name text,
  member_id uuid,
  sent_at timestamptz,
  send_error text,
  created_at timestamptz not null default now()
);
alter table public.ve_money_alerts enable row level security;
create index if not exists ve_money_alerts_created_idx on public.ve_money_alerts(created_at);
