-- The Supermarket Guide by what it is (Sean, 2026-11-01: "put dairy, meat. And then when you click on that, we have all the products
-- together... sort it by the type... the brand"; "refrigerated, frozen, aisles or shelves, and produce to show where things are").
-- A store's spots become six categories and its items the types inside them, each the thing members map (its aisle at this store
-- goes in the item's description). Where a type usually sits (refrigerated, frozen, shelf, produce) is TYPES in
-- guide-scripts/supermarket-guide.js, keyed by these names. No member report, save or photo sat on the old sections, so every store
-- is reseeded from the new template; a store added later (the Central Florida import) gets it from ve_supermarket_seed_store.

create or replace function public.ve_supermarket_seed_store(p_venue uuid)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare d record; v_sec text; v_spot uuid; n integer := 0; i integer;
begin
  if exists (select 1 from ve_venue_spots where venue_id = p_venue) then return 0; end if;
  for d in select * from (values
      (1, 'Dairy-free', array['Milk','Coffee creamer','Yogurt','Sour cream','Butter','Cheese','Cream cheese','Ice cream']),
      (2, 'Plant-based meat and protein', array['Fresh plant-based meat','Frozen plant-based meat','Tofu and tempeh']),
      (3, 'Ready meals', array['Frozen meals','Refrigerated meals']),
      (4, 'Pantry', array['Beans and lentils','Nut butters','Protein powder']),
      (5, 'Snacks and sweets', array['Chips and snacks','Cookies and treats','Hummus and dips']),
      (6, 'Produce', array['Fruit','Vegetables','Leafy greens and herbs'])) as t(ord, cat, secs)
  loop
    insert into ve_venue_spots (venue_id, name, where_text, sort_order, status)
    values (p_venue, d.cat, 'Aisles not mapped yet', d.ord, 'live') returning id into v_spot;
    i := 0;
    foreach v_sec in array d.secs loop
      i := i + 1;
      insert into ve_venue_items (venue_id, spot_id, name, description, vegan, sort_order, status)
      values (p_venue, v_spot, v_sec, 'Aisle not mapped yet. Be the first to tell us where it is in this store.', 'vegan', i, 'live');
      n := n + 1;
    end loop;
  end loop;
  return n;
end $function$;

do $$
declare v record; total int := 0;
begin
  if exists (select 1 from ve_venue_reports r join ve_venues x on x.id = r.venue_id where x.kind = 'supermarket') then
    raise exception 'supermarket reports exist; reseeding would orphan them';
  end if;
  delete from ve_venue_items where venue_id in (select id from ve_venues where kind = 'supermarket');
  delete from ve_venue_spots where venue_id in (select id from ve_venues where kind = 'supermarket');
  for v in select id from ve_venues where kind = 'supermarket' loop
    total := total + ve_supermarket_seed_store(v.id);
  end loop;
  raise notice 'seeded % items', total;
end $$;
