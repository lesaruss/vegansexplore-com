-- Playbook ve-social-schedule opened (Sean, 2026-11-13: "put together that project, that playbook... get the social media set up for the
-- next, at least for the next week"), a ve-claims-onboarding decision row for the Veggie Grill work, and checkpoint 1013 (handed_off).
-- The rows were written live on 2026-11-13; this file records them (the bodies are in the database and the handoff
-- docs/handoff/2026-11-13-ve-social-schedule-opened.md). Safe to run twice.
insert into playbook_records (slug, brand_slug, author, body, source, kind)
select 've-social-schedule', 'vegans-explore', 'Logan', 've-social-schedule opened 2026-11-13. See docs/handoff/2026-11-13-ve-social-schedule-opened.md', 'text', 'decision'
where not exists (select 1 from playbook_records where slug = 've-social-schedule');
