-- BrandDesk > Brand kit > Social kit: Instagram carries the first five of the 11 profile links (Sean, 2026-11-15: "yes, first five on
-- Instagram"; Instagram allows five links). The Instagram tab says so, and links 1 to 5 are marked "On Instagram." Safe to run twice.
update ve_brand_cartridges set data = jsonb_set(data, '{social}',
  (data->'social')
  || jsonb_build_object('profiles', (select jsonb_agg(case when p->>'platform'='Instagram' then p || '{"note":"Links: the first five in the list below, in order (Instagram allows five): Edit profile > Links, Copy title and Copy link for each."}'::jsonb else p end order by ord) from jsonb_array_elements(data->'social'->'profiles') with ordinality t(p, ord)))
  || jsonb_build_object('links', (select jsonb_agg(case when ord <= 5 then l || jsonb_build_object('note', trim(both ' ' from 'On Instagram. ' || coalesce(l->>'note',''))) else l end order by ord) from jsonb_array_elements(data->'social'->'links') with ordinality t(l, ord)))
), updated_at = now()
where brand_slug='vegans-explore' and not (data->'social'->'links'->0->>'note' like 'On Instagram%');
