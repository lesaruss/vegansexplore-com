-- 20261102_event_heads_up.sql
-- The event host path, step 2: the heads-up email (Sean, 2026-11-02: "Build the list and template on the outreach people-list
-- engine: from the team, signed by the chapter's Community Manager, never my name; at most one email every 14 days per host,
-- several events grouped; only approved events and an email the host publishes; London business addresses only; no prices;
-- permanent unsubscribe... Nothing sends until I approve it once." Canon canon-ve-event-host-path, playbook ve-event-host-path.)
--
-- On the outreach engine:
--   ve_outreach_cities 'event-hosts'      the list (kind people, program event-heads-up): its switch (enabled), daily cap,
--                                         approval (approved_at, approved_by) and footer reason, as every list has.
--   ve_outreach_templates event-heads-up  the one email (step 1). draft until Sean approves it; any change to its words puts it
--                                         back to draft. ve-outreach never sends it: it has no contacts in ve_outreach_contacts.
-- Its own pieces (a host is told again as new events come, which the engine's three-step sequence cannot do):
--   ve_event_host_contacts  one row per host (the Directory listing that hosts the events): the email they publish, where it was
--                           found, the chapter, and a status: active, no_email, held (with why), has_account, stopped.
--   ve_event_headsups       one row per email sent: which events it named, when, the email-send result.
--   ve_event_hosts_refresh() rebuilds the contacts from the calendar; ve_event_heads_up_due() is what goes next.
-- Sent by the edge function ve-event-headsup (tick, cron every 15 minutes) through email-send, brand vegans-explore.

-- The list and its email
insert into public.ve_outreach_cities (community_slug, name, kind, program, brand, audience_brand, sender_brand, enabled, daily_cap, auto_send, ramp, link_base, footer_reason, notes)
values ('event-hosts', 'Event hosts: the heads-up', 'people', 'event-heads-up', 'vegans-explore', 'vegans-explore', 'vegans-explore', false, 30, false, false,
  'https://vegansexplore.com', 'your events are listed on the Vegans Explore calendar',
  'Sent by ve-event-headsup, not the outreach sender: one email per host at most every 14 days, naming their new approved events. Approve and switch it on in Depot > Events > Heads-up.')
on conflict (community_slug) do nothing;

insert into public.ve_outreach_templates (program, step, day_offset, subject, body, status)
values ('event-heads-up', 1, 0,
  '{host}, your events are on the Vegans Explore calendar',
  E'Hello {greeting},\n\nWe keep a calendar of Vegan events, city by city, so people can find them. {host_possessive} upcoming {events_word} on it:\n\n{events}\n\nIf you''re running {it_them}, claim {it_them} on the event''s page: look for "Are you running this event?". It''s free. Once our team checks it, your name goes on the page, you see who''s going, and you can send updates to the guests who said yes, through us.\n\nIf anything is wrong, a date, a place or a link, reply to this email and we''ll fix it.\n\n{signoff}',
  'draft')
on conflict (program, step) do nothing;

create table if not exists public.ve_event_host_contacts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  name text not null,
  email text,
  email_source text,
  chapter text,
  status text not null default 'no_email' check (status in ('active', 'no_email', 'held', 'has_account', 'stopped')),
  status_note text,
  last_sent_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_event_host_contacts enable row level security;

create table if not exists public.ve_event_headsups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.ve_event_host_contacts(id) on delete cascade,
  email text not null,
  event_ids uuid[] not null,
  subject text,
  result text not null,
  send_id text,
  error text,
  sent_at timestamptz not null default now()
);
alter table public.ve_event_headsups enable row level security;
create index if not exists ve_event_headsups_contact on public.ve_event_headsups (contact_id, sent_at desc);

-- Free mail providers: a London host is emailed only at a business address (UK PECR: individual subscribers need consent first).
create or replace function public.ve_is_free_mail(p_email text)
 returns boolean language sql immutable as $$
  select lower(split_part(coalesce(p_email, ''), '@', 2)) ~ '^(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|mac|aol|proton|protonmail|pm|gmx|mail|zoho|yandex|btinternet|sky|virginmedia|talktalk|ntlworld|blueyonder|tiscali|orange|fastmail|hey)\.'
$$;

-- The hosts of upcoming approved Vegans Explore events, and the email each publishes (their group contact found on their own
-- site or Instagram bio by ve-groups find_contact, else the listing's own email). Never overwrites stopped.
create or replace function public.ve_event_hosts_refresh()
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare n int;
begin
  insert into ve_event_host_contacts (listing_id, name, email, email_source, chapter)
  select l.id, l.name,
    lower(nullif(trim(coalesce(l.details->'group'->>'contact_email', l.email)), '')),
    case when nullif(trim(l.details->'group'->>'contact_email'), '') is not null then coalesce(l.details->'group'->>'contact_source', 'Their group contact')
         when nullif(trim(l.email), '') is not null then 'The email on their Directory listing' end,
    coalesce((select c from unnest(l.communities) c where c <> 'all' limit 1), ve_chapter_of(l.address_city, l.address_state))
  from listings l
  where l.status = 'approved' and exists (select 1 from events e where e.host_listing_id = l.id and e.status = 'approved'
    and e.tenant_id = '00000000-0000-4000-a000-000000000002' and e.starts_at > now())
  on conflict (listing_id) do update set name = excluded.name, chapter = excluded.chapter,
    email = coalesce(excluded.email, ve_event_host_contacts.email),
    email_source = case when excluded.email is not null then excluded.email_source else ve_event_host_contacts.email_source end,
    updated_at = now();

  update ve_event_host_contacts c set
    status = case
      when c.status = 'stopped' then 'stopped'
      when c.email is not null and email_is_suppressed(c.email, 'vegans-explore') then 'stopped'
      when l.owner_member_id is not null or exists (select 1 from ve_group_partners g where g.listing_id = l.id and g.status in ('onboarding', 'active', 'paused'))
        then 'has_account'
      when c.email is null then 'no_email'
      when c.chapter = 'london' and ve_is_free_mail(c.email) then 'held'
      else 'active' end,
    status_note = case
      when c.status = 'stopped' then c.status_note
      when c.email is not null and email_is_suppressed(c.email, 'vegans-explore') then 'Asked us to stop emailing'
      when l.owner_member_id is not null then 'They run this listing with their own account'
      when exists (select 1 from ve_group_partners g where g.listing_id = l.id and g.status in ('onboarding', 'active', 'paused')) then 'A Group Partner'
      when c.email is null then 'No published email yet'
      when c.chapter = 'london' and ve_is_free_mail(c.email) then 'London: business addresses only'
      else null end,
    stopped_at = case when c.status <> 'stopped' and c.email is not null and email_is_suppressed(c.email, 'vegans-explore') then now() else c.stopped_at end,
    updated_at = now()
  from listings l where l.id = c.listing_id;
  get diagnostics n = row_count;
  return jsonb_build_object('hosts', n, 'active', (select count(*) from ve_event_host_contacts where status = 'active'));
end $function$;

-- The events a host has not been told about: approved, ours, 2 to 120 days out, not claimed or organized, not named before.
create or replace function public.ve_event_host_new_events(p_contact uuid)
 returns setof public.events language sql stable security definer set search_path to 'public'
as $function$
  select e.* from events e join ve_event_host_contacts c on c.id = p_contact and e.host_listing_id = c.listing_id
  where e.status = 'approved' and e.tenant_id = '00000000-0000-4000-a000-000000000002'
    and e.starts_at > now() + interval '2 days' and e.starts_at < now() + interval '120 days'
    and coalesce(e.link_status, '') <> 'gone'
    and not exists (select 1 from ve_event_organizers o where o.event_id = e.id)
    and not exists (select 1 from ve_event_claims k where k.event_id = e.id and k.status in ('new', 'approved'))
    and not exists (select 1 from ve_event_headsups h where h.contact_id = c.id and h.result in ('sent', 'already_sent') and e.id = any(h.event_ids))
  order by e.starts_at
  limit 8
$function$;

-- Who is due: active, not suppressed, not emailed in 14 days, with at least one new event.
create or replace function public.ve_event_heads_up_due(p_limit integer default 20)
 returns table(contact_id uuid, event_ids uuid[])
 language sql stable security definer set search_path to 'public'
as $function$
  select c.id, array(select x.id from ve_event_host_new_events(c.id) x)
  from ve_event_host_contacts c
  where c.status = 'active' and c.email is not null
    and (c.last_sent_at is null or c.last_sent_at < now() - interval '14 days')
    and not email_is_suppressed(c.email, 'vegans-explore')
    and exists (select 1 from ve_event_host_new_events(c.id))
  order by c.last_sent_at nulls first, c.name
  limit p_limit
$function$;

revoke all on function public.ve_event_hosts_refresh() from public, anon, authenticated;
revoke all on function public.ve_event_host_new_events(uuid) from public, anon, authenticated;
revoke all on function public.ve_event_heads_up_due(integer) from public, anon, authenticated;

select public.ve_event_hosts_refresh();

-- The sender: every 15 minutes; it sends only on weekdays 10 AM to 5 PM Eastern, with the email approved and the list switched on.
select cron.unschedule('ve-event-headsup') where exists (select 1 from cron.job where jobname = 've-event-headsup');
select cron.schedule('ve-event-headsup', '7,22,37,52 * * * *', $$select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-event-headsup',
  headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
  body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 60000)$$);
