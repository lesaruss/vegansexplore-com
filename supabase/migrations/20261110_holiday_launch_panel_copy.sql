-- Founding Member Invite after the PANEL and Sean's notes (2026-11-10): "We are more than finding food. There are plenty of apps for that.
-- We are a platform for the Vegan Community... paint that picture, especially being able to find nonprofits, media, and guides. Also, the
-- majority of these past contacts probably knew us as SoFlo Vegans." Panel consensus: how we know them in the first line, the Founding Member
-- deadline, say what the link opens, the Holiday Guide tied to ThanksLiving. Drafts only; nothing sends until Sean starts the part.
update ve_outreach_campaign_emails e set subject = v.s, body =
  'Hi {first_name},' || E'\n\n'
  || 'It''s Sean, founder of Vegans Explore. ' || v.o || ', so here''s who we are now: a home for the Vegan community. Not just where to eat, but who''s doing the work: Vegan restaurants and events, nonprofits, sanctuaries and rescues, the media and podcasts telling our stories, and Guides that walk you through it all. Because nobody should have to figure it out alone.' || E'\n\n'
  || 'We officially launch January 1, but we''re live now and finding our tribe. I''d love you to come in early as a Founding Member. It''s free, it starts with a short survey, and Founding Member status closes at midnight Eastern on January 1.'
  || case when v.l = '' then '' else E'\n\n' || v.l end || E'\n\n'
  || 'With ThanksLiving on Thursday, November 26, our Holiday Guide is ready too: recipes for the whole table, holiday menus from Vegan places, and ways to give back to sanctuaries and rescues.' || E'\n\n'
  || 'I recorded a short video about all of it. ' || v.c || E'\n\n' || '{link}' || E'\n\n' || 'Sean'
from (values
  ('registered', 'A quick note from Sean at Vegans Explore', 'You made an account with us a while back', 'You''re already in. Forgot your password? There''s a reset link right on the page.', 'Watch it, then sign in.'),
  ('business', 'A quick note from Sean at Vegans Explore', 'You may know us as SoFlo Vegans, from when we connected with your business or organization', 'Members claim their Directory listing free, so the people looking for you can find you.', 'Watch it, then pick: become a Founding Member, or open the Holiday Guide.'),
  ('creator', 'A quick note from Sean at Vegans Explore', 'You may know us as SoFlo Vegans', 'We''re registering official Vegans Explore creators, and I''d love your voice in it.', 'Watch it, then pick: become a Founding Member, or open the Holiday Guide.'),
  ('foodie-fest', 'From Vegan Foodie Fest Miami, a note from Sean', 'We met at Vegan Foodie Fest Miami, and it''s been a while', '', 'Watch it, then pick: become a Founding Member, or open the Holiday Guide.'),
  ('explore', 'A quick note from Sean at Vegans Explore', 'You may know us as SoFlo Vegans', '', 'Watch it, then pick: become a Founding Member, or open the Holiday Guide.')
) v(b, s, o, l, c)
where e.campaign_slug = 'holiday-launch-' || v.b and e.step = 1 and e.locked_at is null;
