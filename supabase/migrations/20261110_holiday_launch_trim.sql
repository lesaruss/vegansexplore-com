-- Founding Member Invite trimmed (Sean, 2026-11-10: "Does the panel think the email is too long?" Panel: yes, aim for about 120 words;
-- then "Go, add the reply line, and send me tests"). "You may know me from SoFlo Vegans" (SoFlo Vegans still exists), the community
-- picture in one sentence, a short call to action, and the reply line. Subjects unchanged. Drafts until Sean starts the part.
update ve_outreach_campaign_emails e set body =
  'Hi {first_name},' || E'\n\n'
  || 'It''s Sean, founder of Vegans Explore. ' || v.o || ' Vegans Explore is a home for the Vegan community: not just where to eat, but who''s doing the work. Restaurants and events, nonprofits, sanctuaries and rescues, the media telling our stories, and Guides that walk you through it all, so nobody has to figure it out alone.' || E'\n\n'
  || 'We officially launch January 1, but we''re live now. Come in early as a Founding Member: it''s free, it starts with a short survey, and Founding Member status closes at midnight Eastern on January 1.'
  || case when v.l = '' then '' else E'\n\n' || v.l end || E'\n\n'
  || 'For ThanksLiving on Thursday, November 26, our Holiday Guide is ready: recipes, holiday menus from Vegan places as they come in, and ways to give back.' || E'\n\n'
  || 'I recorded a short video. ' || v.c || E'\n\n' || '{link}' || E'\n\n' || 'Or just reply. I read every one.' || E'\n\n' || 'Sean'
from (values
  ('registered', 'You made an account with us a while back.', 'You''re already in. Forgot your password? There''s a reset link right on the page.', 'Watch it, then sign in:'),
  ('business', 'You may know me from SoFlo Vegans, from when we connected with your business or organization.', 'Members claim their Directory listing free, so the people looking for you can find you.', 'Watch it, then pick a button:'),
  ('creator', 'You may know me from SoFlo Vegans.', 'We''re registering official Vegans Explore creators, and I''d love your voice in it.', 'Watch it, then pick a button:'),
  ('foodie-fest', 'We met at Vegan Foodie Fest Miami, and it''s been a while.', '', 'Watch it, then pick a button:'),
  ('explore', 'You may know me from SoFlo Vegans.', '', 'Watch it, then pick a button:')
) v(b, o, l, c)
where e.campaign_slug = 'holiday-launch-' || v.b and e.step = 1 and e.locked_at is null;
