-- The maps of Kaseya Center, Amerant Bank Arena and loanDepot park (Sean, 2026-10-29: the seating charts he sent as screenshots;
-- read the same way as Hard Rock Stadium's, each level's sections clockwise by side). We draw our own map; only the numbers come
-- from the charts. loanDepot park is drawn with home plate at the bottom: the first base line on the right, the third base line on
-- the left and the outfield on top. Amerant Bank Arena's club sections keep their C names (C27), so a club ticket finds its seat.
update public.ve_venues set layout = jsonb_build_object('field', 'basketball', 'ring_m', 500, 'levels', jsonb_build_array(
  jsonb_build_object('level', '100', 'name', '100 level', 'sides', jsonb_build_object(
    'left', jsonb_build_array('124','101'), 'tl', jsonb_build_array('102','103'),
    'top', jsonb_build_array('104','105','106','107','108','109'), 'tr', jsonb_build_array('110','111'),
    'right', jsonb_build_array('112','113'), 'br', jsonb_build_array('114','115'),
    'bottom', jsonb_build_array('116','117','118','119','120','121'), 'bl', jsonb_build_array('122','123'))),
  jsonb_build_object('level', '300', 'name', '300 level', 'sides', jsonb_build_object(
    'left', jsonb_build_array('331','332','301','302'), 'tl', jsonb_build_array('303','304','305'),
    'top', jsonb_build_array('306','307','308','309','310','311'), 'tr', jsonb_build_array('312','313','314'),
    'right', jsonb_build_array('315','316','317','318'), 'br', jsonb_build_array('319','320','321'),
    'bottom', jsonb_build_array('322','323','324','325','326','327'), 'bl', jsonb_build_array('328','329','330'))),
  jsonb_build_object('level', '400', 'name', '400 level', 'sides', jsonb_build_object(
    'left', jsonb_build_array('401','402','403','404','405','406','407','408'), 'tl', jsonb_build_array('409','410'),
    'tr', jsonb_build_array('411','412'), 'right', jsonb_build_array('413','414','415','416','417','418'),
    'br', jsonb_build_array('419','420')))))
where slug = 'kaseya-center';

update public.ve_venues set layout = jsonb_build_object('field', 'hockey', 'ring_m', 550, 'levels', jsonb_build_array(
  jsonb_build_object('level', '100', 'name', '100 level', 'sides', jsonb_build_object(
    'left', jsonb_build_array('108','109'), 'tl', jsonb_build_array('111','112'),
    'top', jsonb_build_array('114','115','116','117','118','119','120','121','122'), 'tr', jsonb_build_array('123','124'),
    'right', jsonb_build_array('125','127','128'), 'br', jsonb_build_array('129','130','131'),
    'bottom', jsonb_build_array('132','133','134','101','102','103','104'), 'bl', jsonb_build_array('105','107'))),
  jsonb_build_object('level', 'C', 'name', 'Club level (C sections)', 'sides', jsonb_build_object(
    'left', jsonb_build_array('C6','C7','C8','C9','C10','C11','C12','C13'), 'tl', jsonb_build_array('CS14B'),
    'top', jsonb_build_array('CS15B','CS16B','C19','CS20A','C21'), 'tr', jsonb_build_array('C22','C23'),
    'right', jsonb_build_array('C24','C25','C26','C27','C28','C29','C30','C31'), 'br', jsonb_build_array('C32','C33'),
    'bottom', jsonb_build_array('C35','CS34B','C2','CS1B','CS3A','C4'), 'bl', jsonb_build_array('CS5'))),
  jsonb_build_object('level', '300', 'name', '300 level', 'sides', jsonb_build_object(
    'left', jsonb_build_array('308','309','310','311','312'), 'tl', jsonb_build_array('313','314'),
    'top', jsonb_build_array('315','316','317','318','319','320','321'), 'tr', jsonb_build_array('322','323'),
    'right', jsonb_build_array('324','325','326','327','328'), 'br', jsonb_build_array('330','331','332'),
    'bottom', jsonb_build_array('333','334','301','302','303'), 'bl', jsonb_build_array('304','305','306')))))
where slug = 'amerant-bank-arena';

update public.ve_venues set layout = jsonb_build_object('field', 'baseball', 'ring_m', 900, 'levels', jsonb_build_array(
  jsonb_build_object('level', '1', 'name', 'Promenade level (sections 1 to 40)', 'sides', jsonb_build_object(
    'right', jsonb_build_array('1','2','3','4','5','6','7','8','9'), 'br', jsonb_build_array('10','11','12'),
    'bottom', jsonb_build_array('13','14','15','16','17','18'), 'bl', jsonb_build_array('19','20','21'),
    'left', jsonb_build_array('22','23','24','25','26','27','28'), 'tl', jsonb_build_array('29','30','31','32'),
    'top', jsonb_build_array('34','35','36','38','39','40'))),
  jsonb_build_object('level', '200', 'name', 'Legends level (200s)', 'sides', jsonb_build_object(
    'right', jsonb_build_array('201','202','203','204','205','206','207','208','209','210','211'),
    'bottom', jsonb_build_array('219','220','221','222','223'), 'bl', jsonb_build_array('224','225'),
    'left', jsonb_build_array('226','227','228'))),
  jsonb_build_object('level', '300', 'name', 'Vista level (300s) and the Home Run Porch', 'sides', jsonb_build_object(
    'right', jsonb_build_array('302','303','304','305','306','307','308','309','310','311','312','313'),
    'br', jsonb_build_array('314','315','316','317','318'), 'bottom', jsonb_build_array('319','320','321','322','323'),
    'bl', jsonb_build_array('324','325'), 'left', jsonb_build_array('326','327'),
    'top', jsonb_build_array('134','135','136','137','138','139','140','141')))))
where slug = 'loandepot-park';

update public.ve_venue_spots s set map_sections = array['105']
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'kaseya-center' and s.name in ('Full Bloom', 'Oakberry Acai');
update public.ve_venue_spots s set map_sections = array['117']
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'kaseya-center' and s.name = 'Phuc Yea';
update public.ve_venue_spots s set map_sections = array['19', '205']
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'loandepot-park' and s.name = 'Taco Bowl stands';
update public.ve_venue_spots s set map_sections = array['40']
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'loandepot-park' and s.name = 'Section 40 stand';
