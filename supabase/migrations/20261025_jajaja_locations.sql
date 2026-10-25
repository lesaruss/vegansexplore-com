-- Jajaja Mexicana as one group (Sean, 2026-10-25: "For Jajaja Mexicana - Manhattan. Is that the same as its West Village
-- location?"). Applied 2026-10-25; every change is a ve_listing_edits row (meta.where locations). Google Places said:
-- 162 E Broadway (Lower East Side) is permanently closed; 63 Carmine St (West Village) is open and was not listed; the live
-- "Jajaja Mexicana" carried the Lower East Side street with the Brooklyn place, pin and hours; Wynwood shared its address.
-- Main listing: jajaja-mexicana, now the West Village place (its pin and hours fill from Google overnight).
-- Locations: Williamsburg (Brooklyn, takes its own place, pin and hours), Wynwood (Miami, now jajaja-mexicana-wynwood) and
-- Lower East Side (renamed from "- Manhattan", Permanently closed, kept under Closed).
update listings set google_place_id = null where id = 'a902de4e-45a8-41f6-97a4-bcfcc71242f1';
update listings set parent_id = 'a902de4e-45a8-41f6-97a4-bcfcc71242f1', location_label = 'Williamsburg', google_place_id = 'ChIJgV3yD_lZwokRPTi6aPfX2yo'
  where id = 'ae8ef761-7ed1-4881-bd91-7fc8d7f9af03';
update listings set location_label = 'West Village', address_street = '63 Carmine St', address_zip = '10014', phone = '(917) 262-0184',
  google_place_id = 'ChIJh-s4YNNZwokRKuwXrP5FHqY', latitude = null, longitude = null, google_hours_json = null
  where id = 'a902de4e-45a8-41f6-97a4-bcfcc71242f1';
update listings set parent_id = 'a902de4e-45a8-41f6-97a4-bcfcc71242f1', location_label = 'Wynwood', slug = 'jajaja-mexicana-wynwood'
  where id = '875f2d93-f367-4a8e-b583-9b0e72158d03';
update listings set parent_id = 'a902de4e-45a8-41f6-97a4-bcfcc71242f1', location_label = 'Lower East Side', name = 'Jajaja Mexicana - Lower East Side'
  where id = 'be8d9cf9-b390-49e1-90d5-6e997eb8308d';
select ve_listing_set_state('be8d9cf9-b390-49e1-90d5-6e997eb8308d', 'closed', '72712a4a-ea0e-4ef4-a29e-d382496ef8da',
  'Google says the Lower East Side location (162 E Broadway) is permanently closed.', null);
