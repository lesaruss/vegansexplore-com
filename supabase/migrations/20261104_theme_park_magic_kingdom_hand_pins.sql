-- ve-theme-park-guide: hand pins for the two Magic Kingdom spots Google could not place.
-- Sean approved the coordinates 2026-11-04. Estimated from the layout and neighbouring Google pins
-- (within about 30 m of a verified pin), so pin_source is 'hand'. No Google call.
update ve_venue_spots s
set latitude  = case s.name when 'Aloha Isle' then 28.41838 else 28.41955 end,
    longitude = case s.name when 'Aloha Isle' then -81.58246 else -81.58250 end,
    pin_source = 'hand'
from ve_venues v
where v.id = s.venue_id and v.kind = 'theme_park' and s.status = 'live'
  and s.name in ('Aloha Isle', 'Liberty Square Market') and s.latitude is null;
