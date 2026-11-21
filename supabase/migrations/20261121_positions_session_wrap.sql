-- Wrap of the 2026-11-13 Positions session (Sean, 2026-11-21: capture what was not captured without overwriting newer decisions).
-- Applied through the connector 2026-11-21: playbook ve-positions row (2026-11-21 18:00 UTC), brief_checkpoints 1048
-- (session_label positions-session-wrap), stream_events row (context_link the handoff). Add-only; each insert is guarded so it runs once.
-- Text of record: docs/handoff/2026-11-21-positions-session-wrap.md.
insert into brief_checkpoints (brand_slug, station, status, summary, next_step, session_label, handoff_url)
select 'vegans-explore', 'Logan', 'handed_off', 'Positions session (2026-11-13) wrapped 2026-11-21, add-only. See the handoff.',
  'Build /positions/hold before the first pay notice.', 'positions-session-wrap',
  'https://github.com/lesaruss/vegansexplore-com/blob/main/docs/handoff/2026-11-21-positions-session-wrap.md'
where not exists (select 1 from brief_checkpoints where session_label = 'positions-session-wrap');
