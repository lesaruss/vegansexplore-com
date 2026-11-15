-- Local businesses listed "Online" showed in every chapter (Sean, 2026-11-15: a Decatur, GA bakery showed in Seattle).
-- Online is not nationwide: each goes to its own city and chapter. Safe to run twice.
update listings set address_city='Decatur', address_state='GA', location='Decatur, GA', communities=array['atlanta']
 where id='29b38ea6-bf7d-483e-b8b1-a42b23428f77'; -- VTasteCakes
update listings set address_city='Fort Lauderdale', address_state='FL', location='Fort Lauderdale, FL', communities=array['south-florida']
 where id='949ab981-ee88-49a3-876c-b6b89bb1f3cc'; -- The Vegan Temple
update listings set address_city='Los Angeles', address_state='CA', communities=array['los-angeles']
 where id='6527fcaa-6a9c-4a6c-b537-3d88568f4472'; -- Vegan Healing Arts
update listings set communities=array['north-florida','central-florida','south-florida']
 where id='b6282724-19c5-4f02-8ab3-45dc18a88a20'; -- Vegan Squad, a Florida meetup crew
update listings set communities=array['none']
 where id='b1251654-2e59-4d06-bdc1-5f03ad777c3c'; -- Amy's Lil Chunks of Love: location unknown, in no chapter until placed
