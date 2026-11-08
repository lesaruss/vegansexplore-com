-- ve-feedback: Facebook review list (2026-11-08). Applied live through the Supabase connector.
-- The social link scan is finished; its review list is in docs/handoff/2026-11-08-ve-feedback-facebook-review-list.md.
-- No listing data is touched here (removed values live in listings.details.social_removed).
drop function if exists public.ve_social_check_tick();
drop table if exists public.ve_social_link_checks;
drop table if exists public.ve_social_scan_ig;
