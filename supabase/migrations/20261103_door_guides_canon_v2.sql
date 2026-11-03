-- DRAFT, NOT APPLIED. canon-ve-door-guides v2 waits for Sean's explicit sign-off on two answers (locked canon changes only with his word):
--   1. The event survey is worth 100 points (12 questions: 90 required, 10 optional).
--   2. The general survey door admits without the event survey; a sponsorship still needs the event survey.
-- Replaces the v1 "free with an email" levels with the survey gate built 2026-11-03 (steps 1 and 2). Apply once Sean says "defaults" or changes an answer.
update public.knowledge_records
set version = 2,
    updated_by = 'logan',
    updated_at = now(),
    change_summary = 'v2 (Sean sign-off pending): the email-only reader level is replaced by a free account that finishes the Guide''s survey; event survey 100 points; the general survey admits without the event survey; a sponsorship still needs the event survey.',
    body = body || jsonb_build_object(
      'v2_levels', jsonb_build_array(
        'Open, no account: the Overview and the one free example (public, indexed).',
        'Free account + the Guide''s survey: any active member opens a door Guide (ve_surveys per Guide; the event survey is 100 points over 12 questions). Replaces the email-only Taster reader (ve-taster guide_join answers 410).',
        'The $11 Passport: their voice (recording, This month, saving across devices).'),
      'v2_survey_points', 100,
      'v2_admission', 'The general survey door admits a member without the event survey. A sponsorship application still needs a signed-in account that finished the event survey; applications are ranked against each other in Depot > Event sponsors > Compare, never an entitlement.',
      'v2_still_true', 'Always free: the event claim, the sponsorship application (after the survey), a claimed host''s own Host Notes. Struggling stays private by default. Recording rules unchanged.')
where slug = 'canon-ve-door-guides' and version = 1;

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-door-guides', 'vegans-explore', 'Logan',
  'Canon v2 for canon-ve-door-guides applied after Sean''s sign-off: survey gate replaces the email-only reader; event survey 100 points; general survey admits without the event survey; sponsorship still needs the event survey.',
  'text', 'decision'
where exists (select 1 from public.knowledge_records where slug='canon-ve-door-guides' and version=2);
