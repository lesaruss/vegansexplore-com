-- Vegan-friendly and Vegan-options food places are vetted before the public sees them (Sean, 2026-10-25: "they're not all
-- vetted... it requires 10 different people, not one person 10 times... Otherwise, it's just... in its own section that
-- only shows up for members... I can overrule that, especially if I know the reputation of it"). The rule lives in
-- /public/ve-trust.js (since 2026-09-27, switched off until now): it covers restaurants, cafes, food trucks, catering and
-- meal prep; such a place shows to everyone once 10 different members vote for it (listings.voter_count), the business
-- claims it (claim_status verified) or a super admin vets it in the listing editor (below).

-- 1. Vetted by us: set from the listing editor (ve-claims admin_listing, vetted: true|false).
alter table public.listings add column if not exists vetted_at timestamptz;
alter table public.listings add column if not exists vetted_by uuid;

-- 2. Switch the rule on at 10 different members (the Depot's Claims tab can still change or pause it).
insert into public.ve_site_settings (key, value, updated_at)
values ('directory_trust', '{"enabled": true, "min_voters": 10}'::jsonb, now())
on conflict (key) do update set value = jsonb_set(coalesce(public.ve_site_settings.value, '{}'::jsonb), '{enabled}', 'true'::jsonb), updated_at = now();
