-- Door Guides, step 1 (Sean, 2026-11-02 lock, canon canon-ve-door-guides): the Vegan Events Guide is free with an email.
-- A door Guide's members-only screens open to a Taster key (ve-guide-unlock); the email is one field (ve-taster guide_join);
-- recording a host story needs an approved event claim or the Passport (ve-events-guide story_start). Rules on every clip:
-- 18 and over, 90 seconds. Measures for the first 30 days: ve_door_guide_stats().
alter table public.ve_guides add column if not exists door boolean not null default false;
update public.ve_guides set door = true where slug = 'vegan-events-guide';

alter table public.ve_tasters add column if not exists door_guides text[] not null default '{}';

alter table public.ve_event_host_stories add column if not exists kind text not null default 'host_notes';
alter table public.ve_event_host_stories add column if not exists claimed boolean not null default false;
alter table public.ve_event_host_stories add column if not exists adult_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 've_event_host_stories_kind_check') then
    alter table public.ve_event_host_stories add constraint ve_event_host_stories_kind_check
      check (kind in ('host_notes', 'question_of_month', 'my_story', 'good_news', 'struggling'));
  end if;
end $$;

-- The first 30 days: emails per Guide, Taster to Passport, clips sent and aired.
create or replace function public.ve_door_guide_stats(p_from timestamptz default now() - interval '30 days')
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'guide'), '[]'::jsonb) from (
    select jsonb_build_object(
      'guide', g.slug,
      'emails', (select count(*) from ve_tasters t where g.slug = any(t.door_guides) and t.created_at >= p_from),
      'confirmed', (select count(*) from ve_tasters t where g.slug = any(t.door_guides) and t.created_at >= p_from and t.confirmed_at is not null),
      'became_members', (select count(*) from ve_tasters t where g.slug = any(t.door_guides) and t.created_at >= p_from and t.member_id is not null),
      'clips_sent', (select count(*) from ve_event_host_stories s where g.slug = 'vegan-events-guide' and s.created_at >= p_from),
      'clips_aired', (select count(*) from ve_event_host_stories s where g.slug = 'vegan-events-guide' and s.created_at >= p_from and s.status = 'approved' and s.published)
    ) as x from ve_guides g where g.door
  ) q;
$$;
revoke all on function public.ve_door_guide_stats(timestamptz) from public, anon, authenticated;
grant execute on function public.ve_door_guide_stats(timestamptz) to service_role;
