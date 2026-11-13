-- Wrap 2026-11-13: canon canon-ve-chapter-launch (the Seattle recipe), playbook ve-chapter-launch opened, checkpoint 1014 (handed_off).
-- Written live on 2026-11-13; the full bodies are in the database and docs/handoff/2026-11-13-ve-chapter-launch.md. Safe to run twice.
insert into playbook_records (slug, brand_slug, author, body, source, kind)
select 've-chapter-launch', 'vegans-explore', 'Logan', 've-chapter-launch opened 2026-11-13. See docs/handoff/2026-11-13-ve-chapter-launch.md', 'text', 'decision'
where not exists (select 1 from playbook_records where slug = 've-chapter-launch');
