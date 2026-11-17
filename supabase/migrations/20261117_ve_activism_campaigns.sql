-- Campaigns in the Vegan Activism Guide (Sean, 2026-11-16: "a campaign section that points out all the major campaigns being currently
-- run by different organizations... always keep a track of where people can go and support"). One row per campaign; the Guide reads
-- live and ended rows (#/campaigns); Logan adds and closes rows. Claims are the campaign's own, written as theirs, in the third person.
create table if not exists public.ve_activism_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  orgs text[] not null default '{}',          -- Directory listing names (cards found by name)
  summary text not null,                       -- what it asks, one or two sentences
  background text,                             -- the campaign's case, attributed to it
  actions jsonb not null default '[]',         -- [{label, detail, url}]
  hashtag text,
  starts_on date,
  ends_on date,
  status text not null default 'live' check (status in ('live','ended','draft')),
  spotlight boolean not null default false,
  source_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_activism_campaigns enable row level security;
drop policy if exists ve_activism_campaigns_read on public.ve_activism_campaigns;
create policy ve_activism_campaigns_read on public.ve_activism_campaigns for select to anon, authenticated using (status in ('live','ended'));
grant select on public.ve_activism_campaigns to anon, authenticated;

insert into public.ve_activism_campaigns (slug, title, orgs, summary, background, actions, hashtag, starts_on, status, spotlight, source_url, note)
values ('petco-prove-it', 'Petco: Prove It', array['True Cost Project','March for Animals','For Pete''s Sake'],
 'A national campaign asking Petco to live up to its "animals first" slogan and cut ties with Marshall BioResources, which the campaign calls the largest US breeder of dogs for experiments. Organizers say Chewy and PetSmart have already stepped back from Marshall, and that Petco is the last major chain still doing business with it.',
 'According to the campaign, recent USDA records show Marshall holding more than 15,000 dogs, nearly 14,000 ferrets, more than 2,100 mini pigs and more than 2,000 cats, and whistleblower evidence submitted this fall describes dogs killed in ways organizers say amount to felony animal abuse. Petco says Marshall Pet Products is a separate company; the campaign points to New York State records it says list the same CEO for both. The campaign launched with a weeklong protest encampment at Petco''s headquarters in San Diego starting November 16, with protests across the country.',
 '[{"label":"Comment on Petco''s posts","detail":"Comment on Petco''s five most recent Instagram posts, in your own words and respectfully, and end each comment with #PetcoProveIt.","url":"https://www.instagram.com/petco/"},
   {"label":"Email Petco","detail":"Ask Petco to cut ties with Marshall: customerrelations@petco.com","url":"mailto:customerrelations@petco.com?subject=Cut%20ties%20with%20Marshall%20BioResources"},
   {"label":"Call Petco","detail":"Petco customer relations: (858) 909-4665","url":"tel:+18589094665"},
   {"label":"Join a protest","detail":"Organizers are holding protests across the country. Follow them to find one in your city.","url":"https://www.instagram.com/truecostproject/"}]'::jsonb,
 '#PetcoProveIt', '2026-11-16', 'live', true, 'https://www.instagram.com/for.petes.sake.official/',
 'Sean, 2026-11-16: from For Pete''s Sake''s campaign post (screenshots). Spotlight (Sean: "one from Ella Majors that I want to spotlight").')
on conflict (slug) do nothing;

-- People behind a campaign (People page names, cards found by name; Sean, 2026-11-17: "their actual directory listings for the
-- organizations that are affiliated and the people that are affiliated").
alter table public.ve_activism_campaigns add column if not exists people text[] not null default '{}';
