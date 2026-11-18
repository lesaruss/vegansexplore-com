-- Sean, 2026-11-18: vouch for everything, once per member, no daily voting anywhere. Canon canon-ve-vouch-everything.
insert into knowledge_records (slug,title,category,subcategory,body,status,owner,always_load,load_priority,tags,version,change_summary,created_by,updated_by)
select 'canon-ve-vouch-everything','Vegans Explore: members vouch, once, for everything (no daily voting anywhere)','brand','canonical',
jsonb_build_object(
 'quote','I think we should keep it vouch for everything for the same reason we don''t make the votes for the businesses. Somebody can just come on every day because we have nothing else to do and say this is number one, and it skews the results. If people know that people only can vote for things once, then it makes it a little bit easier to trust the rankings. That''s what we figured out in the [Nearectory].',
 'locked_by','Sean','locked_at','2026-11-18',
 'rule', jsonb_build_array(
  '1. Every ranking on Vegans Explore is built from vouches: one per member per thing, kept until they take it back (Undo my vouch). The count is the number of people. This covers Directory listings (places, businesses, brands, people, shows, films, books), signature dishes and menu items on a business page, products, the next chapter cities, gigs and anything new that members rank.',
  '2. The word is Vouch / Vouches / Vouched / Vouching / Undo my vouch everywhere: pages, Guides, buttons, sorts ("Most vouches"), emails, pitches, videos and the Guides'' recorded lines. Never "vote" for a member ranking, and never "every day" or "once a day" about it.',
  '3. The daily habit is earning points to give to businesses (canon in playbook ve-vouch-points), never a repeat vote.',
  '4. Recorded lines that say vote get a new line for Sean to record; videos whose screenshots show votes are re-made after the pages change.'),
 'see_also', jsonb_build_array('playbook ve-vouch-points','canon-nearectory-directory-system-of-record')),
'active','sar',true,14,array['vegans-explore','vouch','directory','rankings','canon'],1,'Vouch for everything, once (Sean 2026-11-18)','logan','logan'
where not exists (select 1 from knowledge_records where slug='canon-ve-vouch-everything');
