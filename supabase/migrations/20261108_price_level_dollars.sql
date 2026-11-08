-- ve-feedback: "$2" on listings (Sean, 2026-11-08). listings.google_price_level held Google's raw level (1 to 4) from an old
-- import, and the listing page printed it as "$ 2". Store it as $ to $$$$; hand-entered ranges ("$10–20") stay as typed.
-- A trigger keeps any future write of a raw number (or Google's PRICE_LEVEL_* name) in the same form.
create or replace function ve_price_level_dollars(v text) returns text language sql immutable as $fn$
  select case
    when v is null then null
    when trim(v) ~ '^[1-4]$' then repeat('$', trim(v)::int)
    when upper(trim(v)) = 'PRICE_LEVEL_INEXPENSIVE' then '$'
    when upper(trim(v)) = 'PRICE_LEVEL_MODERATE' then '$$'
    when upper(trim(v)) = 'PRICE_LEVEL_EXPENSIVE' then '$$$'
    when upper(trim(v)) = 'PRICE_LEVEL_VERY_EXPENSIVE' then '$$$$'
    when upper(trim(v)) in ('0', 'PRICE_LEVEL_FREE', 'PRICE_LEVEL_UNSPECIFIED', '') then null
    else v end $fn$;

create or replace function ve_listings_price_level_guard() returns trigger language plpgsql as $fn$
begin
  new.google_price_level := ve_price_level_dollars(new.google_price_level);
  return new;
end $fn$;
drop trigger if exists trg_ve_listings_price_level on listings;
create trigger trg_ve_listings_price_level before insert or update of google_price_level on listings
  for each row execute function ve_listings_price_level_guard();

-- The existing rows, each change logged.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'google_price_level', to_jsonb(google_price_level), to_jsonb(ve_price_level_dollars(google_price_level)),
  jsonb_build_object('where', 'cleanup', 'why', 've-feedback: Google price level as dollar signs', 'by', 'logan', 'at', '2026-11-08')
from listings where google_price_level is distinct from ve_price_level_dollars(google_price_level);
update listings set google_price_level = ve_price_level_dollars(google_price_level)
where google_price_level is distinct from ve_price_level_dollars(google_price_level);
