-- People > Intake and Local Voices as a pipeline (Sean, 2026-11-12: "Approved, keep the names, start building it"; mock
-- /mocks/local-voices). Every lead lands in ve_intake, sorted by kind, with where it came from. Our own content comes in on its own
-- (status added); outside finds wait for Sean's yes (needs_yes). ve_intake_refresh() fills it and moves the good fits for Local Voices
-- into ve_campaign_dms (program podcast-local-voices), where the listing and the picture come first. Safe to run twice.

create table if not exists ve_intake (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'business' check (kind in ('business','person','nonprofit','event','other')),
  name text not null,
  listing_id uuid references listings(id),
  city text, state text,
  source_kind text not null check (source_kind in ('our_show','our_article','nomination','event_lead','news','podcast_feed','ig_follow','suggestion')),
  source_ref text not null,
  source_title text, source_url text,
  status text not null default 'needs_yes' check (status in ('needs_yes','added','skipped','never')),
  suggested text[] not null default '{}',
  reason text,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz, decided_by uuid
);
create unique index if not exists ve_intake_source_key on ve_intake (source_ref, dedupe_key);
create index if not exists ve_intake_status on ve_intake (status, kind);
alter table ve_intake enable row level security;

-- Local Voices rows carry their picture check, Sean's OK and how they closed.
alter table ve_campaign_dms add column if not exists intake_id uuid references ve_intake(id);
alter table ve_campaign_dms add column if not exists picture_status text not null default 'looking';
alter table ve_campaign_dms add column if not exists picture_url text;
alter table ve_campaign_dms add column if not exists approved_at timestamptz;
alter table ve_campaign_dms add column if not exists approved_by uuid;
alter table ve_campaign_dms add column if not exists closed_reason text;
alter table ve_campaign_dms add column if not exists snooze_until date;
alter table ve_campaign_dms alter column opener drop not null;
do $$ begin
  alter table ve_campaign_dms drop constraint if exists ve_campaign_dms_picture_status_check;
  alter table ve_campaign_dms add constraint ve_campaign_dms_picture_status_check check (picture_status in ('looking','found','approved','none'));
  alter table ve_campaign_dms drop constraint if exists ve_campaign_dms_closed_reason_check;
  alter table ve_campaign_dms add constraint ve_campaign_dms_closed_reason_check check (closed_reason is null or closed_reason in ('not_interested','not_now','never'));
  alter table ve_campaign_dms drop constraint if exists ve_campaign_dms_channel_check;
  alter table ve_campaign_dms add constraint ve_campaign_dms_channel_check check (channel in ('instagram','facebook','whatsapp','text','email'));
end $$;

create or replace function ve_intake_kind(p_category text) returns text language sql immutable as $$
  select case
    when p_category in ('Founders','Athletes','Activists','Content Creators','Chefs','Physicians','Health Experts','Coaches and Consultants','Health Professionals') then 'person'
    when p_category in ('Nonprofits','Rescues','Sanctuaries','Groups') then 'nonprofit'
    when p_category in ('Events') then 'event'
    else 'business' end
$$;

-- Media brands talk about the movement; Local Voices is for the people and places in it.
create or replace function ve_local_voices_fit(p_category text) returns boolean language sql immutable as $$
  select coalesce(p_category,'') not in ('News Outlets','Podcasts','Radio and TV','YouTube','Documentaries & Films','Books')
$$;

create or replace function ve_intake_refresh() returns jsonb language plpgsql security definer set search_path = public as $$
declare n_show int := 0; n_nom int := 0; n_evt int := 0; n_q int := 0;
begin
  -- 1. Our shows: everyone a live episode's notes mention (notes.mentions holds Directory slugs). The show itself is left out.
  with m as (
    select distinct on (n.guid, x.slug) n.guid, n.listing_id show_id, (n.notes->>'number') num, x.slug, sh.name show_name
    from ve_episode_notes n
    cross join lateral jsonb_array_elements_text(coalesce(n.notes->'mentions','[]'::jsonb)) x(slug)
    left join listings sh on sh.id = n.listing_id
    where n.status = 'live'
  ), l as (
    select distinct on (m.guid, m.slug) m.*, li.id lid, li.name, li.category, li.address_city, li.address_state
    from m join listings li on li.slug = m.slug and li.status <> 'rejected'
    order by m.guid, m.slug, (li.status = 'approved') desc
  ), ins as (
    insert into ve_intake (kind, name, listing_id, city, state, source_kind, source_ref, source_title, source_url, status, suggested, reason, dedupe_key)
    select ve_intake_kind(l.category), l.name, l.lid, l.address_city, l.address_state, 'our_show', 'ep:' || l.guid,
           coalesce(l.show_name, 'Our podcast') || coalesce(' ' || l.num, ''), null, 'added',
           case when ve_local_voices_fit(l.category) then array['podcast-local-voices'] else '{}' end,
           case when ve_local_voices_fit(l.category) then 'Mentioned on ' || coalesce(l.show_name, 'our podcast') || coalesce(' ' || l.num, '') else 'A media brand: not a Local Voice' end,
           l.lid::text
    from l where l.lid is distinct from l.show_id
    on conflict (source_ref, dedupe_key) do nothing returning 1)
  select count(*) into n_show from ins;

  -- 2. Nominations: a member told us about them. Our side, so they come in on their own.
  with ins as (
    insert into ve_intake (kind, name, listing_id, source_kind, source_ref, source_title, status, suggested, reason, dedupe_key)
    select 'person', nm.nominee_name, nm.listing_id, 'nomination', 'nom:' || nm.id, 'Nominated by ' || coalesce(nm.nominator_name, 'a member'),
           'added', array['podcast-local-voices'], 'Nominated for their story', coalesce(nm.listing_id::text, lower(nm.nominee_name))
    from ve_nominations nm where coalesce(nm.nominee_name, '') <> '' and coalesce(nm.status, '') not in ('rejected','declined','spam')
    on conflict (source_ref, dedupe_key) do nothing returning 1)
  select count(*) into n_nom from ins;

  -- 3. Event leads: venues and hosts our events point to. Found by us, so they wait for Sean's yes.
  with ins as (
    insert into ve_intake (kind, name, listing_id, city, state, source_kind, source_ref, source_title, source_url, status, suggested, reason, dedupe_key)
    select case when e.kind = 'venue' then 'business' else 'other' end, e.name, e.listing_id, e.city, e.state, 'event_lead', 'evl:' || e.id,
           initcap(e.kind) || ' of ' || e.event_count || ' event' || case when e.event_count = 1 then '' else 's' end || ' on our calendar', e.url,
           'needs_yes', '{}', null, coalesce(e.listing_id::text, lower(e.name))
    from ve_event_leads e where e.status = 'new' and coalesce(e.name, '') <> ''
    on conflict (source_ref, dedupe_key) do nothing returning 1)
  select count(*) into n_evt from ins;

  -- 4. The good fits for Local Voices go to its Queued, once per listing, never anyone on the do-not-contact list.
  with c as (
    select distinct on (i.listing_id) i.id iid, i.listing_id, li.instagram, li.email, li.ve_contact_email, li.logo_url
    from ve_intake i join listings li on li.id = i.listing_id
    where i.status = 'added' and 'podcast-local-voices' = any(i.suggested) and li.status <> 'rejected'
      and not exists (select 1 from ve_do_not_contact d where d.listing_id = i.listing_id and d.released_at is null)
      and not exists (select 1 from ve_campaign_dms x where x.program_slug = 'podcast-local-voices' and x.listing_id = i.listing_id)
    order by i.listing_id, i.created_at
  ), ins as (
    insert into ve_campaign_dms (program_slug, listing_id, channel, handle, status, intake_id, picture_status, picture_url, sort, note)
    select 'podcast-local-voices', c.listing_id,
           case when coalesce(c.instagram, '') <> '' then 'instagram' when coalesce(c.ve_contact_email, c.email, '') <> '' then 'email' else 'instagram' end,
           coalesce(nullif(regexp_replace(regexp_replace(coalesce(c.instagram, ''), '^.*instagram\.com/', ''), '[/?#].*$|^@', '', 'g'), ''), ''),
           'to_send', c.iid, case when coalesce(c.logo_url, '') <> '' then 'found' else 'looking' end, nullif(c.logo_url, ''), 100, null
    from c
    on conflict (program_slug, listing_id, channel) do nothing returning 1)
  select count(*) into n_q from ins;

  return jsonb_build_object('our_shows', n_show, 'nominations', n_nom, 'event_leads', n_evt, 'queued', n_q);
end $$;
revoke all on function ve_intake_refresh() from public, anon, authenticated;

-- Sean, 2026-11-12, on Poderosa Minded: "I don't want to reach out to them, and I don't want to feature them."
insert into ve_do_not_contact (listing_id, note, added_by)
select id, 'Sean 2026-11-12: "I don''t want to reach out to them, and I don''t want to feature them. They''re on our website. That''s enough."', 'logan'
from listings where slug = 'poderosa-minded' and status = 'approved'
and not exists (select 1 from ve_do_not_contact d join listings l on l.id = d.listing_id where l.slug = 'poderosa-minded' and d.released_at is null);

-- Sunni and Carla are already in; link their pictures (the Instagram pictures copied in on 2026-11-12) for Sean's check.
update ve_campaign_dms d set picture_status = 'found', picture_url = l.logo_url
from listings l where l.id = d.listing_id and d.program_slug = 'podcast-local-voices' and d.picture_status = 'looking' and coalesce(l.logo_url, '') <> '';

-- Hourly, so a newly published episode's mentions reach Queued the same hour.
select cron.schedule('ve-intake-refresh', '17 * * * *', $c$select ve_intake_refresh()$c$)
where not exists (select 1 from cron.job where jobname = 've-intake-refresh');

-- The picture comes first (Sean, 2026-11-12: "a scan of logos for the items that are in the queue... so they take priority").
-- Every 15 minutes: a finished ve-logo-hunt pick (already copied into our storage) waits on the row for Sean's check; nothing found
-- says none; anyone still looking with no hunt in 30 days gets one started.
create or replace function ve_voices_pictures() returns jsonb language plpgsql security definer set search_path = public as $$
declare ids uuid[]; n_sync int := 0; n_none int := 0;
begin
  with h as (
    select distinct on (lh.listing_id) lh.listing_id, lh.pick, lh.verdict, lh.candidates
    from ve_logo_hunts lh where lh.status = 'done' order by lh.listing_id, lh.done_at desc nulls last
  ), up as (
    update ve_campaign_dms d set picture_status = 'found', picture_url = h.candidates -> h.pick ->> 'stored'
    from h where h.listing_id = d.listing_id and d.program_slug = 'podcast-local-voices' and d.picture_status = 'looking'
      and h.pick is not null and coalesce(h.candidates -> h.pick ->> 'stored', '') <> '' returning 1)
  select count(*) into n_sync from up;
  with h as (
    select distinct on (lh.listing_id) lh.listing_id, lh.pick from ve_logo_hunts lh where lh.status = 'done' order by lh.listing_id, lh.done_at desc nulls last
  ), up as (
    update ve_campaign_dms d set picture_status = 'none' from h
    where h.listing_id = d.listing_id and d.program_slug = 'podcast-local-voices' and d.picture_status = 'looking' and h.pick is null returning 1)
  select count(*) into n_none from up;
  select array_agg(d.listing_id) into ids from ve_campaign_dms d
  where d.program_slug = 'podcast-local-voices' and d.picture_status = 'looking' and d.listing_id is not null
    and not exists (select 1 from ve_logo_hunts lh where lh.listing_id = d.listing_id and lh.created_at > now() - interval '30 days');
  if ids is not null then
    perform net.http_post(
      url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-logo-hunt',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select value from lesaruss_secrets where key = 'SUPABASE_ANON_KEY'),
        'x-ops-token', (select value from lesaruss_secrets where key = 'LESARUSS_ADMIN_TOKEN')),
      body := jsonb_build_object('action', 'start', 'listing_ids', to_jsonb(ids), 'run_id', 'lv' || to_char(now(), 'YYMMDDHH24MI')),
      timeout_milliseconds := 60000);
  end if;
  return jsonb_build_object('synced', n_sync, 'none', n_none, 'hunting', coalesce(array_length(ids, 1), 0));
end $$;
revoke all on function ve_voices_pictures() from public, anon, authenticated;
select cron.schedule('ve-voices-pictures', '*/15 * * * *', $c$select ve_voices_pictures()$c$)
where not exists (select 1 from cron.job where jobname = 've-voices-pictures');
