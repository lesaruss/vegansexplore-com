-- The template gate (Sean, 2026-11-02, after the Taste page was built from a blank file: "It's like you just made something up.
-- Not following any templates, not using any previous examples... We need a system. That's why we have systems, so we don't
-- waste time and usage."). Every new page starts as a copy of a named parent from the template map, and ships only after a
-- side-by-side with that parent. Safe to run twice.
insert into knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
values ('canon-template-gate', 'The template gate: every new page copies a named parent', 'operations', 'interface',
  jsonb_build_object(
    'why', 'Sean, 2026-11-02: "It''s like you just made something up. Not following any templates, not using any previous examples... We need a system. That''s why we have systems, so we don''t waste time and usage." The Taste page (/guides/taste) had been built from a blank file twice while the Welcome Guide (passport.html?guide=welcome) was its exact parent.',
    'rule', jsonb_build_array(
      'Before writing any new page or view, name its parent from the template map and copy that file. Never start from a blank file.',
      'If nothing on the map fits, stop and bring Sean a recommendation (which parent, or a new template) before building.',
      'Before anything ships, put a screenshot of the new page beside its parent at desktop and phone width. If they do not read as the same family, it does not ship.',
      'Redoing an existing page counts: rebuild it on its parent, never restyle the blank one.'),
    'template_map', jsonb_build_object(
      'A Guide, a sampler or anything a Guide walks people through', 'guides/vegan-dairy-guide.html (docs/guides/BUILD-A-GUIDE.md); the whole cast: passport.html?guide=welcome',
      'A walkthrough, pitch, mock or concept page', '/partners with /public/ve-guided.js',
      'A working tool, queue or console', 'admin/depot/social.html and the Depot pages (one thing per view)',
      'A sign-up or any form of more than one section', 'claim.html (?step=)',
      'A listing or profile', 'directory/listing.html',
      'A browse page with a banner', '/public/ve-city-banner.js with the Directory or Events',
      'An email', 'email-send through ve-nurture or ve-people-outreach'),
    'example', '/guides/taste rebuilt 2026-11-02 on the Welcome Guide: one Guide per tab, each Guide''s free piece locked the Dairy Guide way, the sign-up as the last tab.'),
  'active', 'sar', true, 15, array['ui','templates','process','sean'], 1, 'Created after the Taste page.', 'logan', 'logan')
on conflict (slug) do nothing;

insert into error_registry (error_code, error_category, title, description, root_cause, fix_steps, prevention_notes, reported_by, resolved_by, first_seen, last_seen, occurrence_count, resolved)
select 'UI-BUILT-FROM-BLANK-NOT-TEMPLATE', 'other', 'A page built from a blank file instead of its template',
  'A new or redone page that looks like nothing else on the site, because it was written from scratch.',
  'No step forced naming a parent template before writing code.',
  '["Name the parent from canon-template-gate''s template map","Copy that file and change only the content","Screenshot new beside parent at 1440 and 390 before shipping","If no parent fits, ask Sean with a recommendation before building"]'::jsonb,
  'Canon canon-template-gate (always loaded) and the Template gate section of CLAUDE.md.', 'sean', 'logan', now(), now(), 1, true
where not exists (select 1 from error_registry where error_code = 'UI-BUILT-FROM-BLANK-NOT-TEMPLATE');
