-- Booking.com first (Sean, 2026-11-11: "Go Booking.com first"). Each stay's own Booking.com page in details.book, found by search
-- 2026-11-11. The Book card on the listing (directory/listing.html bookCta) shows only once details.book_link_code (a /go/ link to the
-- Travelpayouts Booking.com link) is set, after Sean's approval. Il Mansio's Booking.com page is to be found in the Travelpayouts link
-- tool ("Il Mansio Vegan Hotel and Restaurant", Desenzano del Garda). Safe to run twice.
update listings set updated_at = now(),
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('book', jsonb_build_object('provider', 'Booking.com', 'url', v.url, 'found', '2026-11-11'))
from (values
 ('agrivilla-i-pini', 'https://www.booking.com/hotel/it/agriturismo-i-pini.html'),
 ('beck-hall', 'https://www.booking.com/hotel/gb/beck-hall.html'),
 ('casa-mauna', 'https://www.booking.com/hotel/mx/casa-mauna-salchi.html'),
 ('koukoumi', 'https://www.booking.com/hotel/gr/koukoumi.html'),
 ('mother-earth-vegan-hotel', 'https://www.booking.com/hotel/cr/mother-earth-vegan.html'),
 ('plantonia', 'https://www.booking.com/hotel/pl/plantonia-aparthotel.html'),
 ('the-house-of-aia', 'https://www.booking.com/hotel/mx/sandos-palmaia-the-house-of-aia.html')
) v(slug, url)
where listings.slug = v.slug;
