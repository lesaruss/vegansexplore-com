-- Welcome emails skip the one-outreach-email-per-address-per-day rule (Sean, 2026-11-16: "yes, let welcome emails skip the daily limit").
-- An owner who got the Featured: Holiday Menus email at 9:00 AM, claimed at 9:07 and was approved would have waited until the next day
-- for Liz's approval email (claims-approved-liz). A campaign that answers the person's own action sets skips_daily_limit;
-- ve-outreach campaignTick reads it. Cold outreach keeps the limit. Safe to run twice.
alter table public.ve_outreach_campaigns add column if not exists skips_daily_limit boolean not null default false;
comment on column public.ve_outreach_campaigns.skips_daily_limit is 'Welcome or reply emails that answer the person''s own action: sent even if the address got another outreach email today (Sean 2026-11-16).';
update public.ve_outreach_campaigns set skips_daily_limit = true where slug = 'claims-approved-liz';
