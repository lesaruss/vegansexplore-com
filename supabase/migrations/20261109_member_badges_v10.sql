-- ve-explorer-path step 6 (canon-ve-door-guides v10, explorer_badges_v10): badges on profiles and as tags. 2026-11-09.
-- Every badge is a ve_person_tags tag on the member's email (person_key), with its color on ve_tags. Finishing an intake adds it (source rule);
-- the team takes one back with ve_tag_remove (kept as history, never re-added by the rule; a hand add puts it back). Explorer is a badge
-- but never the main badge and never on cards. The member picks the main badge (members.main_badge); default the most recent path badge.

insert into ve_tags (slug, name, kind, color, description, active) values
  ('badge-explorer',     'Explorer',                    'badge', '#2D5C27', 'Finished the Explorer survey.', true),
  ('badge-restaurant',   'Registered restaurant',       'badge', '#C2410C', 'Finished the Vegan Restaurant Guide intake.', true),
  ('badge-event-host',   'Registered event host',       'badge', '#7C3AED', 'Finished the Vegan Events Guide intake.', true),
  ('badge-creator',      'Registered creator',          'badge', '#DB2777', 'Finished the Creator Guide intake.', true),
  ('badge-nonprofit',    'Registered nonprofit',        'badge', '#0E7490', 'Finished the Nonprofit Guide intake.', true),
  ('badge-business',     'Registered business',         'badge', '#B45309', 'Finished the Pre-Vegan Business Guide intake.', true),
  ('badge-ambassador',   'Ambassador',                  'badge', '#1D4ED8', 'An Ambassador, by invitation.', true)
on conflict (slug) do update set name = excluded.name, kind = excluded.kind, color = excluded.color, description = excluded.description, active = true;

alter table members add column if not exists main_badge text;

-- Which intake gives which badge.
create or replace function ve_badge_for_survey(p_survey text) returns text language sql immutable as $$
  select case p_survey
    when 'explorer' then 'badge-explorer'
    when 'vegan-restaurant-guide' then 'badge-restaurant'
    when 'vegan-events-guide' then 'badge-event-host'
    when 'creator-guide' then 'badge-creator'
    when 'nonprofit-guide' then 'badge-nonprofit'
    when 'pre-vegan-business-guide' then 'badge-business' end $$;

-- The rule: finishing an intake tags the member. A tag the team took back (removed_at set) stays off.
create or replace function ve_badge_tag_from_completion() returns trigger language plpgsql security definer set search_path = public as $$
declare b text := ve_badge_for_survey(new.survey_slug); k text;
begin
  if b is null then return new; end if;
  select lower(btrim(email)) into k from members where id = new.member_id;
  if k is null or length(k) < 3 then return new; end if;
  insert into ve_person_tags (person_key, tag_slug, source, note, added_at)
  values (k, b, 'rule', 'Finished the ' || new.survey_slug || ' survey', coalesce(new.completed_at, now()))
  on conflict (person_key, tag_slug) do nothing;
  return new;
end $$;
drop trigger if exists trg_ve_badge_tag_from_completion on ve_survey_completions;
create trigger trg_ve_badge_tag_from_completion after insert on ve_survey_completions
  for each row execute function ve_badge_tag_from_completion();

-- Ambassadors carry their badge while they are one.
create or replace function ve_badge_tag_ambassador() returns trigger language plpgsql security definer set search_path = public as $$
declare k text := lower(btrim(new.email));
begin
  if new.ve_role = 'ambassador' and k is not null and length(k) >= 3 then
    insert into ve_person_tags (person_key, tag_slug, source, note) values (k, 'badge-ambassador', 'rule', 'Ambassador')
    on conflict (person_key, tag_slug) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_badge_tag_ambassador on members;
create trigger trg_ve_badge_tag_ambassador after insert or update of ve_role on members
  for each row execute function ve_badge_tag_ambassador();

-- Backfill: every finished intake and every Ambassador today.
insert into ve_person_tags (person_key, tag_slug, source, note, added_at)
select lower(btrim(m.email)), ve_badge_for_survey(c.survey_slug), 'rule', 'Finished the ' || c.survey_slug || ' survey', c.completed_at
from ve_survey_completions c join members m on m.id = c.member_id
where ve_badge_for_survey(c.survey_slug) is not null and length(btrim(coalesce(m.email, ''))) >= 3
on conflict (person_key, tag_slug) do nothing;
insert into ve_person_tags (person_key, tag_slug, source, note)
select lower(btrim(email)), 'badge-ambassador', 'rule', 'Ambassador' from members where ve_role = 'ambassador' and length(btrim(coalesce(email, ''))) >= 3
on conflict (person_key, tag_slug) do nothing;

-- A member's badges, newest first: key, badge (name), color, role (their answer), at, main, listing (Restaurant or Nonprofit, only for a
-- listing they own, the claim approved), explorer. The old course badges stay at the end.
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
      (select w.key from withrole w, me where w.key = me.main_badge and w.key <> 'badge-explorer'),
      (select w.key from withrole w where w.key <> 'badge-explorer' order by w.at desc limit 1)) main)
  select coalesce((
    select jsonb_agg(jsonb_build_object('key', w.key, 'badge', w.badge, 'color', w.color, 'role', w.role, 'at', w.at, 'listing', w.listing,
                                        'explorer', w.key = 'badge-explorer', 'main', w.key = (select main from pick)) order by w.at desc)
    from withrole w), '[]'::jsonb)
  || coalesce((
    select jsonb_agg(jsonb_build_object('key', cu.key, 'badge', cu.label, 'color', null, 'role', null, 'at', u.earned_at, 'main', false, 'explorer', false))
    from course_member_unlocks u join course_unlocks cu on cu.program_slug = u.program_slug and cu.key = u.key
    join course_programs pg on pg.slug = u.program_slug
    where u.member_id = p_member and cu.kind = 'badge' and pg.brand_slug = 'vegans-explore'), '[]'::jsonb);
$$;

-- The member picks their main badge (one they hold, never Explorer); null goes back to the most recent.
create or replace function ve_member_badge_set_main(p_member uuid, p_key text) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_key is not null and not exists (select 1 from jsonb_array_elements(ve_member_badges(p_member)) b where b ->> 'key' = p_key and not (b ->> 'explorer')::boolean) then
    return jsonb_build_object('ok', false, 'error', 'not_held');
  end if;
  update members set main_badge = p_key where id = p_member;
  return jsonb_build_object('ok', true, 'badges', ve_member_badges(p_member));
end $$;

revoke all on function ve_member_badge_set_main(uuid, text) from public, anon, authenticated;
revoke all on function ve_badge_tag_from_completion() from public, anon, authenticated;
revoke all on function ve_badge_tag_ambassador() from public, anon, authenticated;
