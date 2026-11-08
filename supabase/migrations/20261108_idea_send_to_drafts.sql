-- branddesk-production-wing M: Send an idea to a chapter's Daily Pulse or the podcast's news, as drafts (Logan, 2026-11-08).
-- Sean: "Drafts only; I approve each one."
--  * ve_pulse_features gains status (draft | live | discarded; every existing row is live) and idea_id. Only live features are
--    put into a Pulse (ve_pulse_features_apply). A draft from an idea waits in Depot > Ideas until Sean approves it.
--  * ve_pod_segments gains idea_id. A draft for the podcast is a proposed news segment on the next episode still in planning,
--    approved in BrandDesk > Podcast like every other segment.
alter table public.ve_pulse_features
  add column if not exists status text not null default 'live',
  add column if not exists idea_id uuid references public.ve_ideas(id),
  add column if not exists approved_at timestamptz;
alter table public.ve_pulse_features drop constraint if exists ve_pulse_features_status_check;
alter table public.ve_pulse_features add constraint ve_pulse_features_status_check check (status in ('draft','live','discarded'));
create index if not exists ve_pulse_features_idea on public.ve_pulse_features (idea_id);

alter table public.ve_pod_segments add column if not exists idea_id uuid references public.ve_ideas(id);

create or replace function public.ve_pulse_features_apply(p_post uuid default null::uuid)
 returns integer language plpgsql security definer set search_path to 'public' as $function$
declare n int := 0; r record; f record; h jsonb;
begin
  for r in select id, community_slug, briefing, auto_publish_at from ve_board_posts
    where kind = 'topic' and status = 'draft' and auto_publish_at is not null and briefing is not null
      and community_slug not like 'lr-%' and (p_post is null or id = p_post) and auto_publish_at > now() - interval '12 hours'
  loop
    for f in select * from ve_pulse_features
      where status = 'live'
        and (r.auto_publish_at at time zone 'America/New_York')::date between starts_on and ends_on
        and (communities is null or r.community_slug = any(communities)) order by created_at
    loop
      -- Never twice: not when it is already there, and not when the writer already wrote the same link as a story.
      if not exists (select 1 from jsonb_array_elements(coalesce(r.briefing->'stories','[]')) s
                     where s->>'feature_id' = f.id::text or (f.story->>'url' is not null and s->>'url' = f.story->>'url')) then
        r.briefing := jsonb_set(r.briefing, '{stories}', jsonb_build_array(f.story || jsonb_build_object('feature_id', f.id::text)) || coalesce(r.briefing->'stories','[]'));
        n := n + 1;
      end if;
    end loop;
    if p_post is not null then
      h := ve_pulse_house(r.community_slug, r.id, true);
      r.briefing := case when h is null then r.briefing - 'house' else jsonb_set(r.briefing, '{house}', h) end;
    elsif not (r.briefing ? 'house') then
      h := ve_pulse_house(r.community_slug, r.id, false);
      if h is not null then r.briefing := jsonb_set(r.briefing, '{house}', h); end if;
    end if;
    update ve_board_posts set briefing = r.briefing, updated_at = now() where id = r.id;
  end loop;
  return n;
end $function$;
