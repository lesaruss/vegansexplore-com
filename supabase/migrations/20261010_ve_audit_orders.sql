-- The full audit for sale (Sean, 2026-10-10: "Go with $49 and $149, build the page"). Two add-ons, bought in the Restaurant
-- Guide's Your audit tab (ve-restaurant-audit `checkout`, Stripe, back through `confirm`):
--   full     $49   the full audit: every check with why and how, the score, and a re-check 90 days later
--   shopper  $149  the same, plus a Secret Shopper visit: the city's Community Manager (or a member they send) orders, eats
--                  and reports on the welcome, wait, menu, Vegan labeling, cleanliness and how well the staff know the menu,
--                  with photos; the meal is covered up to $40
-- Either one counts toward managed services when the business signs up within 30 days (credit_until).
-- Not part of the $11 Guide, the Partner plan or LESARUSS.AI (Sean, 2026-10-10: "it should be an add on").

create table if not exists public.ve_audit_orders (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  inputs jsonb not null default '{}'::jsonb,          -- what the audit runs on when there is no listing (name, city, website, instagram)
  tier text not null check (tier in ('full', 'shopper')),
  amount_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  test boolean not null default false,
  stripe_session text unique,
  audit_id uuid references public.ve_audits(id) on delete set null,
  paid_at timestamptz,
  recheck_at timestamptz,                             -- 90 days after payment
  recheck_audit_id uuid references public.ve_audits(id) on delete set null,
  credit_until timestamptz,                           -- 30 days after payment: the price counts toward managed services
  shopper_status text check (shopper_status in ('to_arrange', 'scheduled', 'visited', 'reported')),
  shopper_assigned_to text,                           -- who was emailed the visit (the Community Manager, else Sean)
  shopper_report jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ve_audit_orders_member_idx on public.ve_audit_orders (member_id, created_at desc);
create index if not exists ve_audit_orders_recheck_idx on public.ve_audit_orders (recheck_at) where status = 'paid' and recheck_audit_id is null;
alter table public.ve_audit_orders enable row level security;

-- A paid audit links back to its order.
alter table public.ve_audits add column if not exists order_id uuid references public.ve_audit_orders(id) on delete set null;

-- The Restaurant Guide saves and votes on its fixes and promotions, beside episodes and Directory listings.
alter table public.ve_guide_saves drop constraint if exists ve_guide_saves_kind_check;
alter table public.ve_guide_saves add constraint ve_guide_saves_kind_check check (kind in ('swap', 'recipe', 'listing', 'episode', 'fix', 'promo'));
alter table public.ve_guide_votes drop constraint if exists ve_guide_votes_kind_check;
alter table public.ve_guide_votes add constraint ve_guide_votes_kind_check check (kind in ('swap', 'episode', 'fix', 'promo'));
