-- The Guide tab on every listing (LOCKED by Sean 2026-10-31: "lock it, go with your defaults"). Concept session with V;
-- canon canon-ve-listing-guide-tab, playbook ve-listing-guide-tab. Records the decision; the build follows.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-listing-guide-tab',
  'Vegans Explore: a Guide tab on every listing, the Partner Dashboard beside it (LOCKED by Sean 2026-10-31)',
  'decisions', 'interface', 'active', 'sar', false, 50,
  array['vegans-explore','directory','listing','guides','partner-dashboard'], 1, 'v', 'v',
  'Locked with V''s defaults (Sean: "lock it, go with your defaults").',
  jsonb_build_object(
    'why', 'Sean: "this is how we can continue to put those guides in front of people''s faces. And if they already purchased it, it''s right there in front of them." The Partner Dashboard tab was hidden from nearly every visitor (shown only to the owner, super admins and a brand on its door link), so that space sat empty.',
    'rule', 'Every listing shows a Guide tab to everyone, signed in or not, labeled with the Guide''s name (Dairy Guide, Creator Guide). It is a short squeeze page: the Guide''s banner, its one line, three or four things inside, and Open the Guide, which goes to the full Guide page in the same window, never framed. An owner of the Guide sees Open your Guide and no price box.',
    'partner_dashboard', 'Not either/or: the Partner Dashboard stays its own tab, right after the Guide tab, shown only to the listing''s owner and super admins (and a brand on its door link, as today). Super admins see the Guide tab too, so any Guide is reachable from any listing.',
    'map', jsonb_build_array(
      'Food places (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering, Meal Prep, Markets): Vegan Dairy Guide',
      'Food Brands: Vegan Dairy Guide',
      'Content Creators, YouTube, Podcasts: Creator Guide',
      'Activists, Nonprofits, Rescues, Sanctuaries: Nonprofit Guide',
      'Groups: Group Partner Guide',
      'Nutrition & Supplements, Physicians, Health Experts: the Nutrition Guide once it exists; the Vegan Dairy Guide until then',
      'Anything with no match: the Welcome Guide (the Passport Guide)'),
    'map_lives', 'One table in one file (the category to Guide map), so a new Guide is one row.',
    'restaurants', 'Two audiences: visitors see the Vegan Dairy Guide; the owner and super admins also see the Vegan Restaurant Guide on that tab.',
    'no_repeat', 'The right column''s house banner never shows the same Guide as the tab: when the tab is the Dairy Guide, the banner rotates to another Guide (Airport, Stadium & Arena).',
    'gap_list', 'Sections with no real match (Nutrition, Products such as clothing and beauty, Services, Studios) go on a Guides to make list, Nutrition first. That list is the roadmap for the next Guides.',
    'tracking', 'The tab counts as the house banners do: views and clicks per Guide per listing, so the Guide funnel reads by page.',
    'playbook', 've-listing-guide-tab')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-listing-guide-tab');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-listing-guide-tab', 'vegans-explore', 'V',
  'Locked by Sean 2026-10-31 ("lock it, go with your defaults"). Every Directory listing gets a Guide tab for everyone, named for its Guide: a short squeeze page (banner, one line, what is inside, Open the Guide to the full page in the same window, never framed; owners of the Guide see Open your Guide). The Partner Dashboard stays its own tab after it, for the owner and super admins only. Map: food places and Food Brands to the Vegan Dairy Guide; Content Creators, YouTube and Podcasts to the Creator Guide; Activists, Nonprofits, Rescues and Sanctuaries to the Nonprofit Guide; Groups to the Group Partner Guide; Nutrition & Supplements, Physicians and Health Experts to the Nutrition Guide once built (Dairy until then); everything else to the Welcome Guide. Restaurants: visitors get Dairy, the owner and super admins also get the Vegan Restaurant Guide. The right-column house banner never repeats the tab''s Guide. Unmatched sections form the Guides to make list, Nutrition first. Views and clicks tracked per Guide per listing. Canon canon-ve-listing-guide-tab.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-listing-guide-tab' and kind = 'decision');
