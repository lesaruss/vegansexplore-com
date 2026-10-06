-- Ask a person (2026-10-06): questions a member sends to Sean and their Community Manager.
alter table public.guide_kb_questions drop constraint if exists guide_kb_questions_outcome_check;
alter table public.guide_kb_questions add constraint guide_kb_questions_outcome_check check (outcome in ('answered', 'no_match', 'sent_to_guide', 'guide_failed', 'sent_to_person'));
