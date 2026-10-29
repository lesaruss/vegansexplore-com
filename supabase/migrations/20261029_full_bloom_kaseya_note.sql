-- Full Bloom at Kaseya Center (Sean, 2026-10-29: "are we sure Full Bloom is still open... they shut down as a business in their main
-- location"). Its Miami Beach restaurant is reported permanently closed (HappyCow, July 2025; Spinach Guide; MapQuest), and the arena
-- stand comes from the 2024-25 season (Axios, October 2024), so the Guide asks fans to check it is still open, and its items are
-- Ask before you order until a member confirms them.
update public.ve_venue_spots s set note = 'Full Bloom''s Miami Beach restaurant closed in 2025, and this stand is from the 2024-25 season. Check it is still open before you go.'
  from public.ve_venues v where s.venue_id = v.id and v.slug = 'kaseya-center' and s.name = 'Full Bloom';
update public.ve_venue_items i set vegan = 'ask'
  from public.ve_venue_spots s, public.ve_venues v where i.spot_id = s.id and s.venue_id = v.id and v.slug = 'kaseya-center' and s.name = 'Full Bloom';
