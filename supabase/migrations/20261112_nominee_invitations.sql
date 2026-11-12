-- ve-nominate-someone step 2: the Nominee invitations campaign, the Nominee badge, and joining (Sean, 2026-11-12: "yes to both, approved").
-- (1) The outreach pause is lifted for this one campaign only: it emails a nominee when Sean presses Approve in Depot > Nominations
--     (ve-nominations adds them as a member of the campaign, with their own filled-in emails in personal_emails), and once more on day 4 if
--     they have not started (their first saved answer stops the reminder). Every other campaign stays paused.
-- (2) The emails are the wording Sean approved. Each nominee's row carries its own text (their nominator, their words, their area); the steps
--     below are the template, used only if a row has none. {link} becomes the nominee's own tracked /go/ link to /nominate/interview.
-- (3) The Nominee badge (a ve_tags badge, shown with the member's other badges).
-- (4) ve_nomination_admit(member, nomination): finishing the interview and setting up an account makes them a member the way finishing the
--     Explorer survey does (survey door, the Explorer completion and badge, Founding Member and the referral reward through the existing
--     triggers), pays the Explorer questions' points under their own refs (so answering the Explorer survey later never pays twice), adds the
--     Nominee badge, and marks the nomination joined.
-- Safe to run twice.

insert into ve_outreach_campaigns (slug, name, status, audience, cities, categories, vegan_only, start_on, link_path, daily_pace, approved_at,
  approved_by, email_count, program_slug, sender_brand, footer_reason, note)
values ('nominee-invitations', 'Nominee invitations', 'active', 'people', '{}', '{}', false, (now() at time zone 'America/New_York')::date,
  '/nominate/interview', 60, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 2, 'always-on', 'lesaruss',
  'someone in your community nominated you on Vegans Explore',
  'Sean, 2026-11-12: "yes to both, approved" (the pause lifted for this campaign only; the email as drafted). People are added only by Approve in Depot > Nominations.')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset, locked_at, locked_by, updated_at)
values
 ('nominee-invitations', 1, '{first_name}, you''ve been nominated',
  E'Hi {first_name},\n\nCongratulations! Someone in your community nominated you on Vegans Explore. They think you deserve your flowers, and after hearing why, so do we.\n\nWe''d love to hear your story. It''s a short interview with me: eight questions, about ten minutes, and you can answer by voice or in writing. Your story could be featured on our podcast, on your city''s page and in the Daily Pulse. Every nominee is considered, and we''ll tell you either way.\n\nStart your interview: {link}\n\nKai\nThe Creator Guide at Vegans Explore',
  0, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()),
 ('nominee-invitations', 2, '{first_name}, your interview is still waiting',
  E'Hi {first_name},\n\nYour interview is still waiting for you, {first_name}. It takes about ten minutes.\n\nStart your interview: {link}\n\nKai\nThe Creator Guide at Vegans Explore',
  4, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now())
on conflict (campaign_slug, step) do nothing;

insert into ve_tags (slug, name, kind, color, description, active)
values ('badge-nominee', 'Nominee', 'badge', '#C2185B', 'Nominated by their community and interviewed by Kai (Nominate Someone).', true)
on conflict (slug) do nothing;

create or replace function ve_nomination_admit(p_member uuid, p_nomination uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  m record; q record; v_admitted boolean := false;
begin
  select id, email, membership_status, member_class into m from members where id = p_member;
  if m.id is null then return jsonb_build_object('ok', false, 'error', 'no_member'); end if;
  if not exists (select 1 from ve_nominations where id = p_nomination and interview_sent_at is not null) then
    return jsonb_build_object('ok', false, 'error', 'interview_not_sent');
  end if;
  if m.membership_status = 'pending_payment' and coalesce(m.member_class, 'member') = 'member' then
    update members set survey_door_at = coalesce(survey_door_at, now()) where id = p_member;
    insert into ve_survey_completions (member_id, survey_slug) values (p_member, 'explorer') on conflict do nothing;
    v_admitted := ve_survey_door_admit(p_member);
    update ve_survey_completions set admitted = true where member_id = p_member and survey_slug = 'explorer';
  else
    insert into ve_survey_completions (member_id, survey_slug) values (p_member, 'explorer') on conflict do nothing;
  end if;
  for q in select id, points from ve_survey_questions where survey_slug = 'explorer' and coalesce(points, 0) > 0 loop
    perform ve_points_grant(p_member, q.points, 'survey_answer', 'survey:explorer:' || q.id);
  end loop;
  insert into ve_person_tags (person_key, tag_slug, source, note, added_at)
  values (lower(m.email), 'badge-nominee', 'rule', 'Nominated by their community and interviewed by Kai', now())
  on conflict (person_key, tag_slug) do nothing;
  update ve_nominations set member_id = p_member, joined_at = coalesce(joined_at, now()),
    status = case when status in ('approved', 'invited', 'interviewing') then 'member' else status end, updated_at = now()
  where id = p_nomination;
  return jsonb_build_object('ok', true, 'admitted', v_admitted, 'status', (select membership_status from members where id = p_member));
end $$;
revoke all on function ve_nomination_admit(uuid, uuid) from public, anon, authenticated;
