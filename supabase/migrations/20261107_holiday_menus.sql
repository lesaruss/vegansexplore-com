-- ve-holiday-guide step 1: the business holiday menu form (canon-ve-holiday-guide v1, Sean 2026-11-07).
-- ve_holidays: one row a holiday (when menus close, when the Guide promotes them). ve_holiday_menus: one menu a listing a holiday,
-- sent by its owner (or a member whose claim on it is open), checked by a person before it shows. RLS on, no policies:
-- everything goes through the edge function ve-holiday. Plus the dated dashboard card for business members. Safe to run twice.

create table if not exists ve_holidays (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,                 -- what members read: ThanksLiving (Thanksgiving)
  holiday_on date not null,
  submit_close timestamptz not null,  -- menus are refused from this moment
  promo_from date not null,
  promo_to date not null,
  sort int not null default 0,
  active boolean not null default true
);
alter table ve_holidays enable row level security;

insert into ve_holidays (slug, name, holiday_on, submit_close, promo_from, promo_to, sort) values
  ('thanksliving', 'ThanksLiving (Thanksgiving)', '2026-11-26', '2026-11-19 05:00+00', '2026-11-19', '2026-11-26', 10),
  ('hanukkah',     'Hanukkah',                    '2026-12-04', '2026-12-01 05:00+00', '2026-12-01', '2026-12-12', 20),
  ('christmas',    'Christmas',                   '2026-12-25', '2026-12-15 05:00+00', '2026-12-15', '2026-12-25', 30),
  ('kwanzaa',      'Kwanzaa',                     '2026-12-26', '2026-12-15 05:00+00', '2026-12-15', '2027-01-01', 40)
on conflict (slug) do nothing;

create table if not exists ve_holiday_menus (
  id uuid primary key default gen_random_uuid(),
  holiday_slug text not null references ve_holidays(slug),
  listing_id uuid not null references listings(id),
  member_id uuid not null references members(id),
  status text not null default 'pending' check (status in ('pending', 'live', 'declined', 'withdrawn')),
  summary text not null default '',          -- one or two lines on the offer
  items jsonb not null default '[]'::jsonb,  -- [{name, desc, price}], up to 20
  order_url text,
  order_by date,
  pickup text,
  price_range text,
  holiday_hours text,
  contact_note text,                          -- anything the team should know
  team_note text,
  decline_note text,                          -- the owner reads this
  reviewed_by uuid references members(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (holiday_slug, listing_id)
);
alter table ve_holiday_menus enable row level security;
create index if not exists ve_holiday_menus_status on ve_holiday_menus (holiday_slug, status);
create index if not exists ve_holiday_menus_member on ve_holiday_menus (member_id);

-- The business member's one more thing to do: a card on the dashboard until menus close (Business version).
insert into ve_dashboard_cards (audience, kind, title, body, cta_label, cta_url, starts_at, ends_at, sort)
select 'business', 'new', 'Send your ThanksLiving menu by November 18',
  'Selling anything for ThanksLiving (Thanksgiving)? Send us your menu, order-by date and holiday hours, and we feature it in the Holiday Guide, free for members. Update your holiday hours while you are there.',
  'Send my menu', '/business/holiday-menu', now(), '2026-11-19 05:00+00', 1
where not exists (select 1 from ve_dashboard_cards where cta_url = '/business/holiday-menu' and title like 'Send your ThanksLiving menu%');
