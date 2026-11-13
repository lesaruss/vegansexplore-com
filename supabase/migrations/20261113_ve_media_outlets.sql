-- Media outlets for PR (Sean, 2026-11-13): "collect all the media outlets into one location. I don't necessarily want
-- to put them on the directory, public facing... we still treat them like they're directory listings, but not everyone,
-- we can designate which ones we want to have facing the public." Filled from the Google Alert - Vegan emails in the
-- srussell@lesaruss.com inbox (since 2026-01-01) and the News Desk (ve_news_leads), each article scored for how it
-- treats the Vegan community. Private by default: no anon or authenticated policies; is_public marks the ones Sean
-- chooses to show later. Also a BrandDesk PR service later (brand_slug per client).

create table if not exists public.ve_media_outlets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text not null unique,
  website text,
  kind text,            -- newspaper, magazine, tv_radio, digital_news, blog, trade, student, advocacy, wire, other
  scope text,           -- national, local, international, vegan_niche
  region text,          -- city / state / country when local
  brand_slug text not null default 'vegans-explore',
  is_public boolean not null default false,
  articles_count int not null default 0,
  flattering_count int not null default 0,
  neutral_count int not null default 0,
  critical_count int not null default 0,
  stance_score int,     -- -100 (all critical) to 100 (all flattering)
  stance_label text,    -- ally, friendly, balanced, mixed, critical
  topics text[] not null default '{}',
  first_seen date,
  last_seen date,
  notes text,           -- written by the rollup: the critical (and top flattering) pieces
  team_notes text,      -- ours, never overwritten
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ve_media_coverage (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references public.ve_media_outlets(id) on delete cascade,
  url text not null unique,
  title text not null,
  snippet text,
  source_name text,
  published_on date,
  origin text not null check (origin in ('google_alert', 'news_desk')),
  gmail_message_id text,
  news_lead_id uuid,
  stance text check (stance in ('flattering', 'neutral', 'critical')),
  topic text,
  stance_reason text,
  scored_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_media_coverage_outlet on public.ve_media_coverage (outlet_id);
create index if not exists ve_media_coverage_unscored on public.ve_media_coverage (created_at) where scored_at is null;

alter table public.ve_media_outlets enable row level security;
alter table public.ve_media_coverage enable row level security;

-- Counts, score, label, topics and notes per outlet, from its scored coverage.
create or replace function public.ve_media_outlets_rollup() returns int language sql security definer set search_path = public as $$
  with c as (
    select outlet_id,
      count(*) n,
      count(*) filter (where stance = 'flattering') f,
      count(*) filter (where stance = 'neutral') u,
      count(*) filter (where stance = 'critical') k,
      min(published_on) a, max(published_on) b
    from ve_media_coverage where outlet_id is not null group by 1
  ), t as (
    select outlet_id, array_agg(topic order by n desc) topics from (
      select outlet_id, topic, count(*) n, row_number() over (partition by outlet_id order by count(*) desc) r
      from ve_media_coverage where topic is not null group by 1, 2) x where r <= 3 group by 1
  ), notes as (
    select outlet_id, string_agg(line, E'\n' order by ord, d desc) txt from (
      select outlet_id, 1 ord, published_on d,
        'Critical, ' || coalesce(to_char(published_on, 'YYYY-MM-DD'), 'undated') || ': ' || title ||
        coalesce(' (' || stance_reason || ')', '') || ' ' || url line,
        row_number() over (partition by outlet_id order by published_on desc nulls last) r
      from ve_media_coverage where stance = 'critical'
      union all
      select outlet_id, 2, published_on,
        'Flattering, ' || coalesce(to_char(published_on, 'YYYY-MM-DD'), 'undated') || ': ' || title || ' ' || url,
        row_number() over (partition by outlet_id order by published_on desc nulls last)
      from ve_media_coverage where stance = 'flattering'
    ) z where r <= 5 group by 1
  ), up as (
    update ve_media_outlets o set
      articles_count = c.n, flattering_count = c.f, neutral_count = c.u, critical_count = c.k,
      stance_score = case when c.f + c.u + c.k > 0 then round(100.0 * (c.f - c.k) / (c.f + c.u + c.k)) end,
      stance_label = case
        when c.f + c.u + c.k = 0 then null
        when c.k > 0 and c.k >= c.f then 'critical'
        when c.k > 0 and c.k * 3 >= c.f then 'mixed'
        when 100.0 * (c.f - c.k) / (c.f + c.u + c.k) >= 60 then 'ally'
        when 100.0 * (c.f - c.k) / (c.f + c.u + c.k) >= 20 then 'friendly'
        else 'balanced' end,
      topics = coalesce(t.topics, '{}'), first_seen = c.a, last_seen = c.b,
      notes = notes.txt, updated_at = now()
    from c left join t using (outlet_id) left join notes using (outlet_id)
    where o.id = c.outlet_id
    returning 1
  ) select count(*)::int from up;
$$;
revoke all on function public.ve_media_outlets_rollup() from public, anon, authenticated;
