-- San Francisco, Austin, Denver and Boston join as chapters (Sean, 2026-11-14: "go" on building the four remaining Next Level cities as
-- one batch). Copied from 20261114_chapter_portland.sql, one block per chapter. Steps 0 to 4 run before the opening, each safe to run
-- twice; step 5 waits for Sean's "open". Reach: the Bay Area and Central Texas by city list (with their state), Colorado and Massachusetts
-- whole.

-- 0. A chapter that matches by a city list now also checks the state when it has one, so a Concord or Richmond outside California is
--    never San Francisco's (Los Angeles keeps no state, as before).
create or replace function public.ve_chapter_of(p_city text, p_state text)
 returns text language sql stable set search_path to 'public'
as $function$
  select community_slug from (
    select community_slug, 1 as rank from ve_outreach_cities
      where kind = 'city' and cities is not null and lower(btrim(coalesce(p_city, ''))) = any (select lower(c) from unnest(cities) c)
        and (states is null or btrim(coalesce(p_state, '')) = '' or upper(btrim(p_state)) = any (states))
    union all
    select community_slug, 2 from ve_outreach_cities
      where kind = 'city' and cities is null and states is not null and upper(btrim(coalesce(p_state, ''))) = any (states)
  ) m order by rank limit 1
$function$;

-- 1. Who can call a chapter home.
alter table public.member_communities drop constraint if exists member_communities_community_slug_check;
alter table public.member_communities add constraint member_communities_community_slug_check check (community_slug = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida','seattle','portland','san-francisco','austin','denver','boston']));
alter table public.members drop constraint if exists members_home_community_check;
alter table public.members add constraint members_home_community_check check (home_community is null or home_community = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida','seattle','portland','san-francisco','austin','denver','boston']));

-- 3 first (outreach city, off until Sean turns it on), since ve_chapter_of reads it to place the outreach contacts.
insert into public.ve_outreach_cities (community_slug, name, kind, brand, program, states, cities, enabled, daily_cap) values
  ('san-francisco', 'San Francisco', 'city', 'vegans-explore', 'business-outreach', array['CA'], array['San Francisco','Oakland','Berkeley','San Jose','Palo Alto','Mountain View','Santa Clara','Sunnyvale','Fremont','Hayward','Walnut Creek','Concord','San Mateo','Redwood City','San Rafael','Alameda','Emeryville','Richmond','Daly City','South San Francisco','Burlingame','Menlo Park','Cupertino','Campbell','Los Gatos','Milpitas','Pleasanton','Livermore','Dublin','San Leandro','Albany','El Cerrito','Mill Valley','Sausalito','Novato','Petaluma','Santa Rosa','Napa','Vallejo','Danville','San Ramon','Lafayette','Orinda','Union City','Newark','Saratoga','Los Altos','Half Moon Bay','Pacifica','San Bruno','Millbrae','Belmont','San Carlos','Foster City','Pittsburg','Antioch','Martinez','Pleasant Hill','Castro Valley','Larkspur','Corte Madera','Fairfax','San Anselmo','Morgan Hill','Gilroy','Sebastopol'], false, 30),
  ('austin', 'Austin', 'city', 'vegans-explore', 'business-outreach', array['TX'], array['Austin','Round Rock','Cedar Park','Pflugerville','Georgetown','Leander','San Marcos','Kyle','Buda','Lakeway','Bee Cave','Dripping Springs','Hutto','Manor','Bastrop','Wimberley','New Braunfels','Taylor','Liberty Hill','Lago Vista','West Lake Hills','Sunset Valley','Elgin','Lockhart','Spicewood','Del Valle','Canyon Lake'], false, 30),
  ('denver', 'Denver', 'city', 'vegans-explore', 'business-outreach', array['CO'], null, false, 30),
  ('boston', 'Boston', 'city', 'vegans-explore', 'business-outreach', array['MA'], null, false, 30)
on conflict (community_slug) do nothing;

-- 2 and 4, for each chapter exactly as Portland's (20261114_chapter_portland.sql): the pinned How it works posts copied from
-- Washington, D.C.'s; the outreach contacts placed; the three ad slots like Los Angeles's (house Guide ads, and Humble Cabbage's tee on
-- landscape-2 with its own /go/hc-ve-<slug> link).
do $$
declare ch record;
begin
  for ch in select * from (values ('san-francisco', 'San Francisco'), ('austin', 'Austin'), ('denver', 'Denver'), ('boston', 'Boston')) v(slug, name) loop
    insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
    select ch.slug, p.member_id, p.kind, p.category, replace(p.title, 'Washington, D.C.', ch.name), replace(p.body, 'Washington, D.C.', ch.name), p.status, true
    from public.ve_board_posts p
    where p.community_slug = 'washington-dc' and p.pinned and p.category = 'guide'
      and not exists (select 1 from public.ve_board_posts q where q.community_slug = ch.slug and q.kind = p.kind and q.pinned and q.category = 'guide');

    update public.ve_outreach_contacts set community_slug = ch.slug
      from public.listings l where l.id = ve_outreach_contacts.listing_id and ve_chapter_of(l.address_city, l.address_state) = ch.slug
      and ve_outreach_contacts.community_slug is distinct from ch.slug;

    insert into public.ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, estimated_monthly_views, notes)
    select 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'Community Hub - ' || ch.name, '/communities/' || ch.slug, 've-' || ch.slug || '-hub-' || s.slot,
           'sticky-sidebar', s.dim, 'active', 0, 'Billboard on the shared city hub (communities/hub.html), added 2026-11-14 with the chapter (Sean: go on the four Next Level cities); the landscape pair is also the chapter rail on /directory.'
    from (values ('skyscraper', '300x600'), ('landscape-1', '300x250'), ('landscape-2', '300x250')) s(slot, dim)
    where not exists (select 1 from public.ad_placements p where p.slot_id = 've-' || ch.slug || '-hub-' || s.slot);
    insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active)
    values ('hc-ve-' || ch.slug, 'Humble Cabbage ad · VE ' || ch.name || ' chapter', 'https://humblecabbage.com/products/6abc6a2e5158794d5f0c9c6a', 'humble-cabbage-ads', array['ad','humble-cabbage','vegans-explore',ch.slug], 'other', true)
    on conflict (code) do nothing;
    insert into public.ad_campaign_placements (campaign_id, placement_id)
    select cp.campaign_id, sp.id
    from public.ad_placements lp
    join public.ad_campaign_placements cp on cp.placement_id = lp.id
    join public.ad_campaigns c on c.id = cp.campaign_id and c.status = 'active' and c.sponsor_campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'
    join public.ad_placements sp on sp.slot_id = replace(lp.slot_id, 've-los-angeles-hub-', 've-' || ch.slug || '-hub-')
    where lp.slot_id like 've-los-angeles-hub-%'
      and not exists (select 1 from public.ad_campaign_placements x where x.placement_id = sp.id and x.campaign_id = cp.campaign_id);
    with src as (
      select c.* from public.ad_campaigns c join public.ad_campaign_placements cp on cp.campaign_id = c.id
      join public.ad_placements p on p.id = cp.placement_id and p.slot_id = 've-los-angeles-hub-landscape-2' where c.status = 'active' limit 1
    ), tgt as (select id from public.ad_placements where slot_id = 've-' || ch.slug || '-hub-landscape-2'),
    made as (
      insert into public.ad_campaigns (campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id, asset_id)
      select 'Humble Cabbage - VE Tee (Community Hub - ' || ch.name || ', ve-' || ch.slug || '-hub-landscape-2)', s.sponsor_name, s.campaign_type,
             replace(s.creative_url, 'c=maya', 'c=nori'), 'https://vegansexplore.com/go/hc-ve-' || ch.slug, date '2026-11-14', 'active',
             'Copied from Los Angeles landscape-2 when ' || ch.name || ' opened (2026-11-14). Clicks tracked by /go/hc-ve-' || ch.slug || '.', s.sponsor_campaign_id, s.asset_id
      from src s
      where not exists (select 1 from public.ad_campaign_placements cp join public.ad_campaigns c on c.id = cp.campaign_id join tgt on tgt.id = cp.placement_id
                        where c.status = 'active' and c.sponsor_campaign_id = '2a088365-5de6-4de7-abbc-a5f8bac0eddb')
      returning id
    )
    insert into public.ad_campaign_placements (campaign_id, placement_id) select made.id, tgt.id from made, tgt;
  end loop;
end $$;

-- The chapter cards' numbers (ve_chapter_stats) read before the opening, so the preview shows real counts (as Portland's).
do $$
declare d text;
begin
  d := pg_get_functiondef('public.ve_chapter_stats'::regproc);
  if position('''boston''' in d) = 0 then execute replace(d, '''portland'',''london'']', '''portland'',''san-francisco'',''austin'',''denver'',''boston'',''london'']'); end if;
end $$;

-- 5. At the opening (on Sean's "open"; not run until then): the local Daily Pulse, the next-chapter board, and the two other
--    database functions that list chapters by hand.
update public.lesaruss_dispatch_settings set value = jsonb_set(value::jsonb, '{communities}', (value::jsonb->'communities') || (select coalesce(jsonb_agg(c), '[]'::jsonb) from unnest(array['san-francisco','austin','denver','boston']) c where not (value::jsonb->'communities') ? c))::text
  where key = 'pulse_auto' and not (value::jsonb->'communities') ? 'boston';
update public.ve_next_chapters set status = 'opened', opened_hub = slug where slug in ('san-francisco','austin') and status <> 'opened';
do $$
declare d text;
begin
  d := pg_get_functiondef('public.ve_pulse_auto_queue'::regproc);
  if position('"boston"' in d) = 0 then execute replace(d, '"portland":"Portland Pulse",', '"portland":"Portland Pulse","san-francisco":"San Francisco Pulse","austin":"Austin Pulse","denver":"Denver Pulse","boston":"Boston Pulse",'); end if;
  d := pg_get_functiondef('public.ve_creator_application_link'::regproc);
  if position('''boston''' in d) = 0 then execute replace(d, 'when ''portland'' then ''OR''', 'when ''portland'' then ''OR'' when ''san-francisco'' then ''CA'' when ''austin'' then ''TX'' when ''denver'' then ''CO'' when ''boston'' then ''MA'''); end if;
end $$;
