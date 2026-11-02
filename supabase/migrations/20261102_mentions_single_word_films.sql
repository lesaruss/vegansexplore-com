-- Documentary titles may be one word (Sean, 2026-11-02: the episode on vegan documentary directors named Earthlings and
-- Cowspiracy, which the one-word rule dropped). Films are the only category that matches on one word; a wrong one is taken
-- off in Depot > In this story. Everything else is unchanged from 20261102_content_mentions.sql.
create or replace function ve_content_mentions_build(p_content_id uuid)
returns int
language plpgsql
security definer
set search_path = public
set statement_timeout = '120s'
as $$
declare
  a record;
  v_text text;
  v_raw text;
  -- Our four shows and the people who host them: their episodes sit on their own pages, so they are not "In this story".
  -- The brand's own listing too.
  c_skip constant text[] := array['vegans-explore-podcast', 'soflo-vegans-podcast', 'vegans-who-lift-podcast', 'pre-vegans-podcast',
                                  'john-thomas', 'brooke-sellers', 'sean-russell', 'vegans-explore'];
  -- Ordinary phrases that are also a listing's name (The TOP, Turning Point, Good Karma). Found by reading the matches, 2026-11-02.
  c_stop constant text[] := array['the top', 'turning point', 'good karma'];
  -- Hosts that are never a website to match on.
  c_social constant text[] := array['youtube.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'open.spotify.com', 'spotify.com',
                                    'podcasts.apple.com', 'apple.com', 'amazon.com', 'vegansexplore.com', 'lesaruss.com', 'lesaruss.ai'];
begin
  select p.id, p.slug, p.title, p.summary, p.body, p.podcast_show
    into a
    from ve_pulse_content p
   where p.id = p_content_id and p.status = 'published';
  if not found then
    delete from ve_content_mentions where content_id = p_content_id and status = 'shown';
    return 0;
  end if;

  -- The text as words: tags out, punctuation to spaces, lower case, padded so a name matches only as whole words.
  v_text := ' ' || trim(regexp_replace(regexp_replace(lower(coalesce(a.title, '') || ' ' || coalesce(a.summary, '') || ' ' || coalesce(a.body, '')),
                                                     '<[^>]*>', ' ', 'g'), '[^a-z0-9]+', ' ', 'g')) || ' ';
  v_raw := lower(coalesce(a.body, ''));

  create temp table if not exists mention_found (lid uuid, src text, matched text) on commit drop;
  delete from mention_found;

  -- (a) credit: a person credited on this episode, not as its host.
  insert into mention_found (lid, src, matched)
  select pc.listing_id, 'credit', coalesce(pc.role, 'Guest')
    from ve_person_credits pc
    join listings l on l.id = pc.listing_id
   where pc.content_id = a.id
     and coalesce(pc.role, '') <> 'Host'
     and l.status = 'approved'
     and l.slug <> all (c_skip);

  -- (b) link: the listing's website or Instagram linked in the article's own text.
  insert into mention_found (lid, src, matched)
  select l.id, 'link', coalesce(nullif(l.website, ''), l.instagram)
    from listings l
    left join lateral (
      select substring(regexp_replace(regexp_replace(lower(coalesce(l.instagram, '')), '^.*instagram\.com/', ''), '^@', '') from '^[a-z0-9._]+') as handle
    ) ig on true
   where l.status = 'approved'
     and l.slug <> all (c_skip)
     and (
       (coalesce(l.website, '') <> '' and length(regexp_replace(regexp_replace(lower(l.website), '^https?://(www\.)?', ''), '/.*$', '')) >= 8
         and regexp_replace(regexp_replace(lower(l.website), '^https?://(www\.)?', ''), '/.*$', '') <> all (c_social)
         and position(regexp_replace(regexp_replace(lower(l.website), '^https?://(www\.)?', ''), '/.*$', '') in v_raw) > 0)
       or
       (coalesce(l.instagram, '') <> '' and length(coalesce(ig.handle, '')) >= 3
         and position('instagram.com/' || ig.handle in v_raw) > 0)
     );

  -- (c) name: the full name, as whole words, two words or more, and not a stop phrase.
  insert into mention_found (lid, src, matched)
  select l.id, 'name', l.name
    from listings l
   where l.status = 'approved'
     and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'])
     and l.slug <> all (c_skip)
     and (array_length(regexp_split_to_array(trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g')), ' '), 1) >= 2
          or l.category = 'Documentaries & Films')
     and length(trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g'))) >= 7
     and trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g')) <> all (c_stop)
     and position(' ' || trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g')) || ' ' in v_text) > 0;

  -- One row a listing; the strongest reason wins (credit, then link, then name).
  insert into ve_content_mentions (content_id, listing_id, source, matched, status, updated_at)
  select distinct on (f.lid) a.id, f.lid, f.src, left(f.matched, 200), 'shown', now()
    from mention_found f
   order by f.lid, case f.src when 'credit' then 1 when 'link' then 2 else 3 end
  on conflict (content_id, listing_id) do update
     set source = excluded.source, matched = excluded.matched, updated_at = now()
   where ve_content_mentions.status = 'shown';

  -- A shown row the text no longer supports goes. Removed rows stay.
  delete from ve_content_mentions m
   where m.content_id = a.id and m.status = 'shown'
     and not exists (select 1 from mention_found f where f.lid = m.listing_id);

  insert into ve_content_mention_runs (content_id, built_at, found)
  values (a.id, now(), (select count(*) from mention_found))
  on conflict (content_id) do update set built_at = excluded.built_at, found = excluded.found;

  return (select count(*)::int from ve_content_mentions where content_id = a.id and status = 'shown');
end;
$$;

-- Rebuild every article once so the new rule applies now (the sweep builds what is due).
update ve_content_mention_runs set built_at = now() - interval '2 days';
