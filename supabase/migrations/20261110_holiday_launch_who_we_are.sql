-- Holiday launch emails say who we are (Sean, 2026-11-10: "a lot of these people have no idea who we are... give them a little bit, like a
-- line at least of what we do and why it matters that we're back. And maybe make it about them... I don't want it to be long").
-- Drafts only: nothing is locked; nothing sends until Sean starts the part.
update ve_outreach_campaign_emails e set body =
  'Hi {first_name},' || E'\n\n'
  || 'It''s Sean from Vegans Explore. We help you find Vegan restaurants, events and recipes near you, and the people behind them, all in one place.' || E'\n\n'
  || 'We''re back because eating Vegan, wherever you are, should be easy, and nobody should have to figure it out alone. We officially launch on January 1, but we''re already up and running and finding our tribe. I''d love for you to come in now as one of our Founding Members. It''s free.'
  || case when v.l = '' then '' else E'\n\n' || v.l end
  || E'\n\n' || 'And as a thank-you, there''s a free Holiday Guide for the season. I recorded a short note about it:' || E'\n\n' || '{link}' || E'\n\n' || 'Sean'
from (values
  ('registered', 'You already have an account with us, so you''re one click away. Forgot your password? There''s a reset link right on the page.'),
  ('business', 'If you run a Vegan business, this is for you too: members claim their listing free, so the people looking for you can find you.'),
  ('creator', 'If you create content, we''re registering official Vegans Explore creators, and I''d love your voice in it.'),
  ('foodie-fest', 'We met at Vegan Foodie Fest Miami. We kept building since then, and you''re part of why.'),
  ('explore', '')
) v(b, l)
where e.campaign_slug = 'holiday-launch-' || v.b and e.step = 1 and e.locked_at is null;
