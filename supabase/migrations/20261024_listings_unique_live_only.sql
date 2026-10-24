-- One listing per name and place counts only listings that are not set aside (Sean, 2026-10-24: Kite Hill would not save
-- as Online only). Merged duplicates and set-aside listings keep status 'rejected' and are never deleted (2026-10-10), so the
-- old index made a listing collide with its own retired copy (Kite Hill and kitehillfoods, merged into it, both with no city).
create unique index if not exists listings_name_city_state_unique_live on public.listings
  (lower(trim(both from name)), lower(trim(both from coalesce(address_city, ''))), lower(trim(both from coalesce(address_state, ''))))
  where status <> 'rejected';
drop index if exists public.listings_name_city_state_unique;
