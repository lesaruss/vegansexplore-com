-- Earthy Picks told us by email (2026-11-17) about their winter special. Business-provided, so it goes live (CLAUDE.md "What Sean hands over goes live").
-- source 'import' because an unclaimed listing shows only fresh imported items (listing.html, ownedMenu filter).
insert into ve_menu_items (listing_id, category, name, description, is_vegan, is_featured, is_available, sort_order, source, checked_at)
select 'cc53ff6d-dea3-4d70-a844-72dfc82fba98','Winter Special','Abuelita Angel Hair Soup','Earthy Picks'' special soup for the winter season.',true,true,true,0,'import',now()
where not exists (select 1 from ve_menu_items where listing_id='cc53ff6d-dea3-4d70-a844-72dfc82fba98' and name='Abuelita Angel Hair Soup');
