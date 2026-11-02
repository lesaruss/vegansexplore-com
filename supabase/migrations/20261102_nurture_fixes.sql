-- Earn your Passport emails, Sean's review of the tests (2026-11-01: "go").
-- 1. Day 7 links the episode on its podcast's own listing (vote and save), so the story must be an episode matched to a show listing.
-- 2. The weekly Daily Pulse email is opt-in: only Tasters who tapped "Yes, send it" in the Day 14 email get it.
alter table public.ve_tasters add column if not exists pulse_opt_in_at timestamptz;

create or replace function public.ve_nurture_story(p_why text)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  with words as (select case p_why
      when 'food' then '(restaurant|chef|food|cook|recipe)'
      when 'going' then '(transition|journey|going vegan|new vegan|beginner|switch)'
      when 'vegan' then '(community|movement|activis|culture)'
      when 'animals' then '(animal|sanctuary|rescue|nonprofit)'
      when 'business' then '(business|entrepreneur|founder|brand|startup)'
      when 'creator' then '(creator|content|youtube|podcast|social media)'
      else '(vegan)' end as rx)
  select to_jsonb(x) from (
    select c.slug, c.title, left(coalesce(c.summary, ''), 220) as summary, c.podcast_show as show,
           l.slug as show_slug, l.name as show_name, m.guid
    from ve_pulse_content c
    join ve_pulse_episode_map m on m.content_id = c.id and m.guid is not null
    join listings l on l.id = m.show_listing_id and l.status = 'approved'
    cross join words
    where c.status = 'published' and c.podcast_show is not null and (c.title ~* words.rx or coalesce(c.summary, '') ~* words.rx)
    order by c.published_at desc nulls last limit 1) x;
$function$;
