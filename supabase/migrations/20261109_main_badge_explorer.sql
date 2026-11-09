-- ve-explorer-path (canon-ve-door-guides v10 amended): Explorer can be the main badge. 2026-11-09, Sean: "Explorer is a badge they earned.
-- If for some reason they want the Explorer to be their main badge, they can do that." A member picks any badge they hold. Until they pick,
-- the main badge is still their most recent path badge (Explorer is never picked for them). A badge the team took back cannot be picked.

create or replace function ve_member_badges(p_member uuid) returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select id, lower(btrim(email)) k, main_badge from members where id = p_member),
  role_q(tag, survey, q, fmt) as (values
    ('badge-restaurant', 'vegan-restaurant-guide', 'r_role', '%s'),
    ('badge-event-host', 'vegan-events-guide', 'e_role', '%s'),
    ('badge-creator', 'creator-guide', 'c_main', 'Creator on %s'),
    ('badge-nonprofit', 'nonprofit-guide', 'n_role', '%s')),
  held as (
    select t.slug key, t.name badge, t.color, pt.added_at at
    from me join ve_person_tags pt on pt.person_key = me.k and pt.removed_at is null
    join ve_tags t on t.slug = pt.tag_slug and t.kind = 'badge' and t.active),
  withrole as (
    select h.*, (select format(rq.fmt, o ->> 'label')
                 from role_q rq join ve_survey_answers a on a.member_id = p_member and a.survey_slug = rq.survey and a.question_id = rq.q
                 join ve_survey_questions q on q.survey_slug = a.survey_slug and q.id = a.question_id
                 cross join lateral jsonb_array_elements(q.options) o
                 where rq.tag = h.key and o ->> 'v' = a.value #>> '{}' limit 1) role,
           (select l.slug from listings l where l.owner_member_id = p_member and l.status = 'approved'
              and ((h.key = 'badge-restaurant' and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep'))
                or (h.key = 'badge-nonprofit' and l.category in ('Nonprofits', 'Rescues', 'Sanctuaries')))
            order by l.created_at limit 1) listing
    from held h),
  pick as (
    select coalesce(
      (select w.key from withrole w, me where w.key = me.main_badge),
      (select w.key from withrole w where w.key <> 'badge-explorer' order by w.at desc limit 1)) main)
  select coalesce((
    select jsonb_agg(jsonb_build_object('key', w.key, 'badge', w.badge, 'color', w.color, 'role', w.role, 'at', w.at, 'listing', w.listing,
                                        'explorer', w.key = 'badge-explorer', 'main', coalesce(w.key = (select main from pick), false)) order by w.at desc)
    from withrole w), '[]'::jsonb)
  || coalesce((
    select jsonb_agg(jsonb_build_object('key', cu.key, 'badge', cu.label, 'color', null, 'role', null, 'at', u.earned_at, 'main', false, 'explorer', false))
    from course_member_unlocks u join course_unlocks cu on cu.program_slug = u.program_slug and cu.key = u.key
    join course_programs pg on pg.slug = u.program_slug
    where u.member_id = p_member and cu.kind = 'badge' and pg.brand_slug = 'vegans-explore'), '[]'::jsonb);
$$;

create or replace function ve_member_badge_set_main(p_member uuid, p_key text) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_key is not null and not exists (select 1 from jsonb_array_elements(ve_member_badges(p_member)) b where b ->> 'key' = p_key and b ->> 'color' is not null) then
    return jsonb_build_object('ok', false, 'error', 'not_held');
  end if;
  update members set main_badge = p_key where id = p_member;
  return jsonb_build_object('ok', true, 'badges', ve_member_badges(p_member));
end $$;

revoke all on function ve_member_badge_set_main(uuid, text) from public, anon, authenticated;
