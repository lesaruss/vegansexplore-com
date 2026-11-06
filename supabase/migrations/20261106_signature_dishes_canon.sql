-- ve-signature-dishes: LOCKED by Sean 2026-11-06 (canon canon-ve-signature-dishes). Applied through the Supabase connector.
insert into knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
values ('canon-ve-signature-dishes','Signature dishes on claimed food listings (LOCKED 2026-11-06)','decisions','product',
'{"locked_by":"Sean, 2026-11-06: answered the four questions with Logan''s recommendations","playbook":"ve-signature-dishes","rules":["Any owner of a food listing whose claim Sean approved (owner_member_id), member or Partner; a perk of claiming","Up to 5 featured: slots 1 to 3 free, slots 4 and 5 are 50 points a slot for 30 days from the owner''s member balance, never auto-renewing; a lapsed slot''s dish stays saved, not featured","Up to 20 dishes saved","A featured dish needs a name, a real photo at least 800 px on the shorter side and one line; price, tags and a menu item link optional","The owner sets the order; votes never change it","Passport holders vote once per dish and can take it back; counts show; owners cannot vote on their own dishes; signed out gets the members-only window","Never replaces the menu: ve_menu_items and the Menu tab are untouched"],"later":["A reminder 3 days before a paid slot ends, built off, sent only after Sean approves the draft","Top Vegan dishes by chapter, brought to Sean as a proposal first"]}'::jsonb,
'active','sar',false,50,array['vegans-explore','directory','listings','signature-dishes','points','business'],1,'New: locked 2026-11-06 with Sean','logan','logan')
on conflict (slug) do nothing;
insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, due_on, priority)
values ('ve-signature-dishes','vegans-explore','Signature dishes',
 'Every claimed food listing features up to 5 signature dishes on its Overview (3 free, 2 more at 50 points a slot for 30 days), voted on by members, in the owner''s order. Never replaces the menu.',
 'building','Locked 2026-11-06. A-to-Z list in docs/playbooks/ve-signature-dishes.md. A and B done.',
 'C: the data migration (dishes, votes, paid slots, the 50-point charge).','Logan', null, 40)
on conflict (slug) do nothing;
insert into playbook_records (slug, brand_slug, author, kind, source, body) values
('ve-signature-dishes','vegans-explore','Logan','decision','text','ve-signature-dishes: LOCKED by Sean 2026-11-06 (canon canon-ve-signature-dishes). Any approved owner of a food listing; slots 1 to 3 free, 4 and 5 at 50 points a slot for 30 days, no auto-renew; members vote once per dish; a featured dish needs a name, photo and line. List A to K in docs/playbooks/ve-signature-dishes.md.');
