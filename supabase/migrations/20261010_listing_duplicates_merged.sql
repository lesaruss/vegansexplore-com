-- Duplicate listings merged (Sean, 2026-10-10: "merge the duplicates"). Nothing is deleted: a merged copy
-- gets status 'rejected' and details.merged_into (the listing that stays), so it never shows and can be
-- restored. What pointed at a copy moves to the listing that stays.
--
-- 1. Three public pairs of the same business: BunnieCakes (the Miami listing stays, the copy's logo moves
--    over), The Rabbit Hole (Pompano Beach stays) and Soulicious Vegan Kitchen (Apopka stays); the last two
--    were near-empty "Community Partner" copies, so the restaurant gains that category and their queued,
--    never-sent outreach (with the contact) moves to it.
-- 2. Hidden (quarantined) import copies whose name matches exactly one approved listing and that carry no city
--    (the old site's project pages). Copies with a different city are other locations (Zak the Baker Aventura,
--    Loving Hut Miramar, Whole Foods Sunrise) and stay; names shared by several approved branches stay too.
--    Their queued outreach moves to the listing that stays, or is skipped when that listing already has one.

create temp table merge_map (dupe uuid primary key, keeper uuid not null) on commit drop;

insert into merge_map
select d.id, k.id from listings d join listings k on k.status = 'approved'
where d.status = 'approved' and (d.slug, k.slug) in (('bunnie-cakes', 'bunniecakes'),
  ('the-rabbit-hole-fort-lauderdale', 'the-rabbit-hole'), ('soulicious-vegan-kitchen-orlando', 'soulicious-vegan-kitchen'));

update listings k set logo_url = d.logo_url, logo_alt_text = d.logo_alt_text, updated_at = now()
from merge_map m join listings d on d.id = m.dupe
where k.id = m.keeper and coalesce(k.logo_url, '') = '' and coalesce(d.logo_url, '') <> '';

update listings k set extra_categories = array_append(coalesce(k.extra_categories, '{}'), 'Community Partner'), updated_at = now()
from merge_map m join listings d on d.id = m.dupe
where k.id = m.keeper and d.category = 'Community Partner' and not ('Community Partner' = any(coalesce(k.extra_categories, '{}')));

with n as (select id, status, address_city,
  regexp_replace(lower(regexp_replace(split_part(split_part(name, ' | ', 1), ' - ', 1), '^the\s+', '', 'i')), '[^a-z0-9]', '', 'g') k from listings),
ap as (select k, (array_agg(id))[1] keeper from n where status = 'approved' group by k having count(*) = 1)
insert into merge_map
select n.id, ap.keeper from n join ap on ap.k = n.k
where n.status = 'quarantined' and length(n.k) >= 4 and coalesce(n.address_city, '') = ''
on conflict (dupe) do nothing;

-- Outreach: one copy's queued outreach moves to the listing that stays (when it has none for that step);
-- every other copy's for the same step is skipped, so nobody is emailed twice.
with ranked as (
  select o.id, m.keeper, o.sequence_step,
    exists (select 1 from listing_outreach o2 where o2.listing_id = m.keeper and o2.sequence_step = o.sequence_step) keeper_has,
    row_number() over (partition by m.keeper, o.sequence_step order by o.created_at, o.id) rn
  from listing_outreach o join merge_map m on m.dupe = o.listing_id where o.status = 'queued')
update listing_outreach o set status = 'skipped', notes = coalesce(o.notes || ' ', '') || 'Merged duplicate listing 2026-10-10; the listing that stays has its own outreach.', updated_at = now()
from ranked r where o.id = r.id and (r.keeper_has or r.rn > 1);

update listing_outreach o set listing_id = m.keeper, updated_at = now()
from merge_map m
where o.listing_id = m.dupe and o.status = 'queued'
  and not exists (select 1 from listing_outreach o2 where o2.listing_id = m.keeper and o2.sequence_step = o.sequence_step);

update listings d set status = 'rejected',
  details = coalesce(d.details, '{}'::jsonb) || jsonb_build_object('merged_into', m.keeper, 'merged_at', '2026-10-10', 'status_before_merge', d.status),
  updated_at = now()
from merge_map m where d.id = m.dupe;

-- To undo one: update listings set status = details->>'status_before_merge', details = details - 'merged_into' - 'merged_at' - 'status_before_merge' where id = '<id>';
