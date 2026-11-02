-- Earn your Passport, part 5: the business offer and its two-day follow-up, and the not-ready-yet emails for Tasters (Sean,
-- 2026-11-01: "Approved, go with your defaults and build it"; canon canon-ve-earn-your-passport; edge function ve-nurture).
-- Both are off until Sean turns them on (ve_site_settings nurture: offers_on, tasters_on). Safe to run twice.
--
-- Logan's defaults, Sean's to change: every email from VEGANS EXPLORE <hello@vegansexplore.com>, signed Vegans Explore team, replies
-- to contact@lesaruss.com, never Sean's name; sent from 10 AM Eastern; the business follow-up two days after the offer (weekdays);
-- Tasters on Day 3, 7 and 14 after they joined, then the Daily Pulse every Thursday (never two in six days), and in December three
-- notes on the Founding deadline (the 1st, 18th and 30th). Paying, earning a membership or stopping our emails ends the track.

create table if not exists public.ve_pc_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  email text not null,
  name text,
  code text not null unique,
  link_id uuid references public.ve_links(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'chosen', 'routed', 'stopped')),
  sent_at timestamptz,
  followup_kind text check (followup_kind in ('not_opened', 'opened')),
  followup_at timestamptz,
  chosen_at timestamptz,
  routed_at timestamptz,
  stopped_at timestamptz,
  send_ids jsonb not null default '{}',
  test boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ve_pc_offers_status on public.ve_pc_offers (status, sent_at);
alter table public.ve_pc_offers enable row level security;

create table if not exists public.ve_taster_emails (
  id uuid primary key default gen_random_uuid(),
  taster_id uuid not null references public.ve_tasters(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  error text,
  unique (taster_id, kind)
);
create index if not exists ve_taster_emails_sent on public.ve_taster_emails (taster_id, sent_at desc);
alter table public.ve_taster_emails enable row level security;

insert into public.ve_site_settings (key, value)
values ('nurture', jsonb_build_object('offers_on', false, 'tasters_on', false, 'send_hour', 10, 'per_tick', 40))
on conflict (key) do nothing;

-- What is on in a chapter: the next two weeks of events, places new to the Directory, and the latest Daily Pulse topic.
create or replace function public.ve_nurture_city_week(p_chapter text)
 returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select jsonb_build_object(
    'events', coalesce((select jsonb_agg(e order by e.starts_at) from (
      select id, title, starts_at, city from events
      where tenant_id = '00000000-0000-4000-a000-000000000002' and status = 'approved' and coalesce(listing_kind, 'event') = 'event'
        and starts_at between now() and now() + interval '14 days' and ve_chapter_of(city, state) = p_chapter
      order by starts_at limit 3) e), '[]'::jsonb),
    'places', coalesce((select jsonb_agg(p) from (
      select name, slug, address_city as city from listings
      where status = 'approved' and vegan_status in ('fully_vegan', 'vegan') and created_at >= now() - interval '30 days'
        and ve_chapter_of(address_city, address_state) = p_chapter
        and not (coalesce(tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate'])
      order by created_at desc limit 3) p), '[]'::jsonb),
    'topic', (select jsonb_build_object('id', id, 'title', title, 'community', community_slug) from ve_board_posts
      where kind = 'topic' and status = 'open' and published_at is not null and community_slug in (p_chapter, 'national')
      order by (community_slug = p_chapter) desc, published_at desc limit 1));
$$;

-- An episode that fits what brought them here.
create or replace function public.ve_nurture_story(p_why text)
 returns jsonb language sql stable security definer set search_path to 'public'
as $$
  with words as (select case p_why
      when 'food' then '(restaurant|chef|food|cook|recipe)'
      when 'going' then '(transition|journey|going vegan|new vegan|beginner|switch)'
      when 'vegan' then '(community|movement|activis|culture)'
      when 'animals' then '(animal|sanctuary|rescue|nonprofit)'
      when 'business' then '(business|entrepreneur|founder|brand|startup)'
      when 'creator' then '(creator|content|youtube|podcast|social media)'
      else '(vegan)' end as rx)
  select to_jsonb(x) from (
    select c.slug, c.title, left(coalesce(c.summary, ''), 220) as summary, c.podcast_show as show
    from ve_pulse_content c, words
    where c.status = 'published' and c.podcast_show is not null and (c.title ~* words.rx or coalesce(c.summary, '') ~* words.rx)
    order by c.published_at desc nulls last limit 1) x;
$$;

-- This week's Daily Pulse topics in a chapter (and the national one).
create or replace function public.ve_nurture_pulse(p_chapter text)
 returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select coalesce(jsonb_agg(t order by t.published_at desc), '[]'::jsonb) from (
    select id, title, community_slug as community, published_at from ve_board_posts
    where kind = 'topic' and status = 'open' and published_at >= now() - interval '7 days' and community_slug in (p_chapter, 'national')
    order by published_at desc limit 5) t;
$$;

revoke all on function public.ve_nurture_city_week(text) from public, anon, authenticated;
revoke all on function public.ve_nurture_story(text) from public, anon, authenticated;
revoke all on function public.ve_nurture_pulse(text) from public, anon, authenticated;

-- An offer nobody answered lands in the Inbox for the chapter's Community Manager (status routed).
do $do$
declare def text;
begin
  select pg_get_functiondef('public.ve_inbox_items'::regproc) into def;
  if position('pc_offer' in def) = 0 then
    def := replace(def, '  order by 3 desc;', $u$  union all
  select 'pc_offer', o.id, o.routed_at, 'Passport Challenge offer: no answer', l.name,
    'Offered ' || to_char(o.sent_at at time zone 'America/New_York', 'Mon DD') || ', followed up, no application yet',
    null, o.name, o.email, ve_chapter_of(l.address_city, l.address_state), '/admin/depot/challenge-stops#offers/routed'
  from ve_pc_offers o join listings l on l.id = o.listing_id
  where o.status = 'routed' and o.routed_at >= p_since and not o.test
  order by 3 desc;$u$);
    execute def;
  end if;
end $do$;

-- Every 15 minutes; ve-nurture sends only inside its hours and only while a switch is on.
select cron.unschedule('ve-nurture') where exists (select 1 from cron.job where jobname = 've-nurture');
select cron.schedule('ve-nurture', '*/15 * * * *', $$select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-nurture',
  headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
  body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 60000)$$);
