-- ve-guide-banner-audio: Guide banners you can hear, and one hub for every ad asset (Sean, 2026-11-09).
-- 1. ve_guide_commercials: every Guide commercial, both cuts (the podcast spot and the banner spot), with its file, script, length and
--    whether its words were checked with stt. The hub (Depot > Ad assets, ve-depot ad_assets) reads it; nothing public reads it.
-- 2. Listens: ad_impressions.listens beside impressions and clicks (ve_house_ad_count kind 'listen'), and ve_promo_events steps
--    'listen' (pressed play) and 'heard' (played to the end), so each banner's listens are counted per slot and per page.

create table if not exists public.ve_guide_commercials (
  id uuid primary key default gen_random_uuid(),
  guide_slug text not null,
  guide_name text not null,
  speaker text not null,
  voice_id text,
  cut text not null check (cut in ('podcast', 'banner')),
  version int not null default 1,
  audio_path text not null unique,
  script text,
  script_source text not null default 'written' check (script_source in ('written', 'transcribed')),
  seconds numeric(6, 2),
  checked boolean,
  note text,
  made_at timestamptz not null default now(),
  unique (guide_slug, cut, version)
);
alter table public.ve_guide_commercials enable row level security;

alter table public.ad_impressions add column if not exists listens int not null default 0;

create or replace function public.ve_house_ad_count(p_placement uuid, p_campaign uuid, p_kind text)
 returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare d date := (now() at time zone 'utc')::date;
begin
  if p_kind not in ('view', 'click', 'listen') then return false; end if;
  if not exists (select 1 from ad_campaigns c join ad_campaign_placements cp on cp.campaign_id = c.id and cp.placement_id = p_placement
                 where c.id = p_campaign and c.sponsor_campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001' and c.status = 'active') then return false; end if;
  update ad_impressions set impressions = impressions + case when p_kind = 'view' then 1 else 0 end,
                            clicks = clicks + case when p_kind = 'click' then 1 else 0 end,
                            listens = listens + case when p_kind = 'listen' then 1 else 0 end
   where placement_id = p_placement and campaign_id = p_campaign and log_date = d;
  if not found then
    insert into ad_impressions (placement_id, campaign_id, log_date, impressions, clicks, listens)
    values (p_placement, p_campaign, d, case when p_kind = 'view' then 1 else 0 end, case when p_kind = 'click' then 1 else 0 end,
            case when p_kind = 'listen' then 1 else 0 end);
  end if;
  return true;
end $function$;

alter table public.ve_promo_events drop constraint if exists ve_promo_events_step_check;
alter table public.ve_promo_events add constraint ve_promo_events_step_check
  check (step = any (array['view', 'click', 'landed', 'started', 'sent', 'accepted', 'listen', 'heard']));

create or replace function public.ve_promo_track(p_promo text, p_step text, p_visitor text, p_page text, p_listing uuid default null::uuid,
  p_cta text default null::text, p_channel text default null::text, p_vl uuid default null::uuid)
 returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare v_channel text := nullif(left(btrim(coalesce(p_channel, '')), 80), ''); v_code text; v_listing uuid;
begin
  if p_promo !~ '^[a-z0-9-]{2,40}$' or p_step not in ('view', 'click', 'landed', 'started', 'listen', 'heard')
     or p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$' then return false; end if;
  if p_cta is not null and p_cta !~ '^[a-z0-9-]{1,30}$' then p_cta := null; end if;
  if exists (select 1 from ve_promo_events where visitor = p_visitor and promo = p_promo and step = p_step
             and page is not distinct from left(p_page, 200) and created_at > now() - interval '30 minutes') then return false; end if;
  if (select count(*) from ve_promo_events where visitor = p_visitor and created_at > now() - interval '1 day') >= 300 then return false; end if;
  if p_vl is not null then
    select l.code into v_code from ve_link_clicks c join ve_links l on l.id = c.link_id where c.id = p_vl;
    if v_code is not null then v_channel := 'Link: ' || v_code; end if;
  end if;
  if p_listing is not null then select id into v_listing from listings where id = p_listing; end if;
  insert into ve_promo_events (promo, step, visitor, page, listing_id, cta, channel)
  values (p_promo, p_step, p_visitor, left(p_page, 200), v_listing, p_cta, v_channel);
  return true;
end $function$;

-- The podcast cuts on file today (the newest version of each, what HQ's podcast studio lists). Scripts written for a spot are kept as
-- written; the October spots had no stored script, so theirs is the stt transcript of the recording (script_source 'transcribed').
insert into public.ve_guide_commercials (guide_slug, guide_name, speaker, voice_id, cut, version, audio_path, seconds, checked, script_source) values
  ('vegan-dairy-guide', 'The Vegan Dairy Guide', 'Maya', 'sM8RysETdBj1LIqLd9tl', 'podcast', 4, 'media/podcast/commercials/dairy-guide-v4.mp3', null, null, 'transcribed'),
  ('airport-guide', 'The Airport Guide', 'Nori', 'rr9oBze1kuNJYeAV7xos', 'podcast', 4, 'media/podcast/commercials/airport-guide-v4.mp3', null, null, 'transcribed'),
  ('vegan-restaurant-guide', 'The Restaurant Guide', 'Liz', 'IUMUPi350HfIhyzUBJB3', 'podcast', 1, 'media/podcast/commercials/restaurant-guide-v1.mp3', null, null, 'transcribed'),
  ('stadium-arena-guide', 'The Stadium & Arena Guide', 'River', 'btaSeNTVh1pGx4pjFzub', 'podcast', 1, 'media/podcast/commercials/stadium-guide-v1.mp3', null, null, 'transcribed'),
  ('creator-guide', 'The Creator Guide', 'Kai', 'cgSgspJ2msm6clMCkdW9', 'podcast', 1, 'media/podcast/commercials/creator-guide-v1.mp3', null, null, 'transcribed'),
  ('nonprofit-guide', 'The Nonprofit Guide', 'Dani', 'b5RPB35vTODb3BEmR3Fc', 'podcast', 1, 'media/podcast/commercials/nonprofit-guide-v1.mp3', null, null, 'transcribed'),
  ('holiday-guide', 'The Holiday Guide', 'Theo', 'aFyw0oiXW7dzKF4o7woX', 'podcast', 1, 'media/podcast/commercials/holiday-guide-v1.mp3', 36.55, true, 'written')
on conflict (audio_path) do nothing;
update public.ve_guide_commercials set script = s.script from ve_pod_segments s
 where ve_guide_commercials.audio_path = s.audio_path and s.kind = 'commercial' and coalesce(s.script, '') <> '' and ve_guide_commercials.script is null;
-- Transcripts, lengths and the banner cuts are filled as they are made (the session's data steps, recorded in the playbook).
