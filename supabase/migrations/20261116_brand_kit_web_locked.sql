-- Brand kit > Web locked by Sean, 2026-11-16: "So let's go ahead and lock it".
update ve_brand_cartridges set data = jsonb_set(jsonb_set(data, '{web,state}', '"locked"'), '{web,locked}', to_jsonb('Locked by Sean, 16 Nov 2026 ("So let''s go ahead and lock it"): the visual sitemap, 8 parent pages from the template table'::text)), updated_at = now() where brand_slug='vegans-explore';
