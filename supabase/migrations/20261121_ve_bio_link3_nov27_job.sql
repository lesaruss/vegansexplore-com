-- One-time job: on Nov 27 at 12:05 AM Eastern (05:05 UTC) Instagram bio link 3 goes back from ThanksLiving to the Holiday Guide, then the job
-- removes itself (Sean, 2026-11-15: link 3 opens ThanksLiving until Thanksgiving). Set from the wrap of the 2026-11-15 chat on 2026-11-21.
select cron.schedule('ve-bio-link3-holiday-nov27', '5 5 27 11 *', $job$
update ve_links set destination = 'https://vegansexplore.com/guides/holiday-guide', label = 'Vegans Explore profile link: The Holiday Guide' where code = 've-link-holiday';
update ve_brand_cartridges set data = jsonb_set(data, '{social,links}', (select jsonb_agg(case when l->>'url' like '%/ve-link-holiday' then l || '{"title":"The Holiday Guide","note":"On Instagram. Until Christmas, then swap in the next seasonal Guide."}'::jsonb else l end order by ord) from jsonb_array_elements(data->'social'->'links') with ordinality t(l, ord))), updated_at = now() where brand_slug = 'vegans-explore';
insert into playbook_records (slug, brand_slug, author, body, source, kind, applied) values ('ve-social-schedule','vegans-explore','Logan','Bio link 3 switched back to the Holiday Guide by the one-time database job ve-bio-link3-holiday-nov27 (Nov 27 12:05 AM ET). Sean: on Instagram, rename link 3 to The Holiday Guide (same link).','text','decision',true);
select cron.unschedule('ve-bio-link3-holiday-nov27');
$job$);
