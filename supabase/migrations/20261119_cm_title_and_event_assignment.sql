-- Community Manager is a title with assignments they choose (Sean, 2026-11-19). canon-ve-community-managers v2.
update knowledge_records set
 body = body || jsonb_build_object(
  'role_is_a_title_v2', 'Community Manager is a title, not one job (Sean, 2026-11-19: "community manager is really a title, but they pick and choose what assignments they want. And sometimes they''ll get a monthly assignment that will renew. It''s not a one off like the social media manager role"). A Community Manager picks the assignments they want; some are monthly and renew (the social media manager stipend, $125 every two weeks, is one such assignment), others are one-offs.',
  'event_lead_assignment_v2', 'Running a community night is a Community Manager assignment, paid $150 per night, never covered by a monthly stipend; a big night may get two Community Managers, each paid. Whoever runs a night must be a Community Manager and go through the Community Manager system first, so they know what is expected; a partner club''s leader becomes a Community Manager to run their club''s night. The assignment is the lead-up and the night: outreach, follow-up, logistics, checking in with the venue, then running it (Sean, 2026-11-19: "it''s not just the day of the event, it''s the lead up to it").'),
 version = 2,
 change_summary = 'v2 (Sean, 2026-11-19): Community Manager is a title with assignments they choose (monthly renewing or one-off); running a community night is a $150-per-night assignment, two Community Managers for a big night, leader must be a Community Manager first; the work includes the lead-up.',
 updated_by = 'Logan Russell', updated_at = now()
where slug = 'canon-ve-community-managers';

-- v3 (Sean, 2026-11-19): Community Manager is the top of the member ladder; appointed now, by merit later; paid in bounties.
update knowledge_records set
 body = body || jsonb_build_object('merit_ladder_v3', 'Community Manager is the top of the ladder for members (Sean, 2026-11-19: "Community manager is the top of the totem pole. When you''re a member, you want to work towards being a community manager. I''m just assigning community managers right now because we need them. But once we have them, it''s going to be based off merit... once they get to a certain level, they could be eligible to be considered a community manager, and then they get paid bounties"). Now: Sean appoints Community Managers because they are needed. Later: members rise through the levels; at a set level they become eligible to be considered; Community Managers are paid in bounties (their assignments, such as a $150 community night). The eligibility level is not set yet.'),
 version = 3,
 change_summary = 'v3 (Sean, 2026-11-19): Community Manager is the top of the member ladder; appointed now, by merit later (members reach a level, become eligible to be considered); paid in bounties.',
 updated_by = 'Logan Russell', updated_at = now()
where slug = 'canon-ve-community-managers';
