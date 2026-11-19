-- Brand kit > Web sitemap: /partners/giving moved onto the Guide layout (Sean, 2026-11-19: "I much prefer this layout"), so it joins the
-- Welcome Guide's family; the Walkthrough parent now shows /mocks/brand-kit/web. Pictures: lesaruss-hq public/branddesk/web/vegans-explore/.
update ve_brand_cartridges set data = jsonb_set(data, '{web,map}', (
  select jsonb_agg(case
    when e->>'name'='Walkthrough' then e || jsonb_build_object('img','https://hq.lesaruss.ai/branddesk/web/vegans-explore/walkthrough.jpg','href','https://vegansexplore.com/mocks/brand-kit/web','what','The guided white stage, every part from ve-kit.css: one slide at a time, Back, N of M, Next. For walkthroughs, mocks and concept pages.')
    when e->>'name'='The Welcome Guide' and not (e->'children' @> '[{"name":"11 Days of Giving for Brands"}]') then e || jsonb_build_object('children', (e->'children') || jsonb_build_array(jsonb_build_object('name','11 Days of Giving for Brands','img','https://hq.lesaruss.ai/branddesk/web/vegans-explore/giving.jpg','href','https://vegansexplore.com/partners/giving','what','The page brands land on from our email: the offer as a Guide, Liz on every part (Sean''s recordings), Save your day. On the Guide layout since 2026-11-19.','status','New look')))
    else e end order by o)
  from jsonb_array_elements(data->'web'->'map') with ordinality as t(e,o))), updated_at = now()
where brand_slug='vegans-explore';
