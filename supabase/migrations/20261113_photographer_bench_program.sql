-- 2026-11-13: the photographer bench outreach, loaded for Sean's final look (Sean said "Yes." to the drafts in
-- docs/outreach/2026-11-13-photographer-bench.md). HQ Outreach > Campaigns program `photographer-bench-2026`, sent by LESARUSS.ai.
-- The email campaign stays DRAFT: nothing sends until Sean turns it on. Contacts were confirmed on 2026-11-13 through ve-web-reader;
-- only C&I Studios publishes an email, so the rest are Instagram DMs (warm opener, the link once they reply) or a contact form.
-- Every link is a personal tracked /go/ link to that city's job on the Gig Board. Safe to run twice.

insert into public.ve_campaign_programs (slug, name, goal, start_on, end_on, status, note) values
 ('photographer-bench-2026', 'Photographer bench: Fort Lauderdale and Philadelphia',
  'Food photographers in Fort Lauderdale and Philadelphia apply to the paid jobs on the Gig Board ($75 paid trial, then paid per shoot at their rate), so photo shoots sold on the LESARUSS.ai shop have someone to shoot them.',
  '2026-11-16', '2026-12-04', 'draft',
  'Sean, 2026-11-13: "Yes." to the drafts. Canon canon-ve-front-of-house v16 sales_route_v16 (talent). Sent by LESARUSS.ai, never Sean''s name.')
on conflict (slug) do nothing;

insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, recipient_email, recipient_name, active) values
 ('pb-cistudios', 'Photographer bench: C&I Studios', 'https://vegansexplore.com/gigs?city=south-florida#gig/724b97fa-4dc9-4966-9fe2-518a91829a7e', 'photographer-bench-2026', array['photographer-bench-2026','fort-lauderdale','email'], 'email', 'contact@c-istudios.com', 'C&I Studios', true),
 ('pb-gonzcasa', 'Photographer bench: Carlos, Miami Profile', 'https://vegansexplore.com/gigs?city=south-florida#gig/724b97fa-4dc9-4966-9fe2-518a91829a7e', 'photographer-bench-2026', array['photographer-bench-2026','fort-lauderdale','dm'], 'dm', null, 'Miami Profile (@gonzcasa)', true),
 ('pb-riguel', 'Photographer bench: Photography by Riguel', 'https://vegansexplore.com/gigs?city=south-florida#gig/724b97fa-4dc9-4966-9fe2-518a91829a7e', 'photographer-bench-2026', array['photographer-bench-2026','fort-lauderdale','form'], 'other', null, 'Riguel Dorta Photography', true),
 ('pb-varney', 'Photographer bench: Jason Varney', 'https://vegansexplore.com/gigs?city=philadelphia#gig/25c1cc7f-49ee-4462-a604-ab4895d5f57a', 'photographer-bench-2026', array['photographer-bench-2026','philadelphia','form'], 'other', null, 'Jason Varney', true),
 ('pb-phillyvegans', 'Photographer bench: Philly Vegans (referrals)', 'https://vegansexplore.com/gigs?city=philadelphia#gig/25c1cc7f-49ee-4462-a604-ab4895d5f57a', 'photographer-bench-2026', array['photographer-bench-2026','philadelphia','dm','referral'], 'dm', null, 'Philly Vegans (@phillyvegans)', true)
on conflict (code) do nothing;

insert into public.ve_outreach_campaigns (slug, name, status, audience, cities, categories, vegan_only, start_on, link_path, daily_pace, email_count, program_slug, sender_brand, footer_reason, note)
values ('photographer-bench-2026-email', 'Photographer bench: the email', 'draft', 'people', '{}', '{}', false, date '2026-11-16',
  '/gigs', 10, 1, 'photographer-bench-2026', 'lesaruss', 'your studio shoots food in South Florida',
  'Sean said yes to the drafts 2026-11-13; stays draft until he turns it on in HQ Outreach. People are added by hand, each with a personal email.')
on conflict (slug) do nothing;

insert into public.ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset, updated_at)
values ('photographer-bench-2026-email', 1, 'Paid food shoots in {city}',
 E'Hi {first_name},\n\nWe are LESARUSS.ai, the marketing company behind Vegans Explore, the guide to Vegan food city by city. Restaurants book food shoots through us, and we are building a small bench of photographers to shoot them: up to 8 dishes and the space, every photo to one standard, paid at your rate.\n\nIf that sounds like you, the job is here: {link}\nIt asks for a short pitch, two or three examples and your rate. A few people get a paid trial ($75, three dishes) before we book.\n\nThank you,\nThe LESARUSS.ai team',
 0, now())
on conflict (campaign_slug, step) do nothing;

insert into public.ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, link_code, personal_emails, personal_at, personal_note)
select 'photographer-bench-2026-email', 'contact@c-istudios.com', 'C&I Studios', 0, 'waiting', 'pb-cistudios',
 jsonb_build_object('1', jsonb_build_object('subject', 'Paid food shoots in Fort Lauderdale',
   'body', E'Hi C&I Studios team,\n\nWe came across your photography and storytelling work for brands, and we think your studio could be a strong fit for this.\n\nWe are LESARUSS.ai, the marketing company behind Vegans Explore, the guide to Vegan food city by city. Restaurants book food shoots through us, and we are building a small bench of photographers in Fort Lauderdale to shoot them: up to 8 dishes and the space, every photo to one standard, paid at your rate.\n\nIf that sounds like you, the job is here: {link}\nIt asks for a short pitch, two or three examples and your rate. A few people get a paid trial ($75, three dishes) before we book.\n\nThank you,\nThe LESARUSS.ai team')),
 now(), 'Email confirmed on c-istudios.com/contact (2026-11-13). Applying needs a free Vegans Explore account; the link brings them back to the job.'
where not exists (select 1 from public.ve_outreach_campaign_members where campaign_slug = 'photographer-bench-2026-email' and person_key = 'contact@c-istudios.com' and removed_at is null);

insert into public.ve_campaign_program_steps (program_slug, n, day_offset, kind, channel, title, who, outreach_campaign, outreach_step, url, body, status) values
 ('photographer-bench-2026', 1, 0, 'page', 'web', 'The jobs on the Gig Board', 'Fort Lauderdale and Philadelphia', null, null, '/gigs?city=south-florida#gig/724b97fa-4dc9-4966-9fe2-518a91829a7e',
  'Food photographer: Fort Lauderdale (paid) and Food photographer: Philadelphia (paid). $75 paid trial of three dishes, then each shoot at their rate. Applications close Friday, December 4.', 'live'),
 ('photographer-bench-2026', 2, 0, 'email', 'email', 'The email', 'C&I Studios (the one published email)', 'photographer-bench-2026-email', 1, null, null, 'draft'),
 ('photographer-bench-2026', 3, 0, 'post', 'instagram', 'DM 1: the opener (no link)', 'Miami Profile (@gonzcasa), Philly Vegans (@phillyvegans, for referrals)', null, null, null,
  'Each one''s script is in the DMs to send section below. The link goes in DM 2, once they reply; one nudge after three days, then stop.', 'draft'),
 ('photographer-bench-2026', 4, 0, 'post', 'web', 'Contact forms (pasted by hand)', 'Photography by Riguel (rdorta.photobiz.com), Jason Varney (varneyphoto.com)', null, null, null,
  E'Paste into each site''s contact form:\n\nHi, we are LESARUSS.ai, the marketing company behind Vegans Explore, the guide to Vegan food city by city. Restaurants book food shoots through us, and we are building a small bench of food photographers in {city} to shoot them: up to 8 dishes and the space, to one standard, paid at your rate. The job is here: {link}. It asks for a short pitch, two or three examples and your rate; a few people get a paid $75 trial first. Thank you, the LESARUSS.ai team.\n\nRiguel: {city} is Fort Lauderdale, {link} is vegansexplore.com/go/pb-riguel. Jason Varney: {city} is Philadelphia, {link} is vegansexplore.com/go/pb-varney.', 'draft')
on conflict (program_slug, n) do nothing;

insert into public.ve_campaign_dms (program_slug, listing_id, channel, handle, opener, follow_up, nudge, sort, note)
select 'photographer-bench-2026', null, 'instagram', x.handle, x.opener, x.follow_up, x.nudge, x.sort, x.note
from (values
  ('gonzcasa', 10,
   'Hi Carlos! We saw your food photography for Miami restaurants and menus. We are LESARUSS.ai, the team behind Vegans Explore, and we are building a small bench of paid food photographers in South Florida. Could I send you the details?',
   'Here it is: vegansexplore.com/go/pb-gonzcasa. Restaurants book shoots through us (up to 8 dishes and the space, one standard), paid at your rate. It asks for a short pitch, a few examples and your rate; a few people get a paid $75 trial first.',
   'Hi again! Just making sure you saw the photographer job: vegansexplore.com/go/pb-gonzcasa. Applications close Friday, December 4.',
   'Miami Profile Portrait Photography (gonza.co); its food page confirmed 2026-11-13: restaurants, chefs and menus in Miami.'),
  ('phillyvegans', 20,
   'Hi Philly Vegans! We are LESARUSS.ai, the team behind Vegans Explore. We are looking for food photographers in Philadelphia who shoot plant-based food well. Who would you recommend?',
   'Thank you! If they want to apply, the paid job is here: vegansexplore.com/go/pb-phillyvegans. A short pitch, a few examples and their rate; a few get a paid $75 trial first.',
   'Hi again! Still looking for Philly food photographers who shoot plant-based food well. Anyone come to mind?',
   'Referral channel, found on Philly Mag''s Vegan scene story (2026-11-13).')
) x(handle, sort, opener, follow_up, nudge, note)
where not exists (select 1 from public.ve_campaign_dms d where d.program_slug = 'photographer-bench-2026' and d.handle = x.handle);
