-- ve-chapter-rankings: podcast listener places on each "Where should we go next?" card (Sean, 2026-11-09).
-- Each open place carries the Captivate places that count for it (listen_match.places: {country, province?, cities?}) and the
-- names that count in ve_place_mentions (listen_match.mentions: "place" or "place|country", lower case). branddesk-insights
-- `next_places` (cron ve-next-places, daily) adds up all-time downloads across our four shows and writes ve_next_chapters.listens.
-- Read only: Captivate range calls, no paid calls. Safe to run twice.

alter table public.ve_next_chapters add column if not exists listen_match jsonb;
alter table public.ve_next_chapters add column if not exists listens jsonb;

update public.ve_next_chapters c set listen_match = m.v::jsonb from (values
 ('oregon', '{"places":[{"country":"US","province":"Oregon"}],"mentions":["oregon","portland|united states","eugene","salem|united states"]}'),
 ('las-vegas', '{"places":[{"country":"US","province":"Nevada","cities":["Las Vegas","Henderson","North Las Vegas","Paradise","Spring Valley","Enterprise","Summerlin South","Boulder City"]}],"mentions":["las vegas","henderson|united states"]}'),
 ('phoenix', '{"places":[{"country":"US","province":"Arizona","cities":["Phoenix","Scottsdale","Tempe","Mesa","Chandler","Gilbert","Glendale","Peoria","Surprise","Goodyear","Avondale","Queen Creek","Buckeye","Cave Creek","Fountain Hills","Paradise Valley","Sun City"]}],"mentions":["phoenix","scottsdale","tempe"]}'),
 ('houston', '{"places":[{"country":"US","province":"Texas","cities":["Houston","Spring","Katy","Sugar Land","The Woodlands","Pearland","Pasadena","Humble","Cypress","Tomball","League City","Missouri City","Baytown","Conroe","Friendswood","Kingwood","Richmond","Rosenberg","Bellaire","Stafford"]}],"mentions":["houston"]}'),
 ('north-carolina', '{"places":[{"country":"US","province":"North Carolina"}],"mentions":["north carolina","charlotte","raleigh","durham","asheville","greensboro"]}'),
 ('austin', '{"places":[{"country":"US","province":"Texas","cities":["Austin","Round Rock","Cedar Park","Pflugerville","Georgetown","Leander","Kyle","Buda","San Marcos","Lakeway","Bee Cave","Manor","Hutto"]}],"mentions":["austin|united states","austin"]}'),
 ('dublin', '{"places":[{"country":"IE","cities":["Dublin","Dun Laoghaire","Dún Laoghaire","Swords","Tallaght","Blanchardstown"]}],"mentions":["dublin|ireland","ireland"]}'),
 ('caribbean', '{"places":[{"country":"JM"},{"country":"PR"},{"country":"BS"},{"country":"BB"},{"country":"TT"},{"country":"DO"},{"country":"HT"},{"country":"CU"},{"country":"KY"},{"country":"VI"},{"country":"VG"},{"country":"AG"},{"country":"LC"},{"country":"VC"},{"country":"GD"},{"country":"DM"},{"country":"KN"},{"country":"AW"},{"country":"CW"},{"country":"SX"},{"country":"MQ"},{"country":"GP"},{"country":"BQ"},{"country":"TC"},{"country":"AI"},{"country":"MS"},{"country":"BL"},{"country":"MF"}],"mentions":["caribbean","the caribbean","jamaica","puerto rico","bahamas","barbados","trinidad and tobago","trinidad","dominican republic","haiti","cuba","st. lucia","saint lucia","grenada","aruba","curacao","curaçao","cayman islands","antigua","st. kitts","virgin islands"]}'),
 ('new-zealand', '{"places":[{"country":"NZ"}],"mentions":["new zealand","auckland","wellington","christchurch"]}'),
 ('japan', '{"places":[{"country":"JP"}],"mentions":["japan","tokyo","osaka","kyoto"]}'),
 ('seattle', '{"places":[{"country":"US","province":"Washington","cities":["Seattle","Bellevue","Redmond","Kirkland","Tacoma","Everett","Renton","Kent","Bothell","Lynnwood","Issaquah","Sammamish","Shoreline","Federal Way","Auburn","Burien","Tukwila","Mercer Island","Woodinville","Edmonds"]}],"mentions":["seattle","tacoma"]}'),
 ('san-francisco', '{"places":[{"country":"US","province":"California","cities":["San Francisco","Oakland","Berkeley","Daly City","South San Francisco","Alameda","San Mateo","Emeryville","Sausalito","Burlingame","San Bruno","Millbrae","Mill Valley","San Rafael","Richmond","El Cerrito","Albany","San Leandro","Pacifica","Redwood City","Palo Alto"]}],"mentions":["san francisco","bay area","oakland","berkeley"]}')
) as m(slug, v) where c.slug = m.slug and c.listen_match is null;

-- Mentions: each episode (ref) once, a name matching the mention's place, and its country when the name says one.
create or replace function public.ve_next_chapter_mentions(p_slug text) returns int
language sql stable security definer set search_path = public as $$
  select count(distinct coalesce(pm.ref, pm.id::text))::int
  from ve_next_chapters c
  cross join lateral jsonb_array_elements_text(coalesce(c.listen_match->'mentions','[]'::jsonb)) n
  join ve_place_mentions pm on lower(trim(pm.place)) = split_part(n, '|', 1)
    and (split_part(n, '|', 2) = '' or lower(coalesce(pm.country, '')) = split_part(n, '|', 2))
  where c.slug = p_slug;
$$;
revoke all on function public.ve_next_chapter_mentions(text) from public, anon, authenticated;
grant execute on function public.ve_next_chapter_mentions(text) to service_role;

drop function if exists public.ve_next_chapter_stats();
create function public.ve_next_chapter_stats()
returns table(slug text, name text, sub text, sort integer, votes bigint, voters bigint, downloads int, listen_top jsonb, listens_at timestamptz, mentions int)
language sql stable security definer set search_path to 'public' as $$
  select c.slug, c.name, c.sub, c.sort, coalesce(v.votes,0), coalesce(v.voters,0),
    (c.listens->>'downloads')::int, c.listens->'top', (c.listens->>'at')::timestamptz,
    ve_next_chapter_mentions(c.slug)
  from ve_next_chapters c
  left join (select place, count(*) votes, count(distinct member_id) voters from ve_next_chapter_votes group by place) v on v.place = c.slug
  where c.status = 'open';
$$;
revoke all on function public.ve_next_chapter_stats() from public, anon, authenticated;
grant execute on function public.ve_next_chapter_stats() to service_role;

-- Daily, 08:41 UTC (3:41 AM Eastern), after the night's downloads are in.
select cron.unschedule('ve-next-places') where exists (select 1 from cron.job where jobname = 've-next-places');
select cron.schedule('ve-next-places', '41 8 * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/branddesk-insights',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from lesaruss_secrets where key='CRON_SECRET')),
    body := '{"action":"next_places"}'::jsonb, timeout_milliseconds := 140000);
$$);
