-- ve-outreach-buckets: sending governed per campaign, the No longer open group, and the Checking in campaign (Sean, 2026-11-05: "go,
-- use the Checking in email as drafted"). Canon canon-ve-outreach-roster-campaigns v3.
--
-- A campaign sends on its own: approved (approved_at), its start day reached (start_on, Eastern), not paused (paused_at), at most
-- daily_pace emails a day. Cities are an optional filter (cities, chapter slugs), never a gate. The rules that hold for every send stay
-- in the engine (ve-outreach tick): weekdays 9 to 5 Eastern, the domain's warm-up allowance, the do-not-email list, and one outreach
-- email per address per day. The old city lists and send days no longer send to businesses: ve_outreach_due now serves people lists only.
--
-- audience: 'door' (open listings on that door) or 'closed' (the No longer open group: Permanently or Temporarily closed listings,
-- never Removed ones). email_count: 1 to 3 emails; each email has its own day_offset from the person's first email.

-- 1. Campaigns: audience, how many emails, pace, pause.
alter table ve_outreach_campaigns
  add column if not exists audience text not null default 'door',
  add column if not exists email_count int not null default 3,
  add column if not exists daily_pace int not null default 30,
  add column if not exists paused_at timestamptz,
  add column if not exists paused_by uuid;
do $$ begin
  alter table ve_outreach_campaigns add constraint ve_outreach_campaigns_audience_check check (audience in ('door', 'closed'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ve_outreach_campaigns add constraint ve_outreach_campaigns_email_count_check check (email_count between 1 and 3);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table ve_outreach_campaigns add constraint ve_outreach_campaigns_daily_pace_check check (daily_pace between 1 and 200);
exception when duplicate_object then null; end $$;

-- 2. Each email's day, counted from the person's first email (0, 4, 10 as the door templates).
alter table ve_outreach_campaign_emails add column if not exists day_offset int;
update ve_outreach_campaign_emails set day_offset = case step when 1 then 0 when 2 then 4 else 10 end where day_offset is null;
alter table ve_outreach_campaign_emails alter column day_offset set default 0;

-- 3. Where each person stands in each campaign (one person can be in several campaigns).
alter table ve_outreach_campaign_members
  add column if not exists step int not null default 0,
  add column if not exists send_status text not null default 'waiting',
  add column if not exists next_send_at timestamptz,
  add column if not exists last_sent_at timestamptz,
  add column if not exists stop_reason text;
do $$ begin
  alter table ve_outreach_campaign_members add constraint ve_outreach_campaign_members_send_status_check
    check (send_status in ('waiting', 'in_sequence', 'finished', 'stopped'));
exception when duplicate_object then null; end $$;

-- 4. The listing's group: closed listings leave the door tabs into No longer open (Removed listings are status rejected and never shown).
create or replace function ve_listing_is_closed(p_status text) returns boolean language sql immutable as $$
  select coalesce(p_status, '') in ('CLOSED_PERMANENTLY', 'CLOSED_TEMPORARILY')
$$;

-- 5. One person's email for one campaign step, filled in. Mirrors ve_outreach_render_base, with the campaign's own words.
create or replace function ve_outreach_campaign_render(p_member uuid, p_step int)
returns table(subject text, body text, to_email text, page_url text, guide_url text, listing_name text, contact_id uuid)
language plpgsql stable security definer set search_path = public as $$
declare m record; cp record; e record; l record; c record; g record; first text; city text; page text; gurl text; gline text := ''; fc text;
begin
  select * into m from ve_outreach_campaign_members where id = p_member;
  if not found or m.listing_id is null then return; end if;
  select * into cp from ve_outreach_campaigns where slug = m.campaign_slug;
  select * into e from ve_outreach_campaign_emails where campaign_slug = m.campaign_slug and step = p_step;
  if e is null then return; end if;
  select * into l from listings where id = m.listing_id;
  select * into c from ve_outreach_contacts where listing_id = m.listing_id;
  first := nullif(split_part(trim(coalesce(c.contact_name, '')), ' ', 1), '');
  city := coalesce((select oc.name from ve_outreach_cities oc where oc.community_slug = ve_chapter_of(l.address_city, l.address_state) and oc.kind = 'city'), '');
  if c.segment = 'brand' then city := ''; end if;
  page := 'https://vegansexplore.com/directory/' || l.slug;
  select * into g from ve_outreach_guides(m.listing_id) limit 1;
  if g.guide_slug is not null then
    gurl := 'https://vegansexplore.com/guides/' || replace(g.guide_slug, '-site', '') || '#/listing/' || l.slug;
    gline := E'\n\n' || l.name || ' is also in ' || g.title || case when g.as_store
      then ', as a store where our members find the products it recommends.' else ', where our members choose what to buy.' end
      || ' See how you''re featured: ' || gurl;
  end if;
  -- No first name: "Checking in, {first_name}" reads "Checking in"; in the body it reads "there".
  subject := e.subject;
  if first is null then subject := regexp_replace(subject, ',?\s*\{first_name\}', '', 'g'); end if;
  subject := replace(replace(replace(replace(subject, '{first_name}', coalesce(first, '')), '{business}', l.name),
    '{in_city}', case when city = '' then '' else ' in ' || city end), '{city}', city);
  body := replace(replace(replace(replace(replace(replace(replace(e.body,
    '{in_city}', case when city = '' then '' else ' in ' || city end),
    '{first_name}', coalesce(first, 'there')),
    '{business}', l.name),
    '{city}', city),
    '{link}', page),
    '{guide}', case when c.segment = 'brand' and g.guide_slug like 'vegan-dairy-guide%' then 'Maya' else 'Liz' end),
    '{guide_line}', gline);
  if position('{free_check}' in body) > 0 then
    fc := coalesce(ve_outreach_free_check(m.listing_id), '');
    body := replace(body, '{free_check}', fc);
  end if;
  body := btrim(regexp_replace(body, E'\\n{3,}', E'\n\n', 'g'), E'\n ');
  to_email := coalesce(nullif(c.email, ''), nullif(l.email, ''));
  page_url := page; guide_url := gurl; listing_name := l.name; contact_id := c.id;
  return next;
end $$;
revoke all on function ve_outreach_campaign_render(uuid, int) from public, anon, authenticated;

-- 6. What each approved campaign may send now. The engine adds the pace, the warm-up and the one-a-day guard.
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

-- 7. The old path no longer sends to businesses: city lists and send days are replaced by campaigns. People lists keep working.
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
    and not email_is_suppressed(c.email, oc.sender_brand)
    and exists (select 1 from ve_outreach_templates t where t.program = oc.program and t.step = c.step + 1 and t.status = 'ready')
    and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = c.listing_id and f.closure_level = 'closed')
  order by b.send_on, (c.segment = 'brand') desc, c.created_at
  limit p_limit
$function$;

-- 8. The Roster by group: 'open' (the door tabs) or 'closed' (No longer open). Opens also count the campaign refs
--    (ve-outreach-<contact>-c<member>-<step>) the campaign sender writes.
drop function if exists ve_outreach_roster(text[], boolean, text, text[], text, text, boolean, integer, integer);
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

-- 9. Adding someone checks the campaign's group: a closed listing only goes into a No longer open campaign, an open one only into a door campaign.
create or replace function public.ve_outreach_campaign_add(p_campaign text, p_listing_ids uuid[], p_by uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare added int := 0; dup int := 0; blocked int := 0; wrong int := 0; r record; aud text;
begin
  select audience into aud from ve_outreach_campaigns where slug = p_campaign;
  if aud is null then return jsonb_build_object('error','unknown_campaign'); end if;
  for r in select l.id, l.business_status,
      exists (select 1 from email_suppressions s where s.active and lower(s.email) = lower(coalesce(nullif(c.email,''), nullif(l.email,''))))
        or coalesce(c.status,'') in ('opted_out','bounced') as unsub
    from listings l left join lateral (select * from ve_outreach_contacts x where x.listing_id = l.id order by x.created_at limit 1) c on true
    where l.id = any(p_listing_ids) and l.status = 'approved'
  loop
    if r.unsub then blocked := blocked + 1; continue; end if;
    if (aud = 'closed') <> ve_listing_is_closed(r.business_status) then wrong := wrong + 1; continue; end if;
    begin
      insert into ve_outreach_campaign_members (campaign_slug, listing_id, added_by) values (p_campaign, r.id, p_by);
      added := added + 1;
    exception when unique_violation then dup := dup + 1;
    end;
  end loop;
  return jsonb_build_object('added', added, 'already_in', dup, 'refused_unsubscribed', blocked, 'refused_wrong_group', wrong);
end $function$;

-- 10. The tag a new venture gets on the person.
insert into ve_tags (slug, name, kind, description, active)
values ('new-venture', 'New venture', 'stakeholder', 'Their listing closed and they started something new (from the No longer open group).', true)
on conflict (slug) do nothing;

-- 11. The Checking in campaign: one email from Sean to the No longer open group with an email. A draft until Sean locks and approves it.
insert into ve_outreach_campaigns (slug, name, door, audience, email_count, daily_pace, status, start_on, note)
values ('closed-checking-in', 'Checking in', null, 'closed', 1, 30, 'draft', date '2026-11-09',
        'One email from Sean to listings that closed (Sean, 2026-11-05: "use the Checking in email as drafted"). Nothing sends until approved.')
on conflict (slug) do nothing;
insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
values ('closed-checking-in', 1, 'Checking in, {first_name}',
E'Hi {first_name},\n\nIt''s been a while since {business} closed its doors, and I wanted to check in. No ask here, I''m just curious how you''re doing.\n\nIf you''ve started something new, maybe in another city or another state, I''d love to hear about it. We''re always looking for people and stories to feature, and that includes whatever comes next for you.\n\nVegans Explore is in cities across the country and in London now. If you travel, it''s an easy way to find Vegan options wherever you land.\n\nIf nothing''s changed, I''d still love to hear how you are. Just reply to this email.\n\nSean', 0)
on conflict (campaign_slug, step) do nothing;
select ve_outreach_campaign_add('closed-checking-in',
  array(select l.id from listings l join ve_outreach_contacts c on c.listing_id = l.id
        where l.status = 'approved' and ve_listing_is_closed(l.business_status) and coalesce(nullif(c.email, ''), nullif(l.email, '')) is not null),
  null);
