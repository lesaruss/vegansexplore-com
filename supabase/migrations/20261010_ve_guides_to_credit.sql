-- Both paid Guides move to credits (Sean, 2026-10-10, canon-ve-guide-pricing v3: "Logan, go ahead and build it").
-- Applied after the pages that read access_rule = 'credit' were live (main 86dfa74). Owners keep their Guides.
update public.ve_guides set access_rule = 'credit'
where slug in ('vegan-dairy-guide', 'vegan-dairy-guide-site', 'vegan-restaurant-survival-guide') and access_rule = 'points';
