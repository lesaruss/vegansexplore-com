-- Keya (VeganKween, Philadelphia): official content creator welcome (Sean, 2026-11-10: "go with the invitation").
-- One-person exception to "no comps": her membership is on us by invitation (universe_invites, comp true, 250 points, the creator
-- survey's own points). Her creator application is accepted. The email is a BrandDesk people campaign from Sean, a draft until Sean
-- approves it in HQ; {link} is her own tracked link to her invitation page.

-- 1. The invitation (applied 2026-11-10 by execute_sql; kept here as the record). Code ea8702622caa, link invite-keya-7d8f.
insert into universe_invites (brand, name, email, comp, points, reason, points_to, created_by, context)
select 'vegans-explore', 'Keya', 'kyonakey@yahoo.com', true, 250,
  'Congratulations on becoming an official Vegans Explore content creator. Your membership is on us.',
  'none', 'Logan (Sean approved 2026-11-10)',
  'Creator application 02026682 (VeganKween, Philadelphia). One-person exception to no comps, Sean 2026-11-10: "go with the invitation".'
where not exists (select 1 from universe_invites where lower(email) = 'kyonakey@yahoo.com' and status in ('ready', 'sent', 'opened', 'joined'));

update ve_creator_applications set status = 'accepted', status_at = coalesce(status_at, now()),
  team_note = 'Accepted 2026-11-10 (Logan, Sean approved). Membership on us by invitation.'
where id = '02026682-f87b-440c-9e8e-b580cbfef93b' and status <> 'accepted';

-- 2. Her tracked link to the Philadelphia page (her own page is the existing /go/keya).
insert into ve_links (code, label, destination, initiative_slug, tags, channel, recipient_email, recipient_name)
values ('keya-philly', 'Keya (Philadelphia) - Philly page, first mission', '/communities/philadelphia', 'creator-welcome-keya',
  array['creator', 'philadelphia', 'one-on-one'], 'email', 'kyonakey@yahoo.com', 'Keya')
on conflict (code) do nothing;

-- 3. The campaign: one person, from Sean, to her invitation page. Draft until Sean approves.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
select 'creator-welcome-keya', 'Creator welcome: Keya (VeganKween)', null, '{}', false,
  'One-to-one from Sean. Congratulates Keya on becoming an official content creator, her membership on us (invitation ea8702622caa), how to sign in, and her first mission: review the Philadelphia page for missing groups, nonprofits and places. Sean approved the invitation 2026-11-10.',
  'draft', '2026-11-11', '{}', 'people', 1, 5, 'lesaruss', '/invite?c=' || u.code, 'you applied to be a Vegans Explore content creator'
from universe_invites u where lower(u.email) = 'kyonakey@yahoo.com' and u.brand = 'vegans-explore' and u.status <> 'canceled'
order by u.created_at desc limit 1
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
values ('creator-welcome-keya', 1, 'You''re an official Vegans Explore content creator, Keya', 'Hi {first_name},

Congratulations! Your creator application is approved, and you''re now an official Vegans Explore content creator. Thank you for raising your hand for Philadelphia.

Your membership is on us, and it''s ready for you. To sign in the first time:

1. Open your invitation: {link}
2. Press Accept your membership.
3. Create your account with this email address and a password you choose. You''ll start with 250 points.

After that, sign in any time at vegansexplore.com with the same email and password.

Your first mission is Philadelphia. Open the Philly page and look through it like a local: https://vegansexplore.com/go/keya-philly

Then tell me:
- Vegan groups or meetups we''re missing
- Nonprofits, rescues and sanctuaries that belong on there
- Restaurants, food spots or events that need adding or fixing

Just reply to this email with what you find. Once you confirm the page is right, we''ll go from there together.

Your own page is up too: https://vegansexplore.com/go/keya. Tell me if anything there should change.

So glad to have you with us,
Sean', 0)
on conflict (campaign_slug, step) do nothing;

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status)
select 'creator-welcome-keya', 'kyonakey@yahoo.com', 'Keya', null, 0, 'waiting'
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'creator-welcome-keya' and m.person_key = 'kyonakey@yahoo.com' and m.removed_at is null);

-- 4. Open the invitation (a 'ready' invitation reads not_found on /invite). 30 days, applied 2026-11-10. The full flow was proven the same
-- day with a [TEST] invitation of the same shape (comp, 250 points): sign up on /invite > joined, active, Founding, 250 points; test rows removed.
update universe_invites set status = 'sent', sent_via = 'copied', sent_at = now(), expires_at = now() + interval '30 days', updated_at = now()
where lower(email) = 'kyonakey@yahoo.com' and status = 'ready';
