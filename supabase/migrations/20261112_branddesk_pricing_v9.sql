-- pricing_v9 (canon canon-ve-front-of-house v9 pricing_v9, v14 hot_labs_v12; Sean 2026-11-08 "Lock it").
-- A BrandDesk account now has a plan: site ($500 every 3 months, no setup), managed ($500 a month plus a $250 setup),
-- or managed_v1 (the $1,500 setup plan; every row before v9). One-time add-ons (photos, video) are kept on the row.
-- setup_plan gains 'none' (a Site has no setup). Safe to run twice.
alter table public.ve_branddesk_accounts add column if not exists plan text not null default 'managed_v1';
alter table public.ve_branddesk_accounts add column if not exists addons text[] not null default '{}';
alter table public.ve_branddesk_accounts drop constraint if exists ve_branddesk_accounts_plan_check;
alter table public.ve_branddesk_accounts add constraint ve_branddesk_accounts_plan_check check (plan = any (array['managed_v1','site','managed']));
alter table public.ve_branddesk_accounts drop constraint if exists ve_branddesk_accounts_setup_plan_check;
alter table public.ve_branddesk_accounts add constraint ve_branddesk_accounts_setup_plan_check check (setup_plan = any (array['full','3','6','none']));
-- The v9 agreement is a draft for the lawyer; v9 checkout stays closed to owners until Sean approves it (then set true).
update public.ve_site_settings set value = value || '{"terms_v9": false}'::jsonb where key = 'branddesk' and not (value ? 'terms_v9');
