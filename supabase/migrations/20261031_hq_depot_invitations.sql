-- HQ Depot > Invitations, V1 (Sean, 2026-10-30): "The original core depot lives on LESARUSS HQ... I should be able to
-- change my environment and send to Vegans Explore people, or send to Russell's Roving Reporters... we're sending
-- individual messages, inviting them to join the platform... if we don't get any response... we just move them into a
-- list of cool off... till maybe another 3 months. And they always have the option to hit unsubscribe at any point."
-- LESARUSS.ai first (Founding Diplomats), approved once by Sean, then it runs on its own.
--
-- 1. One do-not-email list. Unsubscribes lived in three places (email_suppressions, people_suppression and
--    people.email_unsubscribed); email-send checked the first two, ve_outreach_due only the first, so 67 people who
--    unsubscribed in GoHighLevel were honored by neither. A People unsubscribe now writes people_suppression (trigger),
--    the 67 are copied in, and every outreach check goes through email_is_suppressed.
-- 2. A people list carries its audience brand (who it invites into), its sender (email_brands), the domain of its
--    tracked links, and how it runs on its own: daily_new (50), doubling each weekday while bounces stay low and nobody
--    complains (ramp), up to daily_cap, once Sean has approved the list (approved_at) and turned it on.
-- 3. Cool off: a person who had every email and did nothing (no click, no reply, no join) for no_reply_days after the
--    last one rests for cool_off_days (90) and is left out of picking until then.
-- 4. A personal opening per person (ve_outreach_contacts.opening), drafted from HQ > People and editable by Sean, fills
--    {opening} in the emails.
-- 5. Fix: ve_outreach_sync records 'joined' events, which the events check did not allow, so the first person to join
--    would have failed the whole sync.
-- Safe to run twice.

-- 1. One do-not-email list -------------------------------------------------------------------------------------------
create or replace function public.people_unsub_to_suppression() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.email_unsubscribed and nullif(btrim(coalesce(new.email, '')), '') is not null
     and (tg_op = 'INSERT' or not coalesce(old.email_unsubscribed, false)) then
    insert into people_suppression (email, person_id, reason, active, created_by)
    values (lower(btrim(new.email)), new.id, 'unsubscribed: ' || coalesce(new.unsubscribe_source, 'People'), true, 'people-unsubscribed')
    on conflict (email) do update set active = true, released_at = null;
  end if;
  return new;
end $$;
drop trigger if exists trg_people_unsub_suppression on public.people;
create trigger trg_people_unsub_suppression after insert or update of email_unsubscribed on public.people
  for each row execute function public.people_unsub_to_suppression();

insert into public.people_suppression (email, person_id, reason, active, created_by)
select distinct on (lower(btrim(p.email))) lower(btrim(p.email)), p.id, 'unsubscribed: ' || coalesce(p.unsubscribe_source, 'People'), true, 'people-unsubscribed'
from public.people p
where p.email_unsubscribed and nullif(btrim(coalesce(p.email, '')), '') is not null
order by lower(btrim(p.email)), p.unsubscribed_at nulls last
on conflict (email) do nothing;

-- 2. Lists and contacts ----------------------------------------------------------------------------------------------
alter table public.ve_outreach_cities
  add column if not exists audience_brand text,
  add column if not exists sender_brand text not null default 'lesaruss',
  add column if not exists link_base text not null default 'https://vegansexplore.com',
  add column if not exists auto_send boolean not null default false,
  add column if not exists daily_new integer not null default 50,
  add column if not exists ramp boolean not null default true,
  add column if not exists cool_off_days integer not null default 90,
  add column if not exists no_reply_days integer not null default 7,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid;
update public.ve_outreach_cities set audience_brand = 'vegans-explore' where kind = 'city' and audience_brand is null;
update public.ve_outreach_cities set audience_brand = '111-day-theory' where community_slug = '111-day-theory-founding' and audience_brand is null;

alter table public.ve_outreach_contacts
  add column if not exists opening text,
  add column if not exists opening_source text,
  add column if not exists cool_off_until timestamptz;
alter table public.ve_outreach_contacts drop constraint if exists ve_outreach_contacts_status_check;
alter table public.ve_outreach_contacts add constraint ve_outreach_contacts_status_check check (status = any (array[
  'not_sent', 'in_sequence', 'finished', 'interested', 'joined', 'not_interested', 'opted_out', 'bounced', 'held', 'cool_off']));
alter table public.ve_outreach_events drop constraint if exists ve_outreach_events_kind_check;
alter table public.ve_outreach_events add constraint ve_outreach_events_kind_check check (kind = any (array[
  'sent', 'clicked', 'replied', 'claimed', 'opted_out', 'bounced', 'routed', 'note', 'status', 'joined']));

-- 3. What sends next: the one do-not-email check, by the list's sender ---------------------------------------------
create or replace function public.ve_outreach_due(p_limit integer default 100)
returns table(contact_id uuid, community_slug text, listing_id uuid, email text, next_step integer)
language sql stable security definer set search_path to 'public' as $function$
  select c.id, c.community_slug, c.listing_id, c.email, c.step + 1
  from ve_outreach_contacts c
  join ve_outreach_batches b on b.id = c.batch_id and b.status in ('approved', 'sent')
  join ve_outreach_cities oc on oc.community_slug = c.community_slug and oc.enabled
  where c.step < 3
    and ((c.status = 'not_sent' and c.step = 0 and b.send_on <= (now() at time zone 'America/New_York')::date)
      or (c.status = 'in_sequence' and c.next_send_at <= now()))
    and not email_is_suppressed(c.email, oc.sender_brand)
    and exists (select 1 from ve_outreach_templates t where t.program = oc.program and t.step = c.step + 1 and t.status = 'ready')
    and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = c.listing_id and f.closure_level = 'closed')
  order by b.send_on, (c.segment = 'brand') desc, c.created_at
  limit p_limit
$function$;

-- 4. The emails, with {opening} ----------------------------------------------------------------------------------------
create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
returns table(subject text, body text, to_email text, page_url text, guide_url text)
language plpgsql stable security definer set search_path to 'public' as $function$
declare c record; l record; t record; g record; oc record; first text; city text; page text; gurl text; gline text := ''; op text;
begin
  select * into c from ve_outreach_contacts where id = p_contact;
  if not found then return; end if;
  select * into oc from ve_outreach_cities where community_slug = c.community_slug;
  if c.listing_id is null then
    select * into t from ve_outreach_templates where program = oc.program and step = p_step;
    if t is null then return; end if;
    first := nullif(split_part(trim(coalesce(c.contact_name, '')), ' ', 1), '');
    page := oc.link_url;
    op := coalesce(nullif(btrim(c.opening), ''), '');
    subject := replace(replace(t.subject, '{first_name}', coalesce(first, 'there')), '{link}', coalesce(page, ''));
    body := replace(replace(replace(t.body, '{first_name}', coalesce(first, 'there')), '{link}', coalesce(page, '')), '{opening}', op);
    -- Without an opening, its paragraph goes rather than leaving a gap.
    body := btrim(regexp_replace(body, E'\\n{3,}', E'\n\n', 'g'), E'\n ');
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

-- 5. Reading what people did: LESARUSS.ai joins, and the one do-not-email check ------------------------------------
create or replace function public.ve_outreach_sync() returns jsonb
language plpgsql security definer set search_path to 'public' as $function$
declare n_click int := 0; n_reply int := 0; n_join int := 0; n_out int := 0; n_bounce int := 0; n_pjoin int := 0;
begin
  with j as (
    update ve_outreach_contacts c set status = 'joined', joined_at = now(), stop_reason = 'claimed their page'
    where c.status in ('in_sequence', 'finished', 'interested', 'cool_off') and c.step > 0
      and (exists (select 1 from listings l where l.id = c.listing_id and (l.claimed_by_member_id is not null or l.owner_member_id is not null))
        or exists (select 1 from ve_listing_claims k where k.listing_id = c.listing_id and not coalesce(k.test, false)
          and k.created_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent')))
    returning c.id)
  select count(*) into n_join from j;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'claimed', '{}'::jsonb from ve_outreach_contacts where status = 'joined' and joined_at > now() - interval '1 minute'
      and listing_id is not null
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'claimed');

  -- A person joins: LESARUSS.ai lists count a Diplomat or LESARUSS.ai Passport (lr_member_entitled); every list counts a
  -- paid entry or a journey started after their first email.
  with pj as (
    update ve_outreach_contacts c set status = 'joined', joined_at = now(),
      stop_reason = case when oc.audience_brand = 'lesaruss-ai' then 'joined LESARUSS.ai' else 'joined LESARUSS AI' end
    from ve_outreach_cities oc
    where oc.community_slug = c.community_slug
      and c.listing_id is null and c.status in ('in_sequence', 'finished', 'interested', 'cool_off') and c.step > 0
      and exists (select 1 from members m where lower(m.email) = lower(c.email) and m.merged_into_member_id is null
        and ((oc.audience_brand = 'lesaruss-ai' and lr_member_entitled(m.id))
          or (m.entry_paid_at is not null and m.entry_paid_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
          or exists (select 1 from journey_enrollments je where je.member_id = m.id
            and je.created_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))))
    returning c.id)
  select count(*) into n_pjoin from pj;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'joined', '{}'::jsonb from ve_outreach_contacts where status = 'joined' and listing_id is null
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'joined');

  with o as (
    update ve_outreach_contacts c set status = 'opted_out', stop_reason = 'unsubscribed or blocked'
    from ve_outreach_cities oc
    where oc.community_slug = c.community_slug and c.status in ('not_sent', 'in_sequence', 'finished', 'cool_off')
      and email_is_suppressed(c.email, oc.sender_brand)
    returning c.id)
  select count(*) into n_out from o;

  with b as (
    update ve_outreach_contacts c set status = 'bounced', stop_reason = 'the email bounced'
    where c.status in ('in_sequence', 'finished')
      and exists (select 1 from email_sends s where s.campaign_ref like 've-outreach-' || c.id || '-%' and (s.bounced_at is not null or s.status = 'bounced'))
    returning c.id)
  select count(*) into n_bounce from b;

  with r as (
    update ve_outreach_contacts c set status = 'interested', interested_at = coalesce(c.interested_at, now()), stop_reason = 'replied'
    where c.status in ('in_sequence', 'finished', 'cool_off')
      and exists (select 1 from email_replies m where lower(m.from_email) = lower(c.email) and not coalesce(m.is_auto_reply, false)
        and m.received_at > (select min(e.created_at) from ve_outreach_events e where e.contact_id = c.id and e.kind = 'sent'))
    returning c.id)
  select count(*) into n_reply from r;
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'replied', '{}'::jsonb from ve_outreach_contacts where stop_reason = 'replied'
      and not exists (select 1 from ve_outreach_events e where e.contact_id = ve_outreach_contacts.id and e.kind = 'replied');

  with k as (
    update ve_outreach_contacts c set status = 'interested', interested_at = coalesce(c.interested_at, now()), stop_reason = 'clicked their page'
    where c.status in ('in_sequence', 'finished', 'cool_off') and c.link_code is not null
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

-- 6. Cool off -------------------------------------------------------------------------------------------------------
create or replace function public.ve_outreach_cool_off() returns integer
language plpgsql security definer set search_path to 'public' as $function$
declare n int;
begin
  with x as (
    update ve_outreach_contacts c set status = 'cool_off', cool_off_until = now() + make_interval(days => oc.cool_off_days),
      stop_reason = 'no response', updated_at = now()
    from ve_outreach_cities oc
    where oc.community_slug = c.community_slug and oc.kind = 'people' and c.status = 'finished'
      and c.last_sent_at < now() - make_interval(days => oc.no_reply_days)
    returning c.id, c.cool_off_until)
  insert into ve_outreach_events (contact_id, kind, detail)
    select id, 'status', jsonb_build_object('status', 'cool_off', 'until', cool_off_until) from x;
  get diagnostics n = row_count;
  return n;
end $function$;

-- 7. Running on its own: today's send day for every approved, switched-on list -------------------------------------
-- The first day sends daily_new; each later weekday doubles the last day while the list's last 7 days show at most 1
-- bounce in 20 and no complaint, else holds at the last day's size. Never above daily_cap (the sender's warm-up and
-- PER_TICK pace it again). Only people whose opening is drafted (when the list's first email uses one) are planned.
create or replace function public.ve_outreach_autoplan() returns jsonb
language plpgsql security definer set search_path to 'public' as $function$
declare
  oc record; today date := (now() at time zone 'America/New_York')::date; last_size int; healthy boolean; size int;
  b uuid; k int; needs_opening boolean; sent7 int; bad7 int; cmp7 int; out jsonb := '[]'::jsonb;
begin
  if extract(isodow from today) > 5 then return out; end if;
  for oc in select * from ve_outreach_cities where kind = 'people' and auto_send and enabled and approved_at is not null loop
    if exists (select 1 from ve_outreach_batches x where x.community_slug = oc.community_slug and x.send_on = today and x.status <> 'cancelled') then continue; end if;
    select (select count(*) from ve_outreach_contacts c where c.batch_id = x.id) into last_size
      from ve_outreach_batches x where x.community_slug = oc.community_slug and x.status in ('approved', 'sent') and x.send_on < today
      order by x.send_on desc limit 1;
    select count(*), count(*) filter (where s.bounced_at is not null or s.status = 'bounced'), count(*) filter (where s.complained_at is not null)
      into sent7, bad7, cmp7
      from email_sends s where s.list_ref = 've-outreach:' || oc.community_slug and s.created_at > now() - interval '7 days';
    healthy := cmp7 = 0 and bad7 * 20 <= greatest(sent7, 20);
    size := case when last_size is null or last_size = 0 then oc.daily_new
                 when oc.ramp and healthy then last_size * 2 else last_size end;
    size := least(greatest(size, 1), oc.daily_cap);
    select exists (select 1 from ve_outreach_templates t where t.program = oc.program and t.step = 1 and t.body like '%{opening}%') into needs_opening;
    insert into ve_outreach_batches (community_slug, send_on, status, approved_at, approved_by)
      values (oc.community_slug, today, 'approved', now(), oc.approved_by) returning id into b;
    update ve_outreach_contacts set batch_id = b where id in (
      select c.id from ve_outreach_contacts c
      where c.community_slug = oc.community_slug and c.status = 'not_sent' and c.batch_id is null
        and (not needs_opening or c.opening_source is not null)
        and not email_is_suppressed(c.email, oc.sender_brand)
      order by c.created_at limit size);
    get diagnostics k = row_count;
    if k = 0 then delete from ve_outreach_batches where id = b; continue; end if;
    out := out || jsonb_build_object('list', oc.community_slug, 'planned', k, 'healthy', healthy);
  end loop;
  return out;
end $function$;

-- 8. Who can be invited into a brand -----------------------------------------------------------------------------------
-- HQ > People with an email, not archived, merged, quarantined or Sean himself, not on the do-not-email list for the
-- sender, not already a member of that brand, and not on any list for that brand (unless their cool off has ended).
create or replace function public.ve_invite_candidates(p_brand text, p_sender text default 'lesaruss', p_q text default null,
  p_fit text default 'suggested', p_limit integer default 50, p_offset integer default 0)
returns table(person_id uuid, name text, email text, organization text, title text, city text, recommended_brand text,
  outreach_angle text, summary text, source text, last_interaction_at timestamptz, emails_with_sean integer, total bigint)
language sql stable security definer set search_path to 'public' as $function$
  with pool as (
    select p.*, lower(btrim(p.email)) em from people p
    where nullif(btrim(coalesce(p.email, '')), '') is not null and not coalesce(p.archived, false) and p.merged_into is null
      and not coalesce(p.quarantined, false) and not coalesce(p.is_self, false) and coalesce(p.is_person, true)
      and not coalesce(p.email_unsubscribed, false)
      and (p_fit <> 'suggested' or p.recommended_brand = p_brand)
      and (p_q is null or btrim(p_q) = '' or (coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '') || ' ' || p.email || ' ' ||
        coalesce(p.organization, '') || ' ' || coalesce(p.title, '') || ' ' || coalesce(p.city, '') || ' ' || coalesce(p.source, '')) ilike '%' || btrim(p_q) || '%')
  )
  select x.id, nullif(btrim(coalesce(x.first_name, '') || ' ' || coalesce(x.last_name, '')), ''), x.em, x.organization, x.title, x.city,
    x.recommended_brand, x.outreach_angle, left(x.relationship_summary, 300), x.source, x.last_interaction_at, x.email_message_count,
    count(*) over ()
  from pool x
  where not email_is_suppressed(x.em, p_sender)
    and not exists (select 1 from ve_outreach_contacts c join ve_outreach_cities oc on oc.community_slug = c.community_slug
      where oc.audience_brand = p_brand and lower(c.email) = x.em
        and not (c.status = 'cool_off' and c.cool_off_until <= now()))
    and not exists (select 1 from members m where lower(m.email) = x.em and m.merged_into_member_id is null
      and ((p_brand = 'lesaruss-ai' and lr_member_entitled(m.id))
        or (p_brand = 'vegans-explore' and m.membership_status = 'active' and ve_member_entitled(m.id))))
  order by (x.recommended_brand = p_brand) desc, coalesce(x.email_message_count, 0) desc, x.last_interaction_at desc nulls last
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
$function$;
revoke all on function public.ve_invite_candidates(text, text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ve_outreach_autoplan() from public, anon, authenticated;
revoke all on function public.ve_outreach_cool_off() from public, anon, authenticated;

-- 9. The first list: LESARUSS.ai Founding Diplomats --------------------------------------------------------------------
-- Everything stays off until Sean approves it in HQ: the emails are drafts, the list is not approved and not switched on.
insert into public.ve_outreach_cities (community_slug, name, kind, program, link_url, footer_reason, brand, enabled, daily_cap,
  audience_brand, sender_brand, link_base, auto_send, daily_new, ramp, cool_off_days, no_reply_days, states, cities)
values ('lesaruss-ai-founding-diplomats', 'LESARUSS.ai: Founding Diplomats', 'people', 'lesaruss-ai-founding-diplomat',
  'https://lesaruss.ai/join', 'you know Sean A. Russell or have worked with LESARUSS', 'lesaruss-ai', false, 400,
  'lesaruss-ai', 'lesaruss', 'https://lesaruss.ai', true, 50, true, 90, 7, '{}', '{}')
on conflict (community_slug) do nothing;

insert into public.ve_outreach_templates (program, step, day_offset, subject, body, status) values
('lesaruss-ai-founding-diplomat', 1, 0, '{first_name}, a seat for you at LESARUSS.ai',
'Hi {first_name},

{opening}

I''m opening LESARUSS.ai to a small group first, and I want you in it. It''s where I''m learning AI out loud while I build my own brands: step-by-step guides, live hot labs where you watch the real work, and a place to bring your questions.

The first 111 members are Founding Diplomats. It''s $111 for 111 days, every guide is included, and founding members keep their rate.

Here''s your seat: {link}

If it''s not for you, that''s completely fine. Reply and tell me what you''re working on. I''d love to hear it.

Sean', 'draft'),
('lesaruss-ai-founding-diplomat', 2, 5, 'Still saving your seat',
'Hi {first_name},

Following up once on my note about LESARUSS.ai. The Founding Diplomat seats are the first 111, and I''d rather offer one to you than to a stranger.

Here it is again: {link}

Either way, I''m glad we''re connected.

Sean', 'draft')
on conflict (program, step) do nothing;
