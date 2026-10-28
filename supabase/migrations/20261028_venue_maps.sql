-- Venue maps and "Get me there" (Sean, 2026-10-28: "show a map of the stadium and where these things are with a locator
-- icon... be anywhere in the stadium and... show me where exactly to go"). We draw our own map from the section numbers (never
-- the venue's chart): ve_venues.layout holds each level's sections in clockwise order by side of the bowl, and a stand's
-- map_sections put its pins; map_level says which level a stand is on when we only know the level. Hard Rock Stadium's
-- sections were read from its seating chart (a screenshot Sean sent, 2026-10-28).
alter table public.ve_venues add column if not exists layout jsonb;
alter table public.ve_venue_spots add column if not exists map_sections text[] not null default '{}';
alter table public.ve_venue_spots add column if not exists map_level text;

-- Sides run clockwise as the chart is drawn: top left to right, right top to bottom, bottom right to left, left bottom to top;
-- tl, tr, br, bl are the corners. ring_m is the 100 level concourse loop in meters (outer levels scale with their ring).
update public.ve_venues set layout = jsonb_build_object(
  'field', 'football', 'ring_m', 800,
  'levels', jsonb_build_array(
    jsonb_build_object('level', '100', 'name', '100 level', 'sides', jsonb_build_object(
      'top', jsonb_build_array('114','115','116','117','118','119','120','121','122'),
      'tr', jsonb_build_array('125','126'),
      'right', jsonb_build_array('129','130','131','132','133','134','135'),
      'br', jsonb_build_array('138','139'),
      'bottom', jsonb_build_array('142','143','144','The 72 Club','148','149','150'),
      'bl', jsonb_build_array('153','154'),
      'left', jsonb_build_array('101','102','103','104','105','106','107'),
      'tl', jsonb_build_array('110','111'))),
    jsonb_build_object('level', '200', 'name', '200 level (club)', 'sides', jsonb_build_object(
      'top', jsonb_build_array('214','215','216','217','218','219','220','221','222','223'),
      'tr', jsonb_build_array('225','226'),
      'right', jsonb_build_array('229','230','231','232','233','234','235'),
      'br', jsonb_build_array('238','239'),
      'bottom', jsonb_build_array('242','243','244','245','246','247','248','249','250'),
      'bl', jsonb_build_array('252','253','254'),
      'left', jsonb_build_array('201','202','203','204','205','206','207'),
      'tl', jsonb_build_array('210','211'))),
    jsonb_build_object('level', '300', 'name', '300 level (upper deck)', 'sides', jsonb_build_object(
      'top', jsonb_build_array('313','314','315','316','317','318','319','320','321','322','323'),
      'tr', jsonb_build_array('324','325','326','327'),
      'right', jsonb_build_array('328','329','330','331','332','333','334','335','336'),
      'br', jsonb_build_array('337','338','339','340'),
      'bottom', jsonb_build_array('341','342','343','344','345','346','347','348','349','350','351'),
      'bl', jsonb_build_array('352','353','354','355'),
      'left', jsonb_build_array('356','301','302','303','304','305','306','307','308'),
      'tl', jsonb_build_array('309','310','311','312')))))
where slug = 'hard-rock-stadium';

update public.ve_venue_spots s set map_sections = array['122A','150A','322A','327A','347A']
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'hard-rock-stadium' and s.name = 'Wynwood Walkthrough';
update public.ve_venue_spots s set map_level = '200'
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'hard-rock-stadium' and s.name = 'Shawarma Shack';
update public.ve_venue_spots s set map_level = '300'
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'hard-rock-stadium' and s.name = 'Phuc Yea';
