-- ve-theme-park-guide: wrap-up 2026-11-04. Records only (playbook decision, index row, checkpoint, stream event). No schema change.

insert into playbook_records (slug, brand_slug, author, kind, body) values
('ve-theme-park-guide','vegans-explore','Logan','decision',
 've-theme-park-guide: wrap-up 2026-11-04 (Wed, 5:39 AM Eastern). Concept locked, nothing built for the Guide itself. Done around it: ve-spend-budget step 1 live (Google hard $50 a month at list price, ve_google_room enforces the month, ve_google_approve gives a scan a ceiling, ve_google_ledger; daily caps 120/100); CLAUDE.md now has this Guide''s section and the new Google costs rule; handoff doc docs/handoff/2026-11-04-ve-theme-park-guide.md. Ledger at wrap-up: $14.00 spent, $36.01 left, no approvals. Next, in order: confirm the ledger; migration widening the ve_venues kind check to theme_park plus the ve-venues GUIDES entry, an unpublished ve_guides row and the free-park flag; approve and run the Magic Kingdom pilot (about 25 searches + 70 details, about $2.75 at list) under ve_google_once_room and show Sean the pins; then the page copied from the stadium Guide with a GPS park map. Open: pin quality unknown (Google may snap in-park pins to the park centre), OpenStreetMap untested (needs an edge function), park terms of use unread, Dani as narrator is Sean''s to change. Nothing here depends on blueprint-portal, which a separate agent owns.');

update ve_playbook_index set
  stage = 'Concept locked 2026-11-04 (canon-ve-theme-park-guide). Nothing built for the Guide. Unblocked: ve-spend-budget step 1 is live, ledger $36.01 left of $50. CLAUDE.md section and handoff doc written.',
  next_action = 'Logan (new chat): confirm the ledger, migrate the theme_park venue kind, approve the Magic Kingdom pilot with ve_google_approve (about 25 searches + 70 details, about $2.75 at list), run it and show Sean the pins before building the page.',
  updated_at = now()
where slug = 've-theme-park-guide';

insert into brief_checkpoints (brand_slug, station, account, status, summary, next_step, session_label, open_items, files_touched)
values ('vegans-explore','claude-code-cloud','logan','handed_off',
 've-theme-park-guide: wrap-up 2026-11-04. Concept locked (canon-ve-theme-park-guide), nothing built for the Guide. ve-spend-budget step 1 live: Google hard $50 a month at list, approvals with ceilings, ledger ($14.00 spent, $36.01 left). blueprint-portal opened for a separate agent. CLAUDE.md has the Guide section and the new Google costs rule; handoff docs/handoff/2026-11-04-ve-theme-park-guide.md.',
 'Confirm the ledger; theme_park migration (kind check, ve-venues GUIDES entry, unpublished ve_guides row, free-park flag); approve and run the Magic Kingdom pilot under ve_google_once_room; show Sean the pins.',
 've-theme-park-guide: wrap-up 2026-11-04',
 '["ve-theme-park-guide: pin quality unknown, Google may snap in-park pins to the park centre","ve-theme-park-guide: test OpenStreetMap from an edge function (ODbL attribution)","ve-theme-park-guide: read the parks'' terms of use before any crawler","ve-theme-park-guide: Dani as narrator instead of River is Sean''s call","ve-spend-budget: steps 2 to 4 not built; Sean to send plan prices for Apify, Higgsfield, ElevenLabs, Metricool"]'::jsonb,
 '["CLAUDE.md","docs/handoff/2026-11-04-ve-theme-park-guide.md","supabase/migrations/20261104_theme_park_guide_spend_budget_canon.sql","supabase/migrations/20261104_google_hard_cap_ledger.sql","supabase/migrations/20261104_blueprint_portal_playbook.sql","supabase/migrations/20261104_theme_park_wrap_up_records.sql"]'::jsonb);

insert into stream_events (owner, station, session_id, summary, keywords, status)
values ('logan','vegans-explore','ve-theme-park-guide-wrap-up-2026-11-04','ve-theme-park-guide: wrapped up. Concept locked, nothing built. ve-spend-budget step 1 live ($50 Google hard stop, ledger, approvals). blueprint-portal opened. Handoff doc, CLAUDE.md section, playbook decision, index row and checkpoint filed. Next: theme_park migration, then the Magic Kingdom pilot under the ledger.', array['ve-theme-park-guide','wrap-up','ve-spend-budget','handoff'], 'completed');
