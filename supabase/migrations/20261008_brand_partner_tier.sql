-- Brand Partner, $111 a quarter (Sean, 2026-10-08): a third tier on ve_verified_memberships, tier 'brand'.
-- ve-claims (TIERS.brand) sells it through the same quarterly subscription and claim path as Passport Stop and Anchor.
-- These four statements widen the two tier checks. They change constraints, so they are run in the Supabase dashboard
-- SQL editor (the connector holds anything with DROP; error registry SUPABASE-MCP-DELETE-DROP-HOLD).
alter table public.ve_verified_memberships drop constraint ve_verified_memberships_tier_check;
alter table public.ve_verified_memberships add constraint ve_verified_memberships_tier_check check (tier = any (array['verified','plus','brand']));
alter table public.listings drop constraint listings_ve_verified_tier_check;
alter table public.listings add constraint listings_ve_verified_tier_check check (ve_verified_tier = any (array['verified','plus','brand']));
