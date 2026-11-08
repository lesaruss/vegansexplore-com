-- ve-outreach-buckets: BrandDesk campaigns send to people, not only businesses (Sean, 2026-11-08: "it was always our intention to send
-- to people who aren't business owners... built into the outreach, and so we can track it the way we track everything else").
-- A campaign with audience 'people' holds members keyed by email (person_key, lower case) with no listing. They go through the same
-- sender (campaignTick in ve-outreach), the same rules (approval, start day, daily pace, weekdays 9 to 5 Eastern, warm-up, one outreach
-- email per address per day, suppressions, the do-not-contact list), the same per-member tracked /go/ link and the same email_sends rows.
-- Each person gets an outreach contact (segment 'person') on the people list below, which is never switched on, so the old people-list
-- sender (ve_outreach_due, which needs an approved batch) never touches them.

alter table ve_outreach_campaigns drop constraint if exists ve_outreach_campaigns_audience_check;
alter table ve_outreach_campaigns add constraint ve_outreach_campaigns_audience_check check (audience in ('door', 'closed', 'people'));
alter table ve_outreach_campaigns add column if not exists footer_reason text;

alter table ve_outreach_campaign_members
  add column if not exists person_name text,
  add column if not exists person_id uuid;

insert into ve_outreach_cities (community_slug, name, kind, program, enabled, brand, sender_brand, notes)
values ('people-campaigns', 'People in BrandDesk campaigns', 'people', 'people-campaigns', false, 'vegans-explore', 'lesaruss',
        'Holds the outreach contact for each person in a BrandDesk people campaign. Never switched on: campaigns send them.')
on conflict (community_slug) do nothing;

-- Who is due, businesses (unchanged) and people.
create or replace function public.ve_outreach_campaign_due(p_limit integer default 100)
returns table(member_id uuid, campaign_slug text, listing_id uuid, email text, next_step integer)
language sql stable security definer set search_path to 'public'
as $function$
  (select m.id, m.campaign_slug, m.listing_id, coalesce(nullif(c.email, ''), nullif(l.email, '')), m.step + 1
  from ve_outreach_campaign_members m
  join ve_outreach_campaigns cp on cp.slug = m.campaign_slug
  join listings l on l.id = m.listing_id and l.status = 'approved'
  left join ve_outreach_contacts c on c.listing_id = m.listing_id
  where m.removed_at is null
    and cp.audience <> 'people'
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
  union all
  select m.id, m.campaign_slug, null::uuid, m.person_key, m.step + 1
  from ve_outreach_campaign_members m
  join ve_outreach_campaigns cp on cp.slug = m.campaign_slug and cp.audience = 'people'
  left join ve_outreach_contacts c on c.listing_id is null and c.community_slug = 'people-campaigns' and lower(c.email) = m.person_key
  where m.removed_at is null and m.listing_id is null and m.person_key like '%@%'
    and cp.approved_at is not null and cp.paused_at is null and cp.status = 'active'
    and cp.start_on is not null and cp.start_on <= (now() at time zone 'America/New_York')::date
    and m.step < cp.email_count
    and (m.send_status = 'waiting' and m.step = 0 or m.send_status = 'in_sequence' and m.next_send_at <= now())
    and not email_is_suppressed(m.person_key, coalesce(cp.sender_brand, 'lesaruss'))
    and not email_is_suppressed(m.person_key, 'lesaruss')
    and not exists (select 1 from ve_do_not_contact d where d.released_at is null and d.email = m.person_key)
    and coalesce(c.status, '') not in ('opted_out', 'bounced', 'not_interested')
    and exists (select 1 from ve_outreach_campaign_emails e where e.campaign_slug = m.campaign_slug and e.step = m.step + 1 and e.locked_at is not null))
  order by 5 desc, 2, 1
  limit p_limit
$function$;

-- One campaign email for one member: a person's branch fills {first_name}, the link (the campaign's link_path) and no business.
create or replace function public.ve_outreach_campaign_render(p_member uuid, p_step integer)
returns table(subject text, body text, to_email text, page_url text, guide_url text, listing_name text, contact_id uuid)
language plpgsql stable security definer set search_path to 'public'
as $function$
declare m record; cp record; e record; l record; c record; g record; first text; city text; page text; gurl text; gline text := ''; fc text;
begin
  select * into m from ve_outreach_campaign_members where id = p_member;
  if not found then return; end if;
  select * into cp from ve_outreach_campaigns where slug = m.campaign_slug;
  select * into e from ve_outreach_campaign_emails where campaign_slug = m.campaign_slug and step = p_step;
  if e is null then return; end if;
  if m.listing_id is null then
    if m.person_key is null or position('@' in m.person_key) = 0 then return; end if;
    select * into c from ve_outreach_contacts where listing_id is null and community_slug = 'people-campaigns' and lower(email) = m.person_key;
    first := nullif(split_part(trim(coalesce(m.person_name, c.contact_name, '')), ' ', 1), '');
    page := 'https://vegansexplore.com' || coalesce(cp.link_path, '/passport');
    subject := e.subject;
    if first is null then subject := regexp_replace(subject, ',?\s*\{first_name\}', '', 'g'); end if;
    subject := replace(replace(replace(replace(subject, '{first_name}', coalesce(first, '')), '{business}', ''), '{in_city}', ''), '{city}', '');
    body := replace(replace(replace(replace(replace(replace(replace(e.body,
      '{in_city}', ''), '{first_name}', coalesce(first, 'there')), '{business}', ''), '{city}', ''), '{link}', page),
      '{guide}', 'Liz'), '{guide_line}', '');
    body := btrim(regexp_replace(body, E'\\n{3,}', E'\n\n', 'g'), E'\n ');
    to_email := m.person_key; page_url := page; guide_url := null; listing_name := coalesce(m.person_name, m.person_key); contact_id := c.id;
    return next; return;
  end if;
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
end $function$;
