-- brooke-sellers / branddesk-production-wing: BrandDesk accounts that are not restaurants (Sean, 2026-11-08: "go").
-- kind: which onboarding checklist the account gets (restaurant, the original; creator, for people and creators).
-- kit_brand: a brand kit kept in ve_brand_cartridges (by brand_slug) instead of a listing's ve_cartridges row.
-- plan_line: the plan in words when it is not the standard setup + $500 a month (a founding partner, billed outside BrandDesk).
alter table public.ve_branddesk_accounts add column if not exists kind text not null default 'restaurant';
alter table public.ve_branddesk_accounts drop constraint if exists ve_branddesk_accounts_kind_check;
alter table public.ve_branddesk_accounts add constraint ve_branddesk_accounts_kind_check check (kind in ('restaurant', 'creator'));
alter table public.ve_branddesk_accounts add column if not exists kit_brand text;
alter table public.ve_branddesk_accounts add column if not exists plan_line text;

update public.ve_branddesk_accounts set kind = 'creator', kit_brand = 'meatless-muscle',
  plan_line = 'Founding partner: $200 a month, billed by LESARUSS Inc. from November 30, 2026'
where listing_id = (select id from public.listings where slug = 'brooke-sellers') and status in ('active', 'paused', 'canceling');
