-- Story highlight covers (Sean, 2026-11-15: "I need also the story highlight images"): Eat, Events, Guides, Podcast, Join at 1080 x 1920,
-- the section colors and icons from /mocks/brand-kit/social, no words on the picture (the name is typed in Instagram). Added to
-- Instagram's files and to Every file. Safe to run twice (only adds when Instagram has no highlight yet).
with h as (
  select jsonb_agg(jsonb_build_object('label', 'Highlight: ' || n, 'size', '1080 x 1920', 'url', 'https://vegansexplore.com/public/brand-kit/social/highlight-' || s || '.png') order by o) a
  from (values (1,'eat','Eat'),(2,'events','Events'),(3,'guides','Guides'),(4,'podcast','Podcast'),(5,'join','Join')) v(o, s, n)
)
update ve_brand_cartridges c set data = jsonb_set(jsonb_set(c.data, '{social,profiles}',
    (select jsonb_agg(case when p->>'platform' = 'Instagram' then jsonb_set(p, '{files}', (p->'files') || h.a) else p end order by i) from jsonb_array_elements(c.data->'social'->'profiles') with ordinality x(p, i))),
  '{social,files}', (c.data->'social'->'files') || h.a), updated_at = now()
from h
where c.brand_slug = 'vegans-explore'
  and not exists (select 1 from jsonb_array_elements(c.data->'social'->'files') f where f->>'url' like '%highlight-%');
