-- canon-ve-business-badges: four badges for businesses (LOCKED by Sean 2026-11-06, "lock it").
insert into knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary)
values ('canon-ve-business-badges',
 'Four badges for businesses: 100% Vegan, 100% Plant-based, Pre-Vegan Certified, Pre-Vegan',
 'decisions', 'brand',
 jsonb_build_object(
  'source', 'Sean, 2026-11-06, locked with "lock it" (playbooks ve-pre-vegan-business-guide and vegans-explore-initiative-business-certification)',
  'why', 'Vegan and plant-based are different. Vegan is about the animals; plant-based is about the food. A business that calls itself Vegan while its owner does not live it is not being honest, and the community feels taken advantage of later (the same as when a celebrity stops being Vegan, but local and reachable). A plant-based business is still good and still supports the movement; it serves the many people who will try plant-based food without wanting the word Vegan.',
  'badges', jsonb_build_array(
    jsonb_build_object('name','100% Vegan','means','Everything sold is Vegan and the business is run for the animals, for reasons beyond commerce.'),
    jsonb_build_object('name','100% Plant-based','means','Everything sold is plant-based; the owner does not claim the Vegan motivation. A respected badge, never a lower one.'),
    jsonb_build_object('name','Pre-Vegan Certified','means','Named items checked by us (no cross-contamination, no bone-char sugar and the rest of Standard V1.2). It is about those items, not the whole business. Clicking it shows every box they passed.'),
    jsonb_build_object('name','Pre-Vegan','means','Any business that offers plant-based options.')),
  'how_decided', 'The owner''s own answers to the intake survey set 100% Vegan or 100% Plant-based. We do not judge or decide it for them. The owner sees their badge before it shows and can change their answers. Our team checks before 100% Vegan shows.',
  'not_a_penalty', 'It gives customers peace of mind and protects the owner: on record and honest, so nobody feels tricked later. If a plant-based place later adds meat, that is no betrayal; it was never Vegan.',
  'vegan_weight', '100% Vegan businesses get more from us: mentioned first in features and on the podcast, and we work hardest to keep them open as the example. It is something for plant-based owners to aim for.',
  'words', 'Never call another business by its motivation in our copy, and never name a real business or owner as an example of either badge. Explain the badges plainly, without lecturing.',
  'service', 'For a business adding plant-based items we do everything short of cooking: what to add, recipes, sourcing and bulk buying, a Vegan chef from the job board, a tasting night, photos, a custom menu and promotion. Built today: what to add, recipes, Sourcing, photos through BrandDesk. Planned: tasting nights, bulk buying, the certification checks. Not started: hiring a chef, the custom menu, one bundled package.',
  'open', 'Not built: the badges on listings and the Directory, the intake questions (to Sean to read first), the Directory''s Vegan options label (changed in a later step, not without Sean).'),
 'active', 'sar', false, 99, array['badges','language','pre-vegans','certification','brand'], 1, 'logan', 'logan',
 'Locked by Sean 2026-11-06: four business badges, decided by the owner''s own answers')
on conflict (slug) do nothing;
