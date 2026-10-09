-- Brand Partner, $111 a quarter (Sean, 2026-10-08): a third tier on ve_verified_memberships, tier 'brand'.
-- ve-claims (TIERS.brand) sells it through the same quarterly subscription and claim path as Passport Stop and Anchor.
-- These four statements widen the two tier checks. Applied 2026-10-09 by Logan through the Supabase connector
-- (apply_migration), verified in pg_constraint. Schema changes go through the connector, never the dashboard by hand.
alter table public.ve_verified_memberships drop constraint ve_verified_memberships_tier_check;
alter table public.ve_verified_memberships add constraint ve_verified_memberships_tier_check check (tier = any (array['verified','plus','brand']));
alter table public.listings drop constraint listings_ve_verified_tier_check;
alter table public.listings add constraint listings_ve_verified_tier_check check (ve_verified_tier = any (array['verified','plus','brand']));
