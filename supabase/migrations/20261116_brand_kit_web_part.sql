-- Brand kit part 5, Web, in HQ BrandDesk > Vegans Explore > Brand kit (?view=kit#kit-web).
-- Sean, 2026-11-16: "We actually have a section where this belongs... create a web section within this page on the HQ. And this will be
-- in the actual brand desk." Rendered by lesaruss-hq components/newhq/KitSheet.tsx (WebPart). State in_progress until Sean locks it.
update ve_brand_cartridges set data = data
  || jsonb_build_object('web', jsonb_build_object(
    'state', 'in_progress',
    'summary', 'How every Vegans Explore web page is built from the kit. Every new page, view or walkthrough links one shared stylesheet and is made from its parts, never from an older page''s own styles, so nothing ships in the old look again.',
    'start', '<link rel="stylesheet" href="/public/ve-kit.css">',
    'mock', 'https://vegansexplore.com/mocks/brand-kit/web',
    'parts', jsonb_build_array(
      jsonb_build_array('Header and words', '.k-eb .k-h1 .k-h2 .k-lede .k-hl.g/.o/.p .k-label', 'A solid eyebrow tag, a Montserrat 900 headline in sentence case with one or two marker phrases, one plain line under it.'),
      jsonb_build_array('Buttons', '.k-btn .k-cta .k-on .k-sm', 'White with an ink outline; the one thing to do on the view is orange; dark green only for an on state. 6 px corners.'),
      jsonb_build_array('Status tags', '.k-tag.live .wait .new .smp', 'Plain words (Live, Waiting for approval, Not live yet), never an action. Sample stamps any demo.'),
      jsonb_build_array('Color blocks', '.k-block .k-dk .k-or .k-pink .k-peach .k-br .k-tint .k-md', 'A section''s color with its fixed type color: white on brand green, ink on everything else.'),
      jsonb_build_array('Cards and numbers', '.k-card .k-stats .k-grid', 'Ink outline with a solid offset shadow in the section color (data-k-section on any wrapper); lists of cards fill the width.'),
      jsonb_build_array('Rows and steps', '.k-rows .k-row .k-num .k-steps', 'Every row the same fields, one tag or one button in the same place; in steps the reader''s part is orange.'),
      jsonb_build_array('Forms and tabs', '.k-form .k-f .k-select .k-stepbar .k-tabs', 'Ink fields, the chevron 16 px from the edge, one step per view with Back, Step N of M, Next; tabs one sliding row.'),
      jsonb_build_array('The stripe', '.k-stripe', 'Seven bands, brand green double width, once per page.')),
    'pages', jsonb_build_array(
      jsonb_build_array('Walkthrough, pitch, mock', 'The guided white stage with every part from ve-kit.css; first: the 11 Days of Giving brands walkthrough', 'https://vegansexplore.com/partners/giving'),
      jsonb_build_array('A Guide', 'The Welcome Guide''s frame, Guides pink', 'https://vegansexplore.com/passport?guide=welcome'),
      jsonb_build_array('A listing', 'The listing page; any list of listings uses the shared Directory card', 'https://vegansexplore.com/directory'),
      jsonb_build_array('A dashboard', 'The business dashboard: parts as one sliding row, rows with one button and a status tag', 'https://vegansexplore.com/mocks/business-dashboard'),
      jsonb_build_array('A sign-up or long form', 'The claim form''s steps, its Guide in the Welcome Guide''s rail', 'https://vegansexplore.com/claim'),
      jsonb_build_array('A tool or queue', 'List, then one item on its own; filter, sort, search; its look from ve-kit.css', ''),
      jsonb_build_array('Posts, emails, ads', 'Templates (this kit); pictures follow Imagery, the Guides follow The Guide roster', '')),
    'rules', jsonb_build_array(
      'Every new page links /public/ve-kit.css, or names its kit parent with data-kit-parent (welcome-guide, listing, business-dashboard, claim).',
      'Never copy an older page''s own styles; the parent for each kind of page is the list above.',
      'One orange button per view; never a green filled button as the main action.',
      'Full width always; nothing scrolls inside itself.',
      'Before anything ships, screenshot it beside its parent at 1440 and 390 px.'),
    'check', 'The check: before every push, scripts/look-check.js refuses a new page that is not on the kit, a new page without the nav and footer, and any added line with an old-look green. Canon canon-ve-brand-kit-web.'))
  || jsonb_build_object('kit_pages', (data->'kit_pages') || jsonb_build_array(jsonb_build_array('Web', 'https://vegansexplore.com/mocks/brand-kit/web'))),
  updated_at = now()
where brand_slug = 'vegans-explore' and not (data ? 'web');
