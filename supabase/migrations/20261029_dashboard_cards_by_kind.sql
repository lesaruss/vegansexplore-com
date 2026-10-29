-- What's new speaks to what the listing is (Sean, 2026-10-29: on the Vegan Social Club, a group, "it's talking about check your
-- restaurant for free, your menu on your page, restaurant survival guide... I don't want [the] owner to claim this and then see check
-- your restaurant for free"). ve_dashboard_cards.listing_kinds names the kinds of listing a business card is for (null: every one):
-- food, group, organization (Nonprofits, Rescues, Sanctuaries, Events), show, work, brand, person, service. ve-claims
-- owner_dashboard sends only the cards for the listing's kind.
alter table public.ve_dashboard_cards add column if not exists listing_kinds text[];

update public.ve_dashboard_cards set listing_kinds = array['food']
where audience = 'business' and title in ('Check your restaurant for free', 'Your menu, on your page', 'The Restaurant Survival Guide');

insert into public.ve_dashboard_cards (audience, kind, title, body, cta_label, cta_url, sort, listing_kinds)
select * from (values
  ('business', 'offer', 'Host your group on Vegans Explore',
   'Your group''s home here: your events on your page and the calendar, members finding you in every city, and a share of what your members bring in. We are building it with the first groups now.',
   'See what it is', '?pd=opps', 5, array['group']),
  ('business', 'new', 'Your events, on your page',
   'Send an event and it shows on your page and on the events calendar, and stays in your history once it is over.',
   'Send an event', '/events#submit/1', 10, array['group', 'organization']),
  ('business', 'offer', 'Become a Nonprofit Partner',
   'Your own link, a share of every Passport bought through it, points for our services and a badge on your page.',
   'Tell us about you', '/guides/nonprofit-guide#/partner', 12, array['organization']),
  ('business', 'new', 'The Nonprofit Guide',
   'Ten tips for running a Vegan organization: getting found, events, partners and keeping your people from burning out. $11 or 1,100 points.',
   'Open the Guide', '/guides/nonprofit-guide', 20, array['group', 'organization']),
  ('business', 'new', 'Join the Vegans Explore Podcast Network',
   'Be part of the sponsorship conversations we bring to the network, and get promoted across Vegans Explore.',
   'Apply', '/media/network', 10, array['show']),
  ('business', 'offer', 'A featured spot in a Guide',
   'Our Guides are where people choose what to buy. Tell us you want in and we reach out with the details.',
   'See the opportunities', '?pd=opps', 10, array['brand']),
  ('business', 'new', 'Take on a bounty',
   'Campaigns in your city pay points for real work, and your members can take them on too.',
   'See the bounties', '/dashboard/bounties', 30, array['group', 'organization', 'service']),
  ('business', 'tip', 'Today''s Daily Pulse',
   'What is happening in your city today. Join the conversation where your people already are.',
   'Read it', '/pulse', 40, null::text[])
) v(audience, kind, title, body, cta_label, cta_url, sort, listing_kinds)
where not exists (select 1 from public.ve_dashboard_cards c where c.audience = v.audience and c.title = v.title);
