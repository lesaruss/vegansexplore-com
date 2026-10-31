-- The Vegan Restaurant Survival Guide is The Vegan Restaurant Guide (Sean, 2026-10-31: "We'll change it to the vegan restaurant
-- guide, because that should have been changed already"; canon canon-ve-front-of-house v3). The slug and its links stay.
update public.ve_guides set title = replace(title, 'Vegan Restaurant Survival Guide', 'Vegan Restaurant Guide')
  where slug = 'vegan-restaurant-survival-guide' and title ilike '%Restaurant Survival Guide%';
update public.ve_dashboard_cards set title = replace(title, 'Vegan Restaurant Survival Guide', 'Vegan Restaurant Guide')
  where title ilike '%Restaurant Survival Guide%';
update public.ve_links set label = replace(label, 'Vegan Restaurant Survival Guide', 'Vegan Restaurant Guide')
  where code = 've-guide-restaurant' and label ilike '%Restaurant Survival Guide%';
update public.ve_dashboard_cards set title = 'The Vegan Restaurant Guide' where title = 'The Restaurant Survival Guide';
