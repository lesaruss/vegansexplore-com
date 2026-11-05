-- ve-outreach-buckets: Roster statuses are Cold, Warm, Hot, Member, Unsubscribed (Sean, 2026-11-05:
-- "Cold, we haven't heard from them. Warm, they've opened, but they haven't clicked. And hot, they've clicked and replied.
-- Member, and then unsubscribe."). Replaces Unverified / Hot lead.
--   unsubscribed  suppressed, opted out or bounced (never selectable)
--   member        owns the listing, claimed, or joined
--   hot           clicked their link or replied (interested), or started a claim
--   warm          opened one of our outreach emails, no click or reply
--   cold          nothing heard yet
-- An open comes from email_sends.opened_at on a real outreach email (campaign_ref ve-outreach-<contact>-<step>; tests left out).
-- Opens are a floor and can be false: Apple Mail and some scanners open emails on their own.
create or replace function public.ve_outreach_roster(p_status text[] default null, p_vegan_only boolean default false, p_chapter text default null, p_category text[] default null, p_campaign text default null, p_q text default null, p_has_email boolean default null, p_limit integer default 100, p_offset integer default 0)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with supp as (
    select lower(email) e from email_suppressions where active
  ), opened as (
    select distinct (regexp_match(campaign_ref, '^ve-outreach-([0-9a-f-]{36})-[0-9]+$'))[1]::uuid contact_id
    from email_sends
    where campaign_ref ~ '^ve-outreach-[0-9a-f-]{36}-[0-9]+$' and opened_at is not null
  ), base as (
    select l.id listing_id, l.name, l.slug, l.category, l.vegan_status, l.address_city city, l.address_state state,
           ve_chapter_of(l.address_city, l.address_state) chapter,
           coalesce(nullif(c.email,''), nullif(l.email,'')) email,
           c.id contact_id, c.status contact_status, c.email_source, c.door, c.last_sent_at,
           case
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
