-- ve-vegan-sourcing-guide: LOCKED by Sean 2026-11-04 (canon canon-ve-vegan-sourcing).
-- Applied through the Supabase connector. The playbook page (briefings slug ve-vegan-sourcing-guide)
-- was rendered from the active playbook template; its text is in the canon body below.
insert into knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
values ('canon-ve-vegan-sourcing','Vegan Sourcing: one directory, two Guides (LOCKED 2026-11-04)','decisions','product',
'{"locked_by":"Sean, 2026-11-04: lock it","playbook":"ve-vegan-sourcing-guide","design":["One shared sourcing directory, hidden from the shoppers Directory, shown inside Guides, later on LESARUSS.ai","134 PETA-guide suppliers as seed: names, websites, our own labels; bios from each company own site","Three labels: PETA-Approved Vegan; Fully vegan company; Offers vegan options","Sourcing tab in the Vegan Restaurant Guide: buy or make, home-scale recipes","New Pre-Vegan Business Guide for coffee shops, gyms, juice bars and any business adding vegan, narrator Pascal, own playbook when built"]}'::jsonb,
'active','v',false,50,array['vegans-explore','guides','sourcing','b2b','suppliers','pre-vegan-business','door-guides','peta'],1,'New: locked 2026-11-04 with Sean in a concept session','v','v')
on conflict (slug) do nothing;
insert into playbook_records (slug, brand_slug, author, kind, source, body) values
('ve-vegan-sourcing-guide','vegans-explore','Logan','edit','text','ve-vegan-sourcing-guide: names list saved. 134 companies from the PETA guide (October 2026), names, websites and section only, 38 starred.'),
('ve-vegan-sourcing-guide','vegans-explore','V','decision','text','ve-vegan-sourcing-guide: LOCKED by Sean 2026-11-04 (canon canon-ve-vegan-sourcing). One shared sourcing directory feeds a Sourcing tab in the Vegan Restaurant Guide and a new Pre-Vegan Business Guide. Logan builds the Restaurant Guide tab first.');
