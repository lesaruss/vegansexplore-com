-- ve-community-directory K corrections (Logan, 2026-11-08), from the Nov 7 checks K missed:
-- website links taken off (spam, domain gone, now another name), old link kept in details.website_broken; Ou La La (Phoenix) taken back off.
update listings l set website = '', details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('website_broken', l.website)
where id in ('aab04379-e387-4b20-b255-e479631cd011','5d38702c-cfc9-4191-ac2a-0cb5244b0ae2','8a5d41a2-bc21-4e71-805f-8112c86a2305') and website <> '';
select ve_listing_set_state('0d78c3d2-242d-4033-bf49-38e3042bc0a1', 'removed', (select id from members where is_superadmin and email ilike 'contact@lesaruss.com' limit 1),
 'Taken back off (Logan, 2026-11-08): listed in K under Los Angeles by mistake; Ou La La is in Phoenix, outside our chapters.', array['Outside our chapters'])
where exists (select 1 from listings where id='0d78c3d2-242d-4033-bf49-38e3042bc0a1' and status='approved');
