-- ve-outreach-buckets: Do not contact, and the People door (Sean, 2026-11-05).
-- Sean: "if I find a listing that I may have had a falling out with the person or their persona non grata, I would like to select them and
-- add them to a do not contact list... more of an internal list for us... it moves them to that and out of the circulation for everything."
-- Do not contact is keyed by the listing (and its email). It puts the email on people_suppression, which email_is_suppressed() reads, so no
-- brand's email-send reaches them; campaigns refuse and skip them; the Roster shows the status Do not contact. Releasing undoes all of it.
-- Never deleted: a released row stays with who and when.

create table if not exists ve_do_not_contact (
  listing_id uuid primary key references listings(id) on delete cascade,
  email text,
  note text,
  added_by text,
  added_at timestamptz not null default now(),
  released_at timestamptz,
  released_by text
);
alter table ve_do_not_contact enable row level security;
create index if not exists ve_do_not_contact_email on ve_do_not_contact (email) where released_at is null;

create or replace function public.ve_do_not_contact_set(p_listing_ids uuid[], p_on boolean, p_note text default null, p_by text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare r record; n int := 0; em text;
begin
  for r in select l.id, lower(btrim(coalesce(nullif(c.email,''), nullif(l.email,'')))) email, c.id contact_id
    from listings l left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.id = any(p_listing_ids)
  loop
    em := nullif(r.email, '');
    if p_on then
      insert into ve_do_not_contact (listing_id, email, note, added_by)
      values (r.id, em, nullif(btrim(p_note), ''), p_by)
      on conflict (listing_id) do update set email = excluded.email, note = excluded.note, added_by = excluded.added_by,
        added_at = now(), released_at = null, released_by = null;
      if em is not null then
        insert into people_suppression (email, reason, active, created_by)
        values (em, 'do_not_contact', true, coalesce(p_by, 'outreach'))
        on conflict (email) do update set active = true, reason = 'do_not_contact', released_at = null
          where not people_suppression.active;  -- an address already held for another reason keeps that reason
      end if;
      update ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'do_not_contact'
        where listing_id = r.id and removed_at is null;
      if r.contact_id is not null then
        update ve_outreach_contacts set status = 'held', stop_reason = 'do_not_contact', updated_at = now()
          where id = r.contact_id and status not in ('opted_out','bounced','joined');
      end if;
    else
      update ve_do_not_contact set released_at = now(), released_by = p_by where listing_id = r.id and released_at is null;
      if em is not null and not exists (select 1 from ve_do_not_contact d where d.email = em and d.released_at is null) then
        update people_suppression set active = false, released_at = now() where email = em and reason = 'do_not_contact';
      end if;
      if r.contact_id is not null then
        update ve_outreach_contacts set status = 'not_sent', stop_reason = null, updated_at = now()
          where id = r.contact_id and status = 'held' and stop_reason = 'do_not_contact';
      end if;
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'changed', n);
end $function$;
revoke all on function ve_do_not_contact_set(uuid[], boolean, text, text) from public, anon, authenticated;

-- The People door: People-section listings (a person, not a business), carved out of Business.
create or replace function public.ve_outreach_door_of(p_category text, p_segment text)
 returns text language sql immutable as $function$
  select case
    when p_segment = 'brand' then 'brand'
    when p_category in ('Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep') then 'restaurant'
    when p_category in ('Food Brands','Nutrition & Supplements','Brands') then 'brand'
    when p_category in ('Nonprofits','Rescues','Sanctuaries') then 'nonprofit'
    when p_category in ('Groups','Events') then 'group'
    when p_category in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters') then 'people'
    else 'business' end
$function$;
insert into ve_outreach_doors (door, label, guide_slug, ready, sort, note)
values ('people', 'People', null, false, 55, 'People-section listings: activists, creators, athletes, physicians, health experts, chefs, founders, promoters')
on conflict (door) do nothing;
update ve_outreach_contacts c set door = 'people'
  from listings l where l.id = c.listing_id
  and l.category in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters')
  and c.door is distinct from 'people';

-- The Roster shows Do not contact first.
create or replace function public.ve_outreach_roster(p_status text[] default null, p_vegan_only boolean default false, p_chapter text default null,
  p_category text[] default null, p_campaign text default null, p_q text default null, p_has_email boolean default null,
  p_limit integer default 100, p_offset integer default 0, p_group text default 'open')
returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with supp as (
    select lower(email) e from email_suppressions where active
  ), opened as (
    select distinct (regexp_match(campaign_ref, '^ve-outreach-([0-9a-f-]{36})-'))[1]::uuid contact_id
    from email_sends
    where campaign_ref ~ '^ve-outreach-[0-9a-f-]{36}-(c[0-9a-f]+-)?[0-9]+$' and opened_at is not null
  ), base as (
    select l.id listing_id, l.name, l.slug, l.category, l.vegan_status, l.address_city city, l.address_state state, l.business_status,
           ve_chapter_of(l.address_city, l.address_state) chapter,
           coalesce(nullif(c.email,''), nullif(l.email,'')) email,
           c.id contact_id, c.status contact_status, c.email_source, c.door, c.last_sent_at,
           case
             when exists (select 1 from ve_do_not_contact d where d.released_at is null
                          and (d.listing_id = l.id or (d.email is not null and d.email = lower(coalesce(nullif(c.email,''), nullif(l.email,'')))))) then 'do_not_contact'
             when exists (select 1 from supp s where s.e = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))
                  or c.status in ('opted_out','bounced') then 'unsubscribed'
             when l.owner_member_id is not null or c.status = 'joined' or c.joined_at is not null then 'member'
             when c.status = 'interested' or c.interested_at is not null
                  or coalesce(l.claim_status,'unclaimed') not in ('unclaimed','verified','rejected') then 'hot'
             when exists (select 1 from opened o where o.contact_id = c.id) then 'warm'
             else 'cold'
           end as status,
           coalesce((select array_agg(m.campaign_slug order by m.added_at) from ve_outreach_campaign_members m
                     where m.listing_id = l.id and m.removed_at is null), '{}') campaigns
    from listings l
    left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.status = 'approved'
      and case when coalesce(p_group, 'open') = 'closed' then ve_listing_is_closed(l.business_status) else not ve_listing_is_closed(l.business_status) end
  ), f as (
    select b.*, count(*) filter (where b.email is not null) over (partition by lower(b.email)) same_email
    from base b
    where (not coalesce(p_vegan_only,false) or b.vegan_status in ('fully_vegan','vegan'))
      and (p_chapter is null or b.chapter = p_chapter)
      and (p_category is null or b.category = any(p_category))
      and (p_campaign is null or p_campaign = any(b.campaigns))
      and (p_has_email is null or (b.email is not null) = p_has_email)
      and (p_q is null or p_q = '' or b.name ilike '%'||p_q||'%' or b.email ilike '%'||p_q||'%' or b.city ilike '%'||p_q||'%')
  ), shown as (
    select * from f where p_status is null or status = any(p_status)
  )
  select jsonb_build_object(
    'total', (select count(*) from shown),
    'counts', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from f group by 1) x), '{}'::jsonb),
    'rows', coalesce((select jsonb_agg(to_jsonb(r)) from (
        select * from shown order by (email is null), name, listing_id
        limit greatest(1, least(coalesce(p_limit,100), 500)) offset greatest(0, coalesce(p_offset,0))) r), '[]'::jsonb)
  );
$function$;
revoke all on function ve_outreach_roster(text[], boolean, text, text[], text, text, boolean, integer, integer, text) from public, anon, authenticated;

-- Campaigns never send to them.
create or replace function ve_outreach_campaign_due(p_limit int default 100)
returns table(member_id uuid, campaign_slug text, listing_id uuid, email text, next_step int)
language sql stable security definer set search_path = public as $$
  select m.id, m.campaign_slug, m.listing_id, coalesce(nullif(c.email, ''), nullif(l.email, '')), m.step + 1
  from ve_outreach_campaign_members m
  join ve_outreach_campaigns cp on cp.slug = m.campaign_slug
  join listings l on l.id = m.listing_id and l.status = 'approved'
  left join ve_outreach_contacts c on c.listing_id = m.listing_id
  where m.removed_at is null
    and cp.approved_at is not null and cp.paused_at is null and cp.status = 'active'
    and cp.start_on is not null and cp.start_on <= (now() at time zone 'America/New_York')::date
    and m.step < cp.email_count
    and (m.send_status = 'waiting' and m.step = 0 or m.send_status = 'in_sequence' and m.next_send_at <= now())
    and coalesce(nullif(c.email, ''), nullif(l.email, '')) is not null
    and not email_is_suppressed(coalesce(nullif(c.email, ''), nullif(l.email, '')), 'lesaruss')
    and not exists (select 1 from ve_do_not_contact d where d.released_at is null
                    and (d.listing_id = m.listing_id or d.email = lower(coalesce(nullif(c.email, ''), nullif(l.email, '')))))
    and coalesce(c.status, '') not in ('opted_out', 'bounced', 'joined', 'interested', 'not_interested')
    and exists (select 1 from ve_outreach_campaign_emails e where e.campaign_slug = m.campaign_slug and e.step = m.step + 1 and e.locked_at is not null)
    and (cardinality(cp.cities) = 0 or ve_chapter_of(l.address_city, l.address_state) = any(cp.cities))
    and case cp.audience
          when 'closed' then ve_listing_is_closed(l.business_status)
          else not ve_listing_is_closed(l.business_status) and l.owner_member_id is null
               and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = l.id and f.closure_level = 'closed')
        end
  order by (m.step > 0) desc, cp.start_on, m.added_at
  limit p_limit
$$;
revoke all on function ve_outreach_campaign_due(int) from public, anon, authenticated;

-- And refuse to add them.
create or replace function public.ve_outreach_campaign_add(p_campaign text, p_listing_ids uuid[], p_by uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare added int := 0; dup int := 0; blocked int := 0; wrong int := 0; dnc int := 0; r record; aud text;
begin
  select audience into aud from ve_outreach_campaigns where slug = p_campaign;
  if aud is null then return jsonb_build_object('error','unknown_campaign'); end if;
  for r in select l.id, l.business_status,
      exists (select 1 from email_suppressions s where s.active and lower(s.email) = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))
        or coalesce(c.status,'') in ('opted_out','bounced') as unsub,
      exists (select 1 from ve_do_not_contact d where d.released_at is null
        and (d.listing_id = l.id or d.email = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))) as dnc
    from listings l left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.id = any(p_listing_ids) and l.status = 'approved'
  loop
    if r.dnc then dnc := dnc + 1; continue; end if;
    if r.unsub then blocked := blocked + 1; continue; end if;
    if (aud = 'closed') <> ve_listing_is_closed(r.business_status) then wrong := wrong + 1; continue; end if;
    begin
      insert into ve_outreach_campaign_members (campaign_slug, listing_id, added_by) values (p_campaign, r.id, p_by);
      added := added + 1;
    exception when unique_violation then dup := dup + 1;
    end;
  end loop;
  return jsonb_build_object('added', added, 'already_in', dup, 'refused_unsubscribed', blocked, 'refused_wrong_group', wrong, 'refused_do_not_contact', dnc);
end $function$;

