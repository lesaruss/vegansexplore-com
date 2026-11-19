-- 2026-11-18: Holiday Launch business group paused before the 9 AM send (9% bounces on Nov 16 to 17); its addresses are checked first and
-- the group folds into the Directory Reach groups (docs/plans/2026-11-18-directory-reach-boss.md). Applied through the connector.
update ve_outreach_campaigns set paused_at = now(), note = note || E'\nPaused 2026-11-18 by Logan (Sean''s default, outreach report): 9% bounces on 2026-11-16 to 17; addresses to be checked first; folding into the Directory Reach groups (docs/plans/2026-11-18-directory-reach-boss.md).'
where slug='holiday-launch-business' and paused_at is null;
