-- ve-events-guide: steps 4 and 5 of the membership rule (canon-ve-door-guides v6 membership_rule_v6; wording approved by Sean 2026-11-06,
-- docs/proposals/membership-rule-wording-steps-3-9.md).
-- Step 4: the Nonprofit Guide's intake moves onto the one survey system (ve_surveys 'nonprofit-guide', 11 questions, 250 points, admits),
--   and the Nonprofit Guide becomes a door Guide. The old 'Tell us about your organization' form (ve_nonprofit_surveys) had no rows.
-- Step 5: a business Guide opens by finishing its own intake, members included. ve_owns_guide (saves, votes, My list) follows ve-guide-unlock:
--   a purchase or comp already given still counts; being an active member alone no longer does.
-- Safe to run twice.

insert into public.ve_surveys (slug, guide_slug, title, intro, admits, active)
values ('nonprofit-guide', 'nonprofit-guide', 'Tell us about your organization',
        'A few questions about your nonprofit, rescue or sanctuary. Finish it and the Nonprofit Guide opens, with up to 250 points.', true, true)
on conflict (slug) do update set guide_slug = excluded.guide_slug, title = excluded.title, intro = excluded.intro, admits = true, active = true;

insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required, shared_key) values
 ('nonprofit-guide', 'n_role', 1, 'choice', 'What is your part in the organization?', null,
  '[{"v":"lead","label":"I founded it or run it"},{"v":"staff","label":"I am on staff"},{"v":"volunteer","label":"I volunteer or sit on the board"},{"v":"other","label":"Something else"}]'::jsonb, 25, true, null),
 ('nonprofit-guide', 'n_chapter', 2, 'choice', 'x', null, null, 20, true, 'chapter'),
 ('nonprofit-guide', 'n_name', 3, 'text', 'x', null, null, 20, true, 'org_name'),
 ('nonprofit-guide', 'n_link', 4, 'text', 'x', null, null, 15, false, 'org_link'),
 ('nonprofit-guide', 'n_kind', 5, 'choice', 'What kind of organization is it?', null,
  '[{"v":"nonprofit","label":"Nonprofit"},{"v":"rescue","label":"Rescue"},{"v":"sanctuary","label":"Sanctuary"},{"v":"other","label":"Something else"}]'::jsonb, 25, true, null),
 ('nonprofit-guide', 'n_where', 6, 'text', 'Where do you serve?', null, null, 20, false, null),
 ('nonprofit-guide', 'n_challenge', 7, 'multi', 'What is hardest right now?', null,
  '[{"v":"money","label":"Raising money"},{"v":"volunteers","label":"Finding volunteers"},{"v":"seen","label":"Getting seen"},{"v":"burnout","label":"Burnout"},{"v":"events","label":"Running events"},{"v":"other","label":"Something else"}]'::jsonb, 25, true, null),
 ('nonprofit-guide', 'n_money', 8, 'multi', 'How do you raise money today?', null,
  '[{"v":"events","label":"Events"},{"v":"monthly","label":"Monthly donors"},{"v":"grants","label":"Grants"},{"v":"merch","label":"Merchandise"},{"v":"partners","label":"Business partners"},{"v":"p2p","label":"Peer-to-peer"},{"v":"other","label":"Other"}]'::jsonb, 20, false, null),
 ('nonprofit-guide', 'n_monthly', 9, 'choice', 'Do you have a monthly giving program?', null,
  '[{"v":"yes","label":"Yes"},{"v":"starting","label":"We are starting one"},{"v":"no","label":"Not yet"}]'::jsonb, 15, false, null),
 ('nonprofit-guide', 'n_help', 10, 'multi', 'What would help most from Vegans Explore?', null,
  '[{"v":"found","label":"Being found in the Directory"},{"v":"events","label":"Promoting our events"},{"v":"partners","label":"Business partners"},{"v":"volunteers","label":"Volunteers"},{"v":"media","label":"Being on a podcast or in the Daily Pulse"},{"v":"link","label":"Earning through our own link"}]'::jsonb, 25, true, null),
 ('nonprofit-guide', 'n_note', 11, 'long', 'Anything else we should know?', null, null, 40, false, null)
on conflict do nothing;

update public.ve_guides set door = true, survey_slug = 'nonprofit-guide' where slug = 'nonprofit-guide';

create or replace function public.ve_owns_guide(p_member uuid, p_guide text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from ve_guide_purchases p join ve_guides g on g.id = p.guide_id
                 where p.member_id = p_member and (g.slug = p_guide or g.slug = p_guide || '-site'))
      or exists (select 1 from ve_guides g join ve_survey_completions c on c.survey_slug = g.survey_slug and c.member_id = p_member
                 join members m on m.id = p_member
                 where g.slug = p_guide and g.door and coalesce(m.member_class, 'member') <> 'agent');
$$;
revoke all on function public.ve_owns_guide(uuid, text) from public, anon, authenticated;

do $$ declare t int; begin
  select sum(points) into t from public.ve_survey_questions where survey_slug = 'nonprofit-guide';
  if t <> 250 then raise exception 'nonprofit-guide totals %, not 250', t; end if;
end $$;
