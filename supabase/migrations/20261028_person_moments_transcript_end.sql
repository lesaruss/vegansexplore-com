-- People pages play podcasts as audio only (Sean, 2026-10-28: "let's just keep it simple and only have the audio"). A moment from
-- the content index is timed on the YouTube transcript, so the page plays it from the episode's audio only when the audio runs the
-- same length (transcript_end within 15 s of the feed's duration). ve_person_moments returns the transcript's last second for that.
drop function if exists public.ve_person_moments(uuid);
create function public.ve_person_moments(p_listing uuid)
 returns table(start_s numeric, end_s numeric, quote text, summary text, title text, youtube_id text, slug text, transcript_end numeric)
 language sql stable security definer set search_path to 'public'
as $function$
  with p as (
    select l.id, coalesce(
      (select array_agg(lower(x)) from jsonb_array_elements_text(l.details -> 'person' -> 'speaker_names') x),
      array[lower(regexp_replace(btrim(regexp_replace(l.name, '\s*\(.*\)\s*', '', 'g')), '^.*\s', ''))]) as names
    from listings l where l.id = p_listing and l.status = 'approved'
  ), ranked as (
    select m.start_s, m.end_s, m.quote, m.summary, m.title, m.youtube_id, m.slug, m.content_id,
      row_number() over (partition by m.content_id order by m.end_s - m.start_s desc) as rn
    from p join ve_person_credits c on c.listing_id = p.id and c.kind = 'episode'
    join ve_content_moments_live m on m.content_id = c.content_id
    where exists (select 1 from unnest(p.names) n where length(n) > 2 and position(n in lower(m.speaker)) > 0)
  )
  select r.start_s, r.end_s, r.quote, r.summary, r.title, r.youtube_id, r.slug,
    (select round(max((s ->> 'e')::numeric)) from ve_content_transcripts t, jsonb_array_elements(t.segments) s where t.content_id = r.content_id)
  from ranked r where r.rn <= 3 order by r.content_id, r.start_s limit 9;
$function$;
grant execute on function public.ve_person_moments(uuid) to anon, authenticated;
