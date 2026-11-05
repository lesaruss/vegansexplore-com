-- vegans-explore-initiative-business-certification: A1, separate the Pre-Vegan places from restaurant outreach (Logan, 2026-11-05).
--
-- The restaurant door carries the 100% Vegan Restaurant Guide emails. Vegan-friendly and Vegan-options food places sat on it
-- (63 not sent, 11 held), 21 of them on South Florida's proposed send days of Nov 10 and 11. They belong to the Pre-Vegan
-- Certification, whose door is not ready. The sender and planner did not read `door`, so this:
--   1. adds the door `pre_vegan` (not ready);
--   2. moves food places that are not 100% Vegan off the restaurant door (two left on it, below);
--   3. takes every contact on a door that is not ready off send days still `proposed` (approved or sent days untouched);
--   4. makes ve_outreach_plan and ve_outreach_due skip any contact whose door is not ready (no door, a people list, passes);
--   5. sets the door from vegan_status on insert for food places (100% Vegan -> restaurant, anything else -> pre_vegan);
--   6. marks Turning Point's second contact (same inbox, another location) as merged into the first.
-- Each moved or merged contact gets a ve_outreach_events `note` row saying what changed and why. Nothing is deleted or sent.
--
-- Left on the restaurant door, How Vegan waiting for Sean: Soul Vegetarian No. 2 (its site says "100% VEGAN") and Ci Su Vegetarian
-- Bistro (its site, Cisu Vegan House, says "All Vegan"); both are vegan_options in the Directory. If Sean confirms, set them
-- fully_vegan; if not, move them with the rest.
--
-- ve_outreach_due keeps the live guard `oc.kind = 'people'` exactly as found (it is in no earlier migration file): city lists do
-- not send through it today.

insert into public.ve_outreach_doors (door, label, guide_slug, ready, sort, note)
values ('pre_vegan', 'Pre-Vegan', null, false, 15,
        'Food places that are Vegan friendly or have Vegan options: the Pre-Vegan Certification door, not ready')
on conflict (door) do update set label = excluded.label, ready = false, sort = excluded.sort, note = excluded.note;

-- The food categories in one place, so the insert rule and the move agree.
create or replace function public.ve_outreach_door_of(p_category text, p_segment text, p_vegan_status text)
returns text language sql immutable as $$
  select case
    when p_segment = 'brand' then 'brand'
    when p_category in ('Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep')
      then case when p_vegan_status = 'fully_vegan' then 'restaurant' else 'pre_vegan' end
    else ve_outreach_door_of(p_category, p_segment) end
$$;

create or replace function public.trg_ve_outreach_contact_door()
returns trigger language plpgsql as $function$
begin
  if new.door is null and new.listing_id is not null then
    new.door := (select ve_outreach_door_of(l.category, new.segment, l.vegan_status) from listings l where l.id = new.listing_id);
  end if;
  return new;
end $function$;

-- 2. The move.
with moved as (
  update public.ve_outreach_contacts c set door = 'pre_vegan'
  from public.listings l
  where l.id = c.listing_id and c.door = 'restaurant'
    and coalesce(l.vegan_status, '') <> 'fully_vegan'
    and c.status in ('not_sent', 'held', 'cool_off')
    and l.slug not in ('soul-vegetarian-no-2', 'ci-su-vegetarian-bistro')
  returning c.id, l.vegan_status
)
insert into public.ve_outreach_events (contact_id, kind, detail)
select id, 'note', jsonb_build_object('change', 'door', 'from', 'restaurant', 'to', 'pre_vegan', 'vegan_status', vegan_status,
  'why', 'Not 100% Vegan: belongs to the Pre-Vegan Certification, not the 100% Vegan Restaurant Guide emails',
  'by', 'logan', 'migration', '20261105_pre_vegan_door')
from moved;

-- 6. Turning Point: Boynton Beach shares the Wellington location's inbox. Its contact stays (one contact per listing) as held,
-- marked merged, so the business is reached once.
with m as (
  update public.ve_outreach_contacts set status = 'held',
    stop_reason = 'merged into the Turning Point (Wellington) contact 9a16cd00: same inbox, another location'
  where id = 'fc3b980f-84d6-4873-8581-2cbfdb270053'
    and exists (select 1 from public.ve_outreach_contacts where id = '9a16cd00-3c88-4335-85d7-4bd638951530')
  returning id
)
insert into public.ve_outreach_events (contact_id, kind, detail)
select id, 'note', jsonb_build_object('change', 'merged', 'into', '9a16cd00-3c88-4335-85d7-4bd638951530',
  'why', 'same inbox info@tpbbl.com, another location', 'by', 'logan', 'migration', '20261105_pre_vegan_door')
from m;

-- 3. Off the proposed send days.
with off as (
  update public.ve_outreach_contacts c set batch_id = null
  from public.ve_outreach_batches b, public.ve_outreach_doors d
  where b.id = c.batch_id and b.status = 'proposed' and c.status = 'not_sent'
    and d.door = c.door and not d.ready
  returning c.id, b.send_on, c.door
)
insert into public.ve_outreach_events (contact_id, kind, detail)
select id, 'note', jsonb_build_object('change', 'off_send_day', 'send_on', send_on, 'door', door,
  'why', 'its door is not ready', 'by', 'logan', 'migration', '20261105_pre_vegan_door')
from off;

-- 4. The planner and the sender read the door.
create or replace function public.ve_outreach_plan(p_city text, p_start date, p_sizes integer[])
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare d date := p_start; i integer; b uuid; n integer := 0; k integer;
begin
  for i in 1 .. coalesce(array_length(p_sizes, 1), 0) loop
    while extract(isodow from d) > 5 loop d := d + 1; end loop;
    insert into ve_outreach_batches (community_slug, send_on) values (p_city, d) returning id into b;
    update ve_outreach_contacts set batch_id = b where id in (
      select c.id from ve_outreach_contacts c left join listings l on l.id = c.listing_id
      where c.community_slug = p_city and c.status = 'not_sent' and c.batch_id is null
        and (c.listing_id is null or (l.id is not null and l.business_status is distinct from 'CLOSED_PERMANENTLY'))
        and (c.door is null or exists (select 1 from ve_outreach_doors dr where dr.door = c.door and dr.ready))
      order by (c.segment = 'brand') desc, coalesce(l.name, c.contact_name, c.email) limit greatest(p_sizes[i], 0));
    get diagnostics k = row_count;
    if k = 0 then delete from ve_outreach_batches where id = b; exit; end if;
    n := n + k; d := d + 1;
  end loop;
  return n;
end $function$;

create or replace function public.ve_outreach_due(p_limit integer default 100)
returns table(contact_id uuid, community_slug text, listing_id uuid, email text, next_step integer)
language sql stable security definer set search_path to 'public' as $function$
  select c.id, c.community_slug, c.listing_id, c.email, c.step + 1
  from ve_outreach_contacts c
  join ve_outreach_batches b on b.id = c.batch_id and b.status in ('approved', 'sent')
  join ve_outreach_cities oc on oc.community_slug = c.community_slug and oc.enabled and oc.kind = 'people'
  where c.step < 3
    and ((c.status = 'not_sent' and c.step = 0 and b.send_on <= (now() at time zone 'America/New_York')::date)
      or (c.status = 'in_sequence' and c.next_send_at <= now()))
    and (c.door is null or exists (select 1 from ve_outreach_doors dr where dr.door = c.door and dr.ready))
    and not email_is_suppressed(c.email, oc.sender_brand)
    and exists (select 1 from ve_outreach_templates t where t.program = oc.program and t.step = c.step + 1 and t.status = 'ready')
    and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = c.listing_id and f.closure_level = 'closed')
  order by b.send_on, (c.segment = 'brand') desc, c.created_at
  limit p_limit
$function$;

revoke all on function public.ve_outreach_plan(text, date, integer[]) from public, anon, authenticated;
revoke all on function public.ve_outreach_due(integer) from public, anon, authenticated;
grant execute on function public.ve_outreach_plan(text, date, integer[]), public.ve_outreach_due(integer) to service_role;
