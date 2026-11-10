-- Holiday Guide launch: the groups (Sean, 2026-11-10: "One group per bucket and then register group included... push the campaign to 10 a.m.").
-- Drafts: nothing is locked or approved; nothing sends until Sean locks the email and approves each group in HQ (from 10 AM Eastern).
-- One BrandDesk people campaign per bucket, in program holiday-launch-2026, from Sean (sender lesaruss), each person's own tracked /go/
-- link to /hello?b=<bucket>. Everyone is deduped (registered > business > creator > foodie-fest > explore) and leaves out: cohort 1, every
-- blocked address (bounce, unsubscribe, complaint, do not contact), GoHighLevel do-not-disturb and hard bounced, our own and test domains.
-- The Explore group starts Thu Nov 12, after the first groups' bounce rate is checked (stop at 5%).

create temp table hl_pick as
with src as (
  select lower(btrim(email)) e, nullif(btrim(name),'') nm, 'registered' b, 1 pr from members where deleted_at is null and merged_into_member_id is null and email is not null
  union all select lower(btrim(email)), nullif(btrim(contact_name),''), 'business', 2 from ve_outreach_contacts where segment in ('business','brand') and email is not null
  union all select lower(btrim(email)), nullif(btrim(coalesce(first_name,'')||' '||coalesce(last_name,'')),''), 'business', 2 from ve_ghl_contacts_export where tags ?| array['partner prospect','nonprofit','business']
  union all select lower(btrim(email)), nullif(btrim(coalesce(first_name,'')||' '||coalesce(last_name,'')),''), 'creator', 4 from ve_ghl_contacts_export where tags ?| array['media','ambassador prospects']
  union all select lower(btrim(email)), nullif(btrim(coalesce(first_name,'')||' '||coalesce(last_name,'')),''), 'foodie-fest', 5 from ve_ghl_contacts_export where tags ?| array['vegan foodie fest miami','vff-022325']
  union all select lower(btrim(email)), nullif(btrim(coalesce(first_name,'')||' '||coalesce(last_name,'')),''), 'explore', 6 from ve_ghl_contacts_export
  union all select lower(btrim(email)), nullif(btrim(contact_name),''), 'explore', 6 from ve_outreach_contacts where segment = 'person' and email is not null
), ex as (
  select lower(btrim(email)) e from ve_ghl_contacts_export where dnd::text = 'true' or email_dnd_status::text ilike '%active%' or tags ? 'hard bounced'
  union select lower(person_key) from ve_outreach_campaign_members where campaign_slug like 'founding-cohort-1%'
  union select lower(email) from ve_do_not_contact where released_at is null and email is not null
)
select distinct on (e) e, nm, b from src
where e ~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'
  and split_part(e, '@', 2) not in ('lesaruss.com','lesaruss.ai','vegansexplore.com','vegansexlore.com','veganexplore.com','example.com','example.invalid','mysite.com','doordash.com','srv1.mail-tester.com','o37417.ingest.sentry.io','eatbobos.zendesk.com')
  and e not like 'test%' and e not like 'noreply%' and e not like 'no-reply%'
  and e not in (select e from ex)
  and not email_is_suppressed(e, 'lesaruss') and not email_is_suppressed(e, 'vegans-explore')
order by e, pr;

insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason, program_slug)
select 'holiday-launch-' || b, 'Holiday launch: ' || n, null, '{}', false, 'Group of the Holiday Guide launch (program holiday-launch-2026). Lands on /hello?b=' || b || '.', 'draft', s::date, '{}', 'people', 1, p, 'lesaruss', '/hello?b=' || b, r, 'holiday-launch-2026'
from (values
  ('registered', 'people with an account', '2026-11-10', 60, 'you made a Vegans Explore account'),
  ('business', 'businesses and partners', '2026-11-10', 120, 'you''ve been part of the Vegans Explore community'),
  ('creator', 'creators and media', '2026-11-10', 10, 'you''ve been part of the Vegans Explore community'),
  ('foodie-fest', 'Vegan Foodie Fest Miami', '2026-11-10', 100, 'we met at Vegan Foodie Fest Miami'),
  ('explore', 'everyone else (explore)', '2026-11-12', 150, 'you''ve been part of the Vegans Explore community')
) v(b, n, s, p, r)
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
select 'holiday-launch-' || b, 1, 'We''re back, and I''d love you to be a Founding Member',
  'Hi {first_name},' || E'\n\n' || 'Vegans Explore is back. We launch on January 1, and I''d love for you to be one of our Founding Members. It''s free.'
  || case when l = '' then '' else E'\n\n' || l end
  || E'\n\n' || 'As a thank-you, we made a free Holiday Guide for the season. I recorded a short note to tell you about it:' || E'\n\n' || '{link}' || E'\n\n' || 'Sean', 0
from (values
  ('registered', 'You already have an account with us. If you don''t remember your password, there''s a reset link right on the page.'),
  ('business', 'If you run a Vegan business, claiming your listing is free for members.'),
  ('creator', 'If you create content, we''re registering official Vegans Explore creators.'),
  ('foodie-fest', 'We met at Vegan Foodie Fest Miami, and we kept building.'),
  ('explore', '')
) v(b, l)
on conflict (campaign_slug, step) do nothing;

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status)
select 'holiday-launch-' || b, e, nm, 0, 'waiting' from hl_pick p
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'holiday-launch-' || p.b and m.person_key = p.e);

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason)
select 'holiday-launch-' || b, 'contact@lesaruss.com', 'Sample Member', 0, 'stopped', 'Sample for previews and tests; never sends'
from unnest(array['registered','business','creator','foodie-fest','explore']) b
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'holiday-launch-' || b and m.person_key = 'contact@lesaruss.com');

update ve_campaign_program_steps set outreach_campaign = 'holiday-launch-explore', outreach_step = 1 where program_slug = 'holiday-launch-2026' and n = 1;

-- Revision (Sean, 2026-11-10 ~8:50 AM: "we officially launch... make it clear that we're active now... gearing up and finding our tribe...
-- come in now"; "send a little bit of each group each day... equal batches... by Thursday, if nobody's replying... pause and regroup").
-- Today's warm-up allowance is 128, so today's paces share it across every group; Wednesday's are raised after the bounce and click check.
update ve_outreach_campaign_emails set body = replace(body,
  'Vegans Explore is back. We launch on January 1, and I''d love for you to be one of our Founding Members. It''s free.',
  'Vegans Explore is back. We officially launch on January 1, but we''re already up and running: gearing up and finding our tribe before the big day. I''d love for you to come in now as one of our Founding Members. It''s free.')
where campaign_slug like 'holiday-launch-%' and step = 1;
update ve_outreach_campaigns c set start_on = '2026-11-10', daily_pace = v.p
from (values ('registered',5),('business',28),('creator',3),('foodie-fest',17),('explore',72)) v(b,p) where c.slug = 'holiday-launch-' || v.b;
