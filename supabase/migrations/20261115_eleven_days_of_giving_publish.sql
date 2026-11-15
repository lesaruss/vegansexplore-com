-- Sean, 2026-11-15: "yes, make it live". Shows the 11 Days of Giving opportunity (held by 20261115_eleven_days_of_giving_opportunity.sql). Safe to run twice.
update public.ve_dashboard_cards set starts_at = now() where interest_slug = '11-days-of-giving-2026' and starts_at > now();
