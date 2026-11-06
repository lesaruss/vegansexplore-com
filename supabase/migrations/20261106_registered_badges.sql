-- ve-events-guide: step 6 of the membership rule, the Registered badges (canon-ve-door-guides v6 membership_rule_v6; names approved by
-- Sean 2026-11-06: the badge names the intake, the member's role sits under it). One badge per finished business intake.
-- ve_member_badges(member) -> [{key, badge, role, at}], newest first. Service role only; ve-dashboard (home, member_card) and
-- ve_person_badges (a People profile linked to a member) read it. Safe to run twice.

create or replace function public.ve_member_badges(p_member uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with b(survey, key, badge, q, fmt) as (values
    ('vegan-restaurant-guide', 'restaurant', 'Registered restaurant', 'r_role', '%s'),
    ('vegan-events-guide', 'event_host', 'Registered event host', 'e_role', '%s'),
    ('creator-guide', 'creator', 'Registered creator', 'c_main', 'Creator on %s'),
    ('nonprofit-guide', 'nonprofit', 'Registered nonprofit', 'n_role', '%s'))
  select coalesce(jsonb_agg(jsonb_build_object('key', b.key, 'badge', b.badge, 'role', r.role, 'at', c.completed_at) order by c.completed_at desc), '[]'::jsonb)
  from b
  join ve_survey_completions c on c.member_id = p_member and c.survey_slug = b.survey
  left join lateral (
    select format(b.fmt, o ->> 'label') as role
    from ve_survey_answers a join ve_survey_questions q on q.survey_slug = a.survey_slug and q.id = a.question_id
    cross join lateral jsonb_array_elements(q.options) o
    where a.member_id = p_member and a.survey_slug = b.survey and a.question_id = b.q and o ->> 'v' = a.value #>> '{}'
    limit 1) r on true;
$$;
revoke all on function public.ve_member_badges(uuid) from public, anon, authenticated;

-- A People profile shows its member's badges (details.person.member_id); anyone may read them, since the profile itself is public.
create or replace function public.ve_person_badges(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(public.ve_member_badges((l.details -> 'person' ->> 'member_id')::uuid), '[]'::jsonb)
  from listings l where l.id = p_listing and l.status = 'approved' and (l.details -> 'person' ->> 'member_id') ~ '^[0-9a-f-]{36}$';
$$;
revoke all on function public.ve_person_badges(uuid) from public;
grant execute on function public.ve_person_badges(uuid) to anon, authenticated;
