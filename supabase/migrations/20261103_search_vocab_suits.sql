-- Search vocabulary for suits (Sean, 2026-11-03: "vegan suit" read as fuzzy names, Su Vegan Buffet and Sunlife). A phrase maps to
-- Clothing and Fashion with the Suits & formal product kind (WILDA.ECO). Rows only, no code: the engine holds nothing Vegan.
insert into public.ve_search_vocab (brand, phrase, label, cats, kinds, cuisines)
select 'vegans-explore', p, 'Suits & formal', array['Clothing and Fashion'], array['formal'], '{}'::text[]
from unnest(array['suit','suits','blazer','blazers','tuxedo','tuxedos','formal wear','formalwear','business suit','wedding suit']) p
where not exists (select 1 from public.ve_search_vocab v where v.brand = 'vegans-explore' and v.phrase = p);
