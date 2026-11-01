-- Shared kitchens (Sean, 2026-11-01): a Vegan menu run inside a restaurant that is not Vegan, noted on the listing. No schema change:
-- listings.details.shared_kitchen, saved by ve-listing-media. Applied 2026-11-01 for the first two. Safe to run twice.
update public.listings set details = coalesce(details,'{}'::jsonb) || jsonb_build_object('shared_kitchen',
  jsonb_build_object('host','House of Mac','host_slug',null,'separate',true,'source','team','note',null,'confirmed_at',now()))
where id = '4430f962-7134-46f0-a15e-c362d012159d' and details->'shared_kitchen' is null;
update public.listings set details = coalesce(details,'{}'::jsonb) || jsonb_build_object('shared_kitchen',
  jsonb_build_object('host',null,'host_slug',null,'separate',null,'source','team','note',null,'confirmed_at',now()))
where id = 'e5182326-a66d-426e-a716-52773dc11407' and details->'shared_kitchen' is null;
update public.listings set website = '' where id = 'e5182326-a66d-426e-a716-52773dc11407' and website = 'https://vegansexplore.com';
