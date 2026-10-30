-- Directory navigation (LOCKED by Sean 2026-10-30: "lock it"). Concept session with V; canon canon-ve-directory-navigation,
-- playbook ve-directory-navigation. Records the decision; the build follows.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-directory-navigation',
  'Vegans Explore Directory navigation: sections in the banner, location in the filter (LOCKED by Sean 2026-10-30)',
  'decisions', 'interface', 'active', 'sar', false, 50,
  array['vegans-explore','directory','navigation','filters','location'], 1, 'v', 'v',
  'Locked with V''s defaults (Sean: "lock it").',
  jsonb_build_object(
    'rule', 'The Directory''s banner dropdown is the Directory menu, never the city: Food, Products, Services, Media, Community, People, Being vetted (members), Review (super admins). The line under the banner title names the section and, where it applies, the location ("Food · South Florida"). Same pattern as Media''s kinds and the Gig Board''s banner-as-menu.',
    'tabs', 'The row under the banner is the chosen section''s sub-sections (Restaurants, Bakeries & Cafes, Food Trucks...). The sub-section list leaves the filter popover, so each level lives in one place: section in the banner, sub-section in the tabs, details in the filter.',
    'filter_button', 'Labeled Filters beside the icon, with the count set ("Filters · 2"), wider, with a gap before the search box.',
    'location', 'First inside the filter: Continent, then Country, then Chapter, then the existing Area. A level is grayed until the one above is picked; a level with a single choice fills itself (Europe fills United Kingdom). Every level has All. Each chapter carries its continent and country in VE_HUBS.',
    'which_sections', 'Location shows for Food, Services, Community, Being vetted and Products (online businesses always show). Food Brands and Nutrition & Supplements have none unless Sells at is Markets & events. Media and People have none. City hubs stay locked to their own chapter with no location step.',
    'always_visible', 'The chosen location is never hidden inside the filter: it shows under the banner title and as a removable tag by the search.',
    'memory', 'Remembered across visits (localStorage). Signed in: the member''s home chapter first, then their last pick; else the last pick; else All. Still never in the address, so a shared link opens in the visitor''s own location.',
    'knock_on', 'The ad rail follows the location filter (Media and People use the All cities pair). On the dashboard the filter starts from the dashboard''s active city and changing it updates the active city. LESARUSS.ai shares ve-region-directory.js: its sections fill the banner menu in brand mode; check both sites.',
    'playbook', 've-directory-navigation')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-directory-navigation');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-directory-navigation', 'vegans-explore', 'V',
  'Locked by Sean 2026-10-30 ("lock it"). The Directory banner''s dropdown is the Directory menu (Food, Products, Services, Media, Community, People, Being vetted, Review), not the city. The tabs under it are the section''s sub-sections. The filter button reads Filters with its count, wider, gapped from search. Location is first in the filter: Continent > Country > Chapter > Area, each grayed until the one above is picked, single choices filled automatically, All at every level. Location shows for Food, Services, Community, Being vetted and Products; brand sections only with Markets & events; never Media or People. The location shows under the banner title and as a tag by the search, is remembered across visits (home chapter for members), never in the address. The ad rail and the dashboard''s active city follow it. LESARUSS.ai uses its own sections in brand mode. Canon canon-ve-directory-navigation.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-directory-navigation' and kind = 'decision');
