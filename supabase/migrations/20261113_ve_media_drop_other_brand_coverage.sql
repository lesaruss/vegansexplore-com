-- Media list cleanup (2026-11-13, playbook ve-newsroom). Applied 2026-11-13 through the connector, recorded here after the fact.
-- The News Desk also holds the LESARUSS AI brand's tech feeds; 1,506 of those stories had come into the Vegan media list. They are removed,
-- then any outlet left with no articles (15), then the scores are rolled up again. ve-media-alerts reads only Vegans Explore stories since.
delete from public.ve_media_coverage c using public.ve_news_leads l
where l.id = c.news_lead_id and l.brand_slug <> 'vegans-explore';
delete from public.ve_media_outlets o where not exists (select 1 from public.ve_media_coverage c where c.outlet_id = o.id);
select public.ve_media_outlets_rollup();
