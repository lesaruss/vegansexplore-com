-- ve-podcast-studio: episode pages as a discovery engine (Sean, 2026-11-08: "anybody mentioned, any organizations... we should
-- automatically [show them]... any city that's brought up here, we put them in a holding pattern... use this as a model").
--
-- 1. ve_episode_notes: one row per podcast episode (Directory listing of the show + feed guid) with its structured show notes:
--    a short summary, sections (each with its Guide and its stories, each story with the Directory listings, chapters and held
--    places it mentions), everything mentioned, the places, and episodes to keep listening to. Read publicly through
--    ve_episode_notes_get (security definer), drawn by public/ve-episodes.js. Held mentions (not in the Directory yet) are
--    {held: {name, category, line, place}}.
-- 2. ve_place_mentions: every time a place that is not one of our chapters comes up (news, the podcast, a request, analytics).
--    The first rows of the chapter rankings Sean asked for; the rankings page itself is its own build.
-- 3. Episode 145's notes, and the Directory entries it names: Rich Roll's People profile (the May import's row, promoted),
--    Vegconomist (News Outlets), and two held for places we are not in yet (The Vegan Society of Aotearoa New Zealand,
--    De Nieuwe Melkboer): quarantined, tag ve-held-place.

create table if not exists public.ve_episode_notes (
  listing_id uuid not null references public.listings(id) on delete cascade,
  guid text not null,
  notes jsonb not null default '{}'::jsonb,
  status text not null default 'live' check (status in ('draft','live')),
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (listing_id, guid)
);
alter table public.ve_episode_notes enable row level security;

create or replace function public.ve_episode_notes_get(p_listing uuid, p_guid text)
returns jsonb language sql stable security definer set search_path = public as $$
  select notes from public.ve_episode_notes where listing_id = p_listing and guid = p_guid and status = 'live'
$$;
revoke all on function public.ve_episode_notes_get(uuid, text) from public;
grant execute on function public.ve_episode_notes_get(uuid, text) to anon, authenticated, service_role;

create table if not exists public.ve_place_mentions (
  id uuid primary key default gen_random_uuid(),
  place text not null,
  country text,
  kind text not null check (kind in ('news','podcast','pulse','request','analytics','other')),
  source text,
  ref text,
  note text,
  created_at timestamptz not null default now(),
  unique (place, kind, ref)
);
alter table public.ve_place_mentions enable row level security;

insert into public.ve_place_mentions (place, country, kind, source, ref, note) values
 ('Denver', 'United States', 'podcast', 'Vegans Explore Podcast 145', 'vep:902d9d96-bfd3-49b6-ab13-31e91b1365f3', 'Denver votes to ban foie gras (Sentient Media)'),
 ('New Zealand', 'New Zealand', 'podcast', 'Vegans Explore Podcast 145', 'vep:902d9d96-bfd3-49b6-ab13-31e91b1365f3', 'The Vegan Society of Aotearoa New Zealand names its first Vegan Impact Award winners (Vegconomist)'),
 ('Netherlands', 'Netherlands', 'podcast', 'Vegans Explore Podcast 145', 'vep:902d9d96-bfd3-49b6-ab13-31e91b1365f3', 'De Nieuwe Melkboer wins Compassion in World Farming''s first Plant Based Leadership Award (Vegconomist)')
on conflict do nothing;

-- Rich Roll: the May Instagram import's row (set aside 2026-11-08 as "already in the Directory", since the podcast is) becomes his
-- People profile, in a family with The Rich Roll Podcast.
update public.listings set
  slug = 'rich-roll', name = 'Rich Roll', category = 'Athletes', extra_categories = array['Content Creators'],
  status = 'approved', vegan_status = null, communities = array['all'], location = 'Online', specialty = coalesce(specialty, ''),
  instagram = 'https://instagram.com/richroll', website = 'https://richroll.com/', crawl_source = 'people',
  description = 'Rich Roll is an ultra-endurance athlete, author of Finding Ultra, and host of The Rich Roll Podcast, where he talks with leading voices in health, fitness, nutrition and the plant-based life.',
  details = (coalesce(details, '{}'::jsonb) - 'backlog' - 'status_before_hidden')
    || jsonb_build_object('family', 'rich-roll',
         'person', jsonb_build_object('title', 'Ultra-endurance athlete, author and podcast host', 'added', 'Vegans Explore Podcast 145, 2026-11-08'),
         'admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
            'text', 'Made his People profile (named on Vegans Explore Podcast 145)')))
where id = '03398cd3-d25c-47b0-898f-3e9968f866d9' and status <> 'approved';

update public.listings set details = coalesce(details, '{}'::jsonb) || '{"family":"rich-roll"}'::jsonb
where slug = 'the-rich-roll-podcast' and status = 'approved';

insert into public.listings (slug, name, category, specialty, description, location, status, vegan_status, communities, website, crawl_source, details)
select 'vegconomist', 'vegconomist', 'News Outlets', '', 'vegconomist is a business magazine on the plant-based and alternative protein industry: companies, products, investment and the people behind them.',
  'Online', 'approved', null, array['all'], 'https://vegconomist.com/', 'episode-notes',
  jsonb_build_object('admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Added as a source on Vegans Explore Podcast 145')))
where not exists (select 1 from public.listings where slug = 'vegconomist');

insert into public.listings (slug, name, category, specialty, description, location, status, vegan_status, communities, tags, crawl_source, details)
select v.slug, v.name, v.cat, '', v.descr, v.place, 'quarantined', null, array[]::text[], array['ve-held-place'], 'episode-notes',
  jsonb_build_object('held', jsonb_build_object('place', v.place, 'from', 'Vegans Explore Podcast 145'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Held for ' || v.place || ' until we open a community there (named on Vegans Explore Podcast 145)')))
from (values
  ('vegan-society-of-aotearoa-new-zealand', 'The Vegan Society of Aotearoa New Zealand', 'Nonprofits', 'New Zealand',
   'The Vegan Society of Aotearoa New Zealand, which named the first winners of its Vegan Impact Awards in November 2026.'),
  ('de-nieuwe-melkboer', 'De Nieuwe Melkboer', 'Food Brands', 'Netherlands',
   'A Dutch dairy farm turned soy yogurt maker, winner of Compassion in World Farming''s first Plant Based Leadership Award in 2026.')
) as v(slug, name, cat, place, descr)
where not exists (select 1 from public.listings x where x.slug = v.slug);

-- Episode 145's notes.
insert into public.ve_episode_notes (listing_id, guid, updated_by, notes) values
('fdcf4960-0ead-4a85-9433-b555d7674730', '902d9d96-bfd3-49b6-ab13-31e91b1365f3', 'Logan', $json$
{
  "number": 145,
  "summary": "D.C. and Denver ban foie gras, London's Vegan Michelin-starred restaurant, Rich Roll's marathon at 60, and Jane Velez-Mitchell on how UnchainedTV began.",
  "sections": [
    {"key": "top", "title": "Top stories", "guide": "kai", "role": "The Creator Guide", "stories": [
      {"title": "Washington, D.C. and Denver vote to ban foie gras", "source": "Sentient Media", "url": "https://sentientmedia.org/denver-and-d-c-have-voted-to-ban-foie-gras/",
       "listings": ["sentient-media"], "chapters": ["washington-dc"], "held": ["Denver"]},
      {"title": "Plates, England's only Vegan Michelin-starred restaurant", "source": "VegNews", "url": "https://vegnews.com/plates-london-restaurant-review",
       "listings": ["plates", "vegnews-magazine"], "chapters": ["london"]}
    ]},
    {"key": "directory", "title": "What's new in the Directory", "guide": "liz", "role": "The Business Guide",
     "body": "120 new listings went live this week. This week's spotlight is UnchainedTV, the free Vegan streaming network founded by Jane Velez-Mitchell.",
     "listings": ["unchained_tv", "jane-velez-mitchell"], "more": {"label": "See what's new in the Directory", "href": "/directory"}},
    {"key": "community", "title": "From the community", "guide": "dani", "role": "The Community Guide", "stories": [
      {"title": "Rich Roll finishes the New York City Marathon at 60", "source": "Plant Based News", "url": "https://plantbasednews.org/culture/sport/rich-roll-new-york-city-marathon/",
       "listings": ["rich-roll", "plant-based-news"], "chapters": ["new-york"]},
      {"title": "The Vegan Society of Aotearoa New Zealand names its first Vegan Impact Award winners", "source": "vegconomist", "url": "https://vegconomist.com/fairs-events/nz-vegan-society-turns-awards-programme-products-to-people/",
       "listings": ["vegan-society-of-aotearoa-new-zealand", "vegconomist"], "held": ["New Zealand"]}
    ]},
    {"key": "world", "title": "Around the world", "guide": "nori", "role": "The Traveler Guide", "stories": [
      {"title": "Burger King UK gives away 250,000 plant-based Royales for World Vegan Month", "source": "Plant Based News", "url": "https://plantbasednews.org/lifestyle/food/burger-king-uk-plant-based-royales/",
       "listings": ["plant-based-news"], "chapters": ["london"]},
      {"title": "De Nieuwe Melkboer wins Compassion in World Farming's first Plant Based Leadership Award", "source": "vegconomist", "url": "https://vegconomist.com/food-and-beverage/milk-and-dairy-alternatives/dutch-dairy-farm-turned-soy-yogurt-maker-wins-ciwfs-first-plant-based-leadership-award/",
       "listings": ["compassion-in-world-farming", "de-nieuwe-melkboer", "vegconomist"], "held": ["Netherlands"]}
    ]},
    {"key": "guides", "title": "Our Guides", "guide": "maya", "role": "The Pre-Vegans Guide",
     "body": "New here? Start with the Explorer Guide, a quick tour of everything you can do with Vegans Explore. Join before January 1, 2027 and you are a Founding Member for good.",
     "button": {"label": "Open the Explorer Guide", "href": "/passport"}}
  ],
  "mentions": ["jane-velez-mitchell", "rich-roll", "unchained_tv", "plates", "compassion-in-world-farming", "vegan-society-of-aotearoa-new-zealand",
               "de-nieuwe-melkboer", "the-rich-roll-podcast", "sentient-media", "vegnews-magazine", "plant-based-news", "vegconomist"],
  "chapters": ["washington-dc", "london", "new-york"],
  "held": ["Denver", "New Zealand", "Netherlands"],
  "held_listings": {
    "vegan-society-of-aotearoa-new-zealand": {"name": "The Vegan Society of Aotearoa New Zealand", "category": "Nonprofits", "line": "Nonprofit · New Zealand", "place": "New Zealand"},
    "de-nieuwe-melkboer": {"name": "De Nieuwe Melkboer", "category": "Food Brands", "line": "Food brand · Netherlands", "place": "the Netherlands"}
  },
  "listen": [
    {"show": "vegans-explore-podcast", "listing_id": "fdcf4960-0ead-4a85-9433-b555d7674730", "guid": "7e6b8dab-85ce-43f0-87ac-3bd10d147cfc", "why": "Goes with the Plates story: how Vegan fine dining earned its stars."},
    {"show": "vegans-explore-podcast", "listing_id": "fdcf4960-0ead-4a85-9433-b555d7674730", "guid": "3d36a143-e014-4059-915d-d61c70e6cb04", "why": "Jane Velez-Mitchell's full conversation with Sean on how UnchainedTV began."}
  ]
}
$json$::jsonb)
on conflict (listing_id, guid) do update set notes = excluded.notes, updated_at = now(), updated_by = excluded.updated_by;
