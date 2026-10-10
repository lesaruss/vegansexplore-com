-- 20261010_ve_outreach_lists.sql
-- One outreach engine for every brand: lists of people, not only cities of businesses (Sean, 2026-10-10: "This
-- should use the same engine we just created for Vegans Explore to do outreach. We can select people in our system
-- and add them to the distribution." First list: the 111 Day Theory founding cohort.)
--
-- Everything Vegans Explore already has keeps working exactly as it did: every new column defaults to the business
-- outreach values, and the functions only take a new path for a contact that has no listing. Checked before and after
-- applying: ve_outreach_render() over every contact and step renders the same text (same md5).
--
--   ve_outreach_cities     a row is now a list. kind 'city' (businesses in a city, as before) or 'people' (people we
--                          add from HQ > People). program picks its emails; link_url is where a people list's {link}
--                          goes; footer_reason finishes "You are getting this because ..."; brand is the HQ label.
--                          The same switch (enabled), daily cap, send days and approval apply to both.
--   ve_outreach_templates  emails per program: (program, step). Business outreach keeps program 'business-outreach'.
--   ve_outreach_contacts   a contact is a listing (as before) or a person (person_id, segment 'person', no listing).
--                          A person is on a list once (by email).

alter table public.ve_outreach_cities
  add column if not exists kind text not null default 'city',
  add column if not exists program text not null default 'business-outreach',
  add column if not exists link_url text,
  add column if not exists footer_reason text,
  add column if not exists brand text not null default 'vegans-explore';
do $$ begin
  alter table public.ve_outreach_cities add constraint ve_outreach_cities_kind_check check (kind in ('city', 'people'));
exception when duplicate_object then null; end $$;

alter table public.ve_outreach_templates add column if not exists program text not null default 'business-outreach';
alter table public.ve_outreach_templates drop constraint if exists ve_outreach_templates_pkey;
alter table public.ve_outreach_templates add constraint ve_outreach_templates_pkey primary key (program, step);

alter table public.ve_outreach_contacts alter column listing_id drop not null;
alter table public.ve_outreach_contacts add column if not exists person_id uuid;
alter table public.ve_outreach_contacts drop constraint if exists ve_outreach_contacts_segment_check;
alter table public.ve_outreach_contacts add constraint ve_outreach_contacts_segment_check check (segment in ('brand', 'business', 'person'));
do $$ begin
  alter table public.ve_outreach_contacts add constraint ve_outreach_contacts_target_check
    check (listing_id is not null or (segment = 'person' and email is not null));
exception when duplicate_object then null; end $$;
create unique index if not exists ve_outreach_contacts_person_once
  on public.ve_outreach_contacts (community_slug, lower(email)) where listing_id is null;
create index if not exists ve_outreach_contacts_person_idx on public.ve_outreach_contacts (person_id) where person_id is not null;

-- The emails for a contact: a listing's as before; a person's from their list's program, with {first_name} and {link}.
create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
 returns table(subject text, body text, to_email text, page_url text, guide_url text)
 language plpgsql stable security definer set search_path to 'public'
as $function$
declare c record; l record; t record; g record; oc record; first text; city text; page text; gurl text; gline text := '';
begin
  select * into c from ve_outreach_contacts where id = p_contact;
  if not found then return; end if;
  select * into oc from ve_outreach_cities where community_slug = c.community_slug;
  if c.listing_id is null then
    select * into t from ve_outreach_templates where program = oc.program and step = p_step;
    if t is null then return; end if;
    first := nullif(split_part(trim(coalesce(c.contact_name, '')), ' ', 1), '');
    page := oc.link_url;
    subject := replace(replace(t.subject, '{first_name}', coalesce(first, 'there')), '{link}', coalesce(page, ''));
    body := replace(replace(t.body, '{first_name}', coalesce(first, 'there')), '{link}', coalesce(page, ''));
    to_email := c.email; page_url := page; guide_url := null;
    return next;
    return;
  end if;
  select * into l from listings where id = c.listing_id;
  select * into t from ve_outreach_templates where program = oc.program and step = p_step;
  if t is null then return; end if;
  first := nullif(split_part(trim(coalesce(c.contact_name, '')), ' ', 1), '');
  city := case when c.community_slug = 'brands' then '' else oc.name end;
  page := 'https://vegansexplore.com/directory/' || l.slug;
  select * into g from ve_outreach_guides(c.listing_id) limit 1;
  if g.guide_slug is not null then
    gurl := 'https://vegansexplore.com/guides/' || replace(g.guide_slug, '-site', '') || '#/listing/' || l.slug;
    gline := E'\n\n' || l.name || ' is also in ' || g.title || case when g.as_store
      then ', as a store where our members find the products it recommends.' else ', where our members choose what to buy.' end
      || ' See how you''re featured: ' || gurl;
  end if;
  subject := replace(replace(replace(t.subject, '{business}', l.name), '{in_city}', case when city = '' then '' else ' in ' || city end), '{city}', city);
  body := replace(replace(replace(replace(replace(replace(replace(t.body,
    '{in_city}', case when city = '' then '' else ' in ' || city end),
    '{first_name}', coalesce(first, 'there')),
    '{business}', l.name),
    '{city}', city),
    '{link}', page),
    '{guide}', case when c.segment = 'brand' and g.guide_slug like 'vegan-dairy-guide%' then 'Maya' else 'Liz' end),
    '{guide_line}', gline);
  to_email := c.email; page_url := page; guide_url := gurl;
  return next;
end $function$;

-- What goes next: the next email must be ready in the contact's own list's program.
create or replace function public.ve_outreach_due(p_limit integer default 100)
 returns table(contact_id uuid, community_slug text, listing_id uuid, email text, next_step integer)
 language sql stable security definer set search_path to 'public'
as $function$
  select c.id, c.community_slug, c.listing_id, c.email, c.step + 1
  from ve_outreach_contacts c
  join ve_outreach_batches b on b.id = c.batch_id and b.status in ('approved', 'sent')
  join ve_outreach_cities oc on oc.community_slug = c.community_slug and oc.enabled
  where c.step < 3
    and ((c.status = 'not_sent' and c.step = 0 and b.send_on <= (now() at time zone 'America/New_York')::date)
      or (c.status = 'in_sequence' and c.next_send_at <= now()))
    and not exists (select 1 from email_suppressions x where x.active and lower(x.email) = lower(c.email))
    and exists (select 1 from ve_outreach_templates t where t.program = oc.program and t.step = c.step + 1 and t.status = 'ready')
    and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = c.listing_id and f.closure_level = 'closed')
  order by b.send_on, (c.segment = 'brand') desc, c.created_at
  limit p_limit
$function$;

-- Planning send days: people have no listing, so they are ordered by name (businesses exactly as before).
create or replace function public.ve_outreach_plan(p_city text, p_start date, p_sizes integer[])
 returns integer language plpgsql security definer set search_path to 'public'
as $function$
declare d date := p_start; i integer; b uuid; n integer := 0; k integer;
begin
  for i in 1 .. coalesce(array_length(p_sizes, 1), 0) loop
    while extract(isodow from d) > 5 loop d := d + 1; end loop;
    insert into ve_outreach_batches (community_slug, send_on) values (p_city, d) returning id into b;
    update ve_outreach_contacts set batch_id = b where id in (
      select c.id from ve_outreach_contacts c left join listings l on l.id = c.listing_id
      where c.community_slug = p_city and c.status = 'not_sent' and c.batch_id is null
        and (c.listing_id is null or (l.id is not null and l.business_status is distinct from 'CLOSED_PERMANENTLY'))
      order by (c.segment = 'brand') desc, coalesce(l.name, c.contact_name, c.email) limit greatest(p_sizes[i], 0));
    get diagnostics k = row_count;
    if k = 0 then delete from ve_outreach_batches where id = b; exit; end if;
    n := n + k; d := d + 1;
  end loop;
  return n;
end $function$;

-- Reading what people did. Businesses as before; a person on a people list is Joined when they become a paying
-- LESARUSS AI member or start a 111 Day Theory journey after their first email.
create or replace function public.ve_outreach_sync()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare n_click int := 0; n_reply int := 0; n_join int := 0; n_out int := 0; n_bounce int := 0; n_pjoin int := 0;
begin
  with j as (
    update ve_outreach_contacts c set status = 'joined', joined_at = now(), stop_reason = 'claimed their page'
    where c.status in ('in_sequence', 'finished', 'interested') and c.step > 0
      and (exists (select 1 from listings l where l.id = c.listing_id and (l.claimed_by_member_id is not null or l.owner_member_id is not null))
        or exists (select 1 from ve_listing_claims k where k.listing_id = c.listing_id and not coalesce(k.test, false)
          and k.created_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent')))
    returning c.id)
  select count(*) into n_join from j;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'claimed', '{}'::jsonb from ve_outreach_contacts where status = 'joined' and joined_at > now() - interval '1 minute'
      and listing_id is not null
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'claimed');

  with pj as (
    update ve_outreach_contacts c set status = 'joined', joined_at = now(), stop_reason = 'joined LESARUSS AI'
    where c.listing_id is null and c.status in ('in_sequence', 'finished', 'interested') and c.step > 0
      and exists (select 1 from members m where lower(m.email) = lower(c.email) and m.merged_into_member_id is null
        and ((m.entry_paid_at is not null and m.entry_paid_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
          or exists (select 1 from journey_enrollments je where je.member_id = m.id
            and je.created_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))))
    returning c.id)
  select count(*) into n_pjoin from pj;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'joined', '{}'::jsonb from ve_outreach_contacts where status = 'joined' and listing_id is null
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'joined');

  with o as (
    update ve_outreach_contacts c set status = 'opted_out', stop_reason = 'unsubscribed or blocked'
    where c.status in ('not_sent', 'in_sequence', 'finished')
      and exists (select 1 from email_suppressions x where x.active and lower(x.email) = lower(c.email) and x.scope in ('global', 'lesaruss'))
    returning c.id)
  select count(*) into n_out from o;

  with b as (
    update ve_outreach_contacts c set status = 'bounced', stop_reason = 'the email bounced'
    where c.status in ('in_sequence', 'finished')
      and exists (select 1 from email_sends s where s.campaign_ref like 've-outreach-' || c.id || '-%' and (s.bounced_at is not null or s.status = 'bounced'))
    returning c.id)
  select count(*) into n_bounce from b;

  with r as (
    update ve_outreach_contacts c set status = 'interested', stop_reason = 'replied'
    where c.status in ('in_sequence', 'finished')
      and exists (select 1 from email_replies m where lower(m.from_email) = lower(c.email) and not coalesce(m.is_auto_reply, false)
        and m.received_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
    returning c.id)
  select count(*) into n_reply from r;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'replied', '{}'::jsonb from ve_outreach_contacts where stop_reason = 'replied'
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'replied');

  with k as (
    update ve_outreach_contacts c set status = 'interested', stop_reason = 'clicked their page'
    where c.status in ('in_sequence', 'finished') and c.link_code is not null
      and exists (select 1 from ve_links l join ve_link_clicks x on x.link_id = l.id where l.code = c.link_code and not x.is_bot
        and x.clicked_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
    returning c.id)
  select count(*) into n_click from k;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'clicked', '{}'::jsonb from ve_outreach_contacts where stop_reason = 'clicked their page'
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'clicked');

  update ve_outreach_batches b set status = 'sent', updated_at = now()
  where b.status = 'approved' and not exists (select 1 from ve_outreach_contacts c where c.batch_id = b.id and c.status = 'not_sent');

  return jsonb_build_object('clicked', n_click, 'replied', n_reply, 'joined', n_join + n_pjoin, 'opted_out', n_out, 'bounced', n_bounce);
end $function$;

-- The first people list: the 111 Day Theory founding cohort. Off until Sean turns it on, like every city.
insert into public.ve_outreach_cities (community_slug, name, enabled, daily_cap, kind, program, link_url, footer_reason, brand)
values ('111-day-theory-founding', '111 Day Theory: founding cohort', false, 30, 'people', '111-day-theory',
  'https://lesaruss.com/entry/join?program=111-day-theory',
  'you know Sean A. Russell or have worked with LESARUSS', '111-day-theory')
on conflict (community_slug) do nothing;

-- Its three emails, from Sean, as drafts: nothing in this list sends until Sean marks them ready in HQ.
insert into public.ve_outreach_templates (program, step, day_offset, subject, body, status) values
('111-day-theory', 1, 0, 'I want you in the first cohort',
'Hi {first_name},

I''m opening the first cohort of 111 Day Theory, and I''d like you in it.

It''s 111 days to take one thing in your life on. The first 21 days you get clear: what you want, what has been in the way, and a Goal Sheet you will actually use. The next 90 days you execute, with small goals every week, a guide with you every day and a check-in every week. No judgment, no stories. Just what happened and what''s next.

The founding cohort is small, and you''ll help shape it. In return you get more direct time with me than any cohort after you.

It''s part of the LESARUSS AI membership. Start here: {link}

Sean', 'draft'),
('111-day-theory', 2, 4, 'The first 21 days',
'Hi {first_name},

A quick follow-up on 111 Day Theory. The part people ask about most is the first 21 days. Before anyone sets a goal, we look at the patterns that have stopped us before. By Day 14 your goals are locked, and by Day 21 your tools are set up. Then the 90 days start.

The founding cohort starts together. If you want in: {link}

Sean', 'draft'),
('111-day-theory', 3, 10, 'Last note from me',
'Hi {first_name},

I won''t keep filling your inbox. If now isn''t the time, no problem at all. If you''d like to talk it through first, just reply and I''ll answer personally.

{link}

Sean', 'draft')
on conflict (program, step) do nothing;
