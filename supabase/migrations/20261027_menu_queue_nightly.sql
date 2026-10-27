-- Menus on every food listing (Sean, 2026-10-27: "I would like to see each restaurant listing have a menu").
-- 274 listings held a bare domain as their website (guanabanas.com), which the menu import skipped and the listing page
-- opened as a path on our own site. Each became a full https:// link, logged in ve_listing_edits (undoable from the Depot).
with fix as (
  update listings set website = 'https://' || website
  where coalesce(website,'') <> '' and website !~* '^https?://' and website ~* '^[a-z0-9-]+(\.[a-z0-9-]+)+(/\S*)?$'
  returning id, website)
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'website', to_jsonb(substr(website, 9)), to_jsonb(website), '{"by":"logan","reason":"bare domain made a full link (2026-10-27)"}'::jsonb from fix;

-- Nothing re-queued new food places for the Background writer's menu_import, so listings added since 2026-10-24 never got a
-- menu read. Queue them now and every night.
select public.ve_menu_import_queue();
select cron.schedule('ve-menu-import-queue', '17 7 * * *', 'select public.ve_menu_import_queue()');
