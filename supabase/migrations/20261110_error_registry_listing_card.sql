-- Error registry: a list of Directory listings drawn with a new, hand-made card instead of the shared Directory card (Sean, 2026-11-10,
-- on the Holiday Guide's Kosher Places: "let's make sure that we're using the same tile... so they could vote and do all the things they
-- normally do. It looks like you created new versions here. We need to put a rule... I'm getting tired of telling you to fix it").
-- Also a row in CLAUDE.md's template gate table. Safe to run twice.
insert into error_registry (error_code, error_category, title, description, root_cause, fix_steps, prevention_notes, affected_files, reported_by, first_seen, last_seen, occurrence_count, resolved)
select 'UI-LISTING-CARD-COPIED-NOT-SHARED', 'other',
  'A list of Directory listings got a hand-made card instead of the shared Directory card',
  'Kosher Places in the Holiday Guide (2026-11-10) showed listings in a new card made for the page (logo, name, tag, Their Listing, Save), so people could not vote and the card did not match the rest of the site.',
  'The page was built from the menu card next to it instead of the template gate''s row for listings; the rule "use the shared components, never a copy: ve-region-directory.js (the Directory card everywhere)" was in CLAUDE.md but not checked.',
  jsonb_build_array('Fetch the listings with VERegionDirectory.FIELDS (the Guide''s FIELDS).', 'Draw them with VERegionDirectory.card (a Guide''s cards(list, id) helper) inside .vrd-root .rank-grid.', 'Wire them with VERegionDirectory.wire (a Guide''s wireCards(id)), which gives vote, save and open.', 'Screenshot beside the Directory at 1440 and 390 px.'),
  'Any list of Directory listings, on any page or Guide, uses the shared Directory card. A holiday menu card is not a listing card: it shows a menu, and links to the listing.',
  array['guide-scripts/holiday-guide.js', 'public/ve-region-directory.js'], 'Sean', now(), now(), 1, true
where not exists (select 1 from error_registry where error_code = 'UI-LISTING-CARD-COPIED-NOT-SHARED');
