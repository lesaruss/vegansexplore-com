-- Sean, 2026-11-13: "You can unpause outreach. I feel like we're in a better place. I feel more confident with what we have, and then we can
-- still do checks and make sure everything looks good. And fix things on the fly." Lifts the 2026-11-11 pause
-- (20261111_pause_all_campaigns_for_brand.sql): only the campaigns that pause stopped, each still at its own approved daily pace.
-- Safe to run twice.
update ve_outreach_campaigns set paused_at = null,
  note = coalesce(note || ' ', '') || 'Resumed 2026-11-13 (Sean: "You can unpause outreach").'
where paused_at is not null and status <> 'finished'
  and note like '%Paused 2026-11-11%' and note not like '%Resumed 2026-11-13%';
