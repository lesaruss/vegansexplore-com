-- ve-vegan-sourcing-guide: Sean's calls, 2026-11-05.
-- 1. Plant-fiber packaging gets its own label, Plant-based material (a material, not a Vegan claim), and shows.
-- 2. Cheeze and Thank You and The Vegan Copacker upgrade to Fully vegan company (whole-company quotes).
-- 3. TopLine stays hidden (off the PETA seed). The 24 PETA rows without a bio stay listed, name and website only.
alter table ve_suppliers drop constraint if exists ve_suppliers_label_check;
alter table ve_suppliers add constraint ve_suppliers_label_check
  check (label = any (array['peta_approved','fully_vegan','offers_options','plant_material']));
update ve_suppliers set label='plant_material', status='active', updated_at=now()
 where slug in ('green-paper-products','good-start-packaging','simply-pak','vitaveg-eco-packaging','ams-compostable');
update ve_suppliers set label='fully_vegan', updated_at=now() where slug in ('cheeze-and-thank-you','the-vegan-copacker');
