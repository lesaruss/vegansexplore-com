-- Brand kit > Web locked by Sean, 2026-11-16: "So let's go ahead and lock it".
update ve_brand_cartridges set data = jsonb_set(jsonb_set(data, '{web,state}', '"locked"'), '{web,locked}', to_jsonb('Locked by Sean, 16 Nov 2026 ("So let''s go ahead and lock it"): the visual sitemap, 8 parent pages from the template table'::text)), updated_at = now() where brand_slug='vegans-explore';
-- /partners and the sample pitch retired (Sean, 2026-11-16): the Walkthrough parent loses them on the sitemap.
update ve_brand_cartridges set data = jsonb_set(data, '{web,map}', (select jsonb_agg(case when e->>'name'='Walkthrough' then e - 'children' else e end order by o) from jsonb_array_elements(data->'web'->'map') with ordinality as t(e,o))), updated_at = now() where brand_slug='vegans-explore';
