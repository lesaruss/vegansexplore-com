-- The People seed, second pass (2026-10-28): the guests the first pass left out because the May import already held a quarantined
-- listing with the same name and no city (Robert Cheeke, Torre Washington, Dotsie Bausch...). That listing becomes their profile
-- (approved, the People section, every chapter, no How Vegan), keeping the Instagram handle the import found, and its backlog row is
-- closed as listed. Then every People profile gets its episodes as credits (on conflict nothing), so this pass can run again.

create temp table _people on commit drop as select * from (values
  ('Neal Barnard', 'Physicians', array['%Neal Barnard%'], 'Guest'),
  ('Michael Klaper', 'Physicians', array['%Klaper%'], 'Guest'),
  ('Joel Kahn', 'Physicians', array['%Joel Kahn%'], 'Guest'),
  ('Angie Sadeghi', 'Physicians', array['%Angie Sadeghi%'], 'Guest'),
  ('Aaron Spitz', 'Physicians', array['%Aaron Spitz%'], 'Guest'),
  ('Will Bulsiewicz', 'Physicians', array['%Bulsiewicz%'], 'Guest'),
  ('Lakshman Mulpuri', 'Physicians', array['%Mulpuri%'], 'Guest'),
  ('Mari Mitrani', 'Health Experts', array['%Mari Mitrani%'], 'Guest'),
  ('Angela Crawford', 'Health Experts', array['%Angela Crawford%'], 'Guest'),
  ('Desiree Nielsen', 'Health Experts', array['%Desiree Nielsen%'], 'Guest'),
  ('Cyrus Khambatta', 'Health Experts', array['%Khambatta%'], 'Guest'),
  ('Robby Barbaro', 'Health Experts', array['%Robby Barbaro%'], 'Guest'),
  ('Evie Kevish', 'Health Experts', array['%Evie Kevish%'], 'Guest'),
  ('Tabay Atkins', 'Health Experts', array['%Tabay Atkins%'], 'Guest'),
  ('Kwame Terra', 'Health Experts', array['%Kwame Terra%'], 'Guest'),
  ('James and Dahlia Marin', 'Health Experts', array['%Dahlia Marin%'], 'Guest'),
  ('Sailesh Rao', 'Activists', array['%Sailesh Rao%'], 'Guest'),
  ('Earthling Ed', 'Activists', array['%Earthling Ed%'], 'Guest'),
  ('Ingrid Newkirk', 'Activists', array['%Ingrid Newkirk%'], 'Guest'),
  ('Charles Grippo', 'Activists', array['%Charles Grippo%'], 'Guest'),
  ('Susan Hargraves', 'Activists', array['%Susan Hargraves%'], 'Guest'),
  ('Jane Velez-Mitchell', 'Activists', array['%Velez-Mitchell%'], 'Guest'),
  ('Gail Eisnitz', 'Activists', array['%Eisnitz%'], 'Guest'),
  ('Vicky Bond', 'Activists', array['%Vicky Bond%'], 'Guest'),
  ('James Wildman', 'Activists', array['%James Wildman%'], 'Guest'),
  ('Renee King-Sonnen', 'Activists', array['%King-Sonnen%'], 'Guest'),
  ('Gwenna Hunter', 'Activists', array['%Gwen%a Hunter%'], 'Guest'),
  ('Sarina Farb', 'Activists', array['%Sarina Farb%'], 'Guest'),
  ('Dotsie Bausch', 'Athletes', array['%Dotsie Bausch%'], 'Guest'),
  ('Torre Washington', 'Athletes', array['%Torre Washington%', '%Tory Washington%'], 'Guest'),
  ('Korin Sutton', 'Athletes', array['%Korin Sutton%'], 'Guest'),
  ('Robert Cheeke', 'Athletes', array['%Robert Cheeke%'], 'Guest'),
  ('Natalie Matthews', 'Athletes', array['%Natalie Matthews%'], 'Guest'),
  ('Giacomo Marchese', 'Athletes', array['%Giacomo Marchese%'], 'Guest'),
  ('Nick Squire', 'Athletes', array['%Nick Squire%'], 'Guest'),
  ('Ben Mitchell', 'Athletes', array['%Ben Mitchell%'], 'Guest'),
  ('Ashley King', 'Athletes', array['%Ashley King%'], 'Guest'),
  ('Tomi Jessen', 'Athletes', array['%Tomi Jessen%'], 'Guest'),
  ('Omar Glaspy', 'Athletes', array['%Omar Glaspy%'], 'Guest'),
  ('Ella Magers', 'Athletes', array['%Ella Magers%'], 'Guest'),
  ('Maxime Sigouin', 'Athletes', array['%Maxime Sigouin%'], 'Guest'),
  ('Shabnam Islam', 'Athletes', array['%Shabnam Islam%'], 'Guest'),
  ('Buff Vegan Barbie', 'Athletes', array['%Buff Vegan Barbie%'], 'Guest'),
  ('John Thomas', 'Athletes', array['%John Thomas%', '%Bodybuilding Vegan%'], 'Guest'),
  ('Brooke Sellers', 'Athletes', array['%Brooke Sellers%', '%Miss Meatless Muscle%'], 'Guest'),
  ('John Lewis', 'Content Creators', array['%John Lewis%'], 'Guest'),
  ('Jason Kartalian', 'Content Creators', array['%Kartalian%'], 'Guest'),
  ('Keya, VeganKween', 'Content Creators', array['%VeganKween%'], 'Guest'),
  ('Kaie Alexander', 'Content Creators', array['%Kaie Alexander%'], 'Guest'),
  ('Alex Lenghel', 'Content Creators', array['%Alex Lenghel%'], 'Guest'),
  ('Alex Yabonk', 'Content Creators', array['%Yabonk%'], 'Guest'),
  ('Feldi', 'Content Creators', array['%Feldi%'], 'Guest'),
  ('Honey LaBronx', 'Content Creators', array['%Honey LaBronx%'], 'Guest'),
  ('The Plant Chicks', 'Content Creators', array['%Plant Chicks%'], 'Guest'),
  ('The Sustainable Duo', 'Content Creators', array['%Sustainable Duo%'], 'Guest'),
  ('Plantbased in the Burbs', 'Content Creators', array['%Plantbased in the Burbs%'], 'Guest'),
  ('Chef Babette', 'Chefs', array['%Babette%'], 'Guest'),
  ('Chef Robyn', 'Chefs', array['%Chef Robyn%'], 'Guest'),
  ('Jenny Stojkovic', 'Founders', array['%Stojkovic%'], 'Guest'),
  ('Tim James', 'Founders', array['%Tim James%'], 'Guest'),
  ('Brighde Reed', 'Founders', array['%Brighde Reed%'], 'Guest'),
  ('Sandra Nomoto', 'Founders', array['%Sandra Nomoto%'], 'Guest'),
  ('Allen Zelden', 'Founders', array['%Allen Zelden%'], 'Guest'),
  ('Veronica Menin', 'Founders', array['%Veronica Menin%'], 'Guest'),
  ('Noah Hyams', 'Founders', array['%Noah Hyams%'], 'Guest'),
  ('Brett Christoffel', 'Founders', array['%Brett Christoffel%'], 'Guest'),
  ('Vladimir Mićković', 'Founders', array['%Mićković%', '%Mickovic%'], 'Guest'),
  ('Jacobo Garcia', 'Founders', array['%Jacobo Garcia%'], 'Guest'),
  ('Dani Taylor', 'Founders', array['%Dani Taylor%'], 'Guest'),
  ('Chris Moore', 'Activists', array['%Chris Moore%'], 'Guest'),
  ('Dominic Thompson', 'Activists', array['%Dominic Thompson%'], 'Guest'),
  ('Gad Hakimi', 'Activists', array['%Gad Hakimi%'], 'Guest'),
  ('Jeff Palmer', 'Activists', array['%Jeff Palmer%'], 'Guest'),
  ('Jonny Juicer', 'Content Creators', array['%Jonny Juicer%'], 'Guest'),
  ('Jordan David', 'Activists', array['%Jordan David%'], 'Guest'),
  ('Liz Jones', 'Activists', array['%Liz Jones%'], 'Guest'),
  ('Margarita Restrepo', 'Activists', array['%Margarita Restrepo%'], 'Guest'),
  ('Rachel Black', 'Activists', array['%Rachel Black%'], 'Guest'),
  ('Richard "Kudo" Couto', 'Activists', array['%Couto%'], 'Guest')
) v(name, category, pats, role);

with promote as (
  update public.listings x set status = 'approved', category = p.category, communities = array['all'], location = 'Online', vegan_status = null,
    crawl_source = 'people', updated_at = now(),
    details = coalesce(x.details, '{}'::jsonb) || jsonb_build_object('person', jsonb_build_object('added', 'podcast guests, 2026-10-28, from the May import'))
  from _people p
  where lower(btrim(x.name)) = lower(p.name) and x.status = 'quarantined' and coalesce(x.address_city, '') = '' and coalesce(x.address_state, '') = ''
    and not exists (select 1 from listings y where y.crawl_source = 'people' and lower(btrim(y.name)) = lower(p.name))
    and exists (select 1 from ve_pulse_content c where c.status = 'published' and c.podcast_show is not null
                  and (c.guest_name ilike any (p.pats) or c.title ilike any (p.pats)))
  returning x.id
), closed as (
  update public.ve_backlog_checks b set decision = 'listed', decided_at = now() from promote where b.listing_id = promote.id and b.decision is null
  returning b.listing_id
)
select count(*) from promote;

insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select l.id, 'episode', p.role, c.id, c.published_at::date
from _people p join listings l on l.crawl_source = 'people' and l.status = 'approved' and lower(btrim(l.name)) = lower(p.name)
join ve_pulse_content c on c.status = 'published' and c.podcast_show is not null and (c.guest_name ilike any (p.pats) or c.title ilike any (p.pats))
on conflict do nothing;
