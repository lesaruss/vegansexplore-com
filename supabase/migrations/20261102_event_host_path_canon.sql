-- The event host path (LOCKED by Sean 2026-11-02: "lock it"). Logan's panel answers on the four open questions, the $50 ad
-- credit and creative support. Canon canon-ve-event-host-path, playbook ve-event-host-path; write-up docs/proposals/event-host-path.md.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-event-host-path',
  'Vegans Explore: the event host path, per-event tickets at 5%, free events as sponsorships, extras, the $50 ad credit with creative support, and the automatic heads-up (LOCKED by Sean 2026-11-02)',
  'decisions', 'product', 'active', 'sar', false, 50,
  array['vegans-explore','events','tickets','sponsorship','ads','outreach'], 1, 'logan', 'logan',
  'Locked with the panel''s answers (Sean: "lock it and then deploy").',
  jsonb_build_object(
    'why', 'Sean: "if we can automate creating these really amazing event pages that have references to every single person that''s in it, every time we bring a new event in, we''re building our directory in other places... are you running this event? Click here... it takes them to a guide, the event guide... This is really, do you want to sell? Do you want to do an event with us?... it''s per event... if it''s a free event, we just ask that you make us a sponsor... maybe we just brand it as a Vegans Explore sponsorship."',
    'not_group_partners', 'Separate from Group Partners, which stays its own give and take (a percentage, every guest a member) and needs its own finessing.',
    'page', 'Every approved event gets its server-rendered page linking every person, venue and group in it, with "Are you running this event?" leading to the Vegan Events Guide and a claim.',
    'tickets', '5% of the ticket price, no flat fee, the same for everyone (the Group Partner rate). Card processing on the buyer; the host may pass our 5% on. No lower rate for member hosts: they get the sponsor package and the extras discount. A ticket of $11 or more makes the buyer a member (ve_member_admit).',
    'free_event_sponsorship', jsonb_build_object(
      'we_ask', '"Sponsored by Vegans Explore" on their flyer and event page, RSVPs through our page (the guest pass and door list), a stage mention, our QR cards out, tags on their posts; a booth only if there is room.',
      'we_give', 'A featured spot on the chapter calendar, a mention in the city''s Daily Pulse, one Instagram story, a place in the weekly events roundup, door check-in, a recap post, the sponsor price on every extra.',
      'big_events', 'Events of 200 or more can apply for the full sponsorship in the Events Guide (canon-ve-events-guide).'),
    'extras', jsonb_build_object(
      'sponsor_discount', '30% off',
      'items', jsonb_build_array(
        'Featured in the city''s Daily Pulse: $50 / $35',
        'Pinned first on the chapter calendar, 2 weeks: $50 / $35',
        'Social push, 1 feed post and 2 stories on Instagram and TikTok: $75 / $50',
        'A share bounty, members earn points for posting it: $75 / $50',
        'Our chapter''s ad slots, 2 weeks: $100 / $70',
        'A creator at the event, posting about it: $150 / $105',
        'A recap reel from their footage: $150 / $105',
        'Press release, written and pitched (the shop''s price): $500 / $350'),
      'packages', jsonb_build_array(
        'Spotlight (Pulse, pinned, social push): $149 / $99',
        'Boost (Spotlight plus ad slots and the bounty): $279 / $199',
        'Front Row (Boost plus the creator and the recap reel): $499 / $349'),
      'note', 'Each checked against delivery cost before it opens.'),
    'ad_credit', '$50 in ad credit once per host (not per event), landing when they claim their event page; our own ad slots only; 90 days; no cash value; they can add their own money on top. Needs the ad console: a credit balance per business, self-serve slot and date booking with a clear price, and a "spend your $50" step in the claim.',
    'creative_support', 'Included with the credit: we make their ad from whatever they send, in every slot size, as a still or our animated card; they approve it, one round of changes included. Every ad on our pages is made or approved by our team, paid ones too; a host''s own creative runs only once it passes our check, else we remake it. The approval screen shows what more we can do, with no push. Further rounds are an extra.',
    'heads_up_email', 'From the team (hello@vegansexplore.com), signed by the chapter''s Community Manager when there is one, never Sean''s name. At most one email every 14 days per host, several events in one email, an unsubscribe is permanent. Only approved events and an email the host publishes; in London a business''s general address only. It says we added your event, here is the page, correct it or claim it, sell tickets with us or make us a sponsor. No prices in the first email. Sean approves the template once; it then sends on its own through the outreach people-list engine (daily cap, warm-up, unsubscribe, postal footer).',
    'build_order', 'Event claim and "Are you running this event?"; the heads-up list and template; per-event ticketing at 5% for any claimed host; the sponsorship and extras checkout; the ad console credit, booking and creative support.',
    'playbook', 've-event-host-path')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-event-host-path');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-event-host-path', 'vegans-explore', 'Logan',
  'Locked by Sean 2026-11-02 ("lock it and then deploy"). Event hosts, per event, separate from Group Partners. Every approved event gets a server-rendered page linking its people, venue and group, with "Are you running this event?" into the Vegan Events Guide and a claim. Paid events: 5% a ticket, no flat fee, same for everyone, processing on the buyer, the 5% passable; $11+ tickets make the buyer a member. Free events: a Vegans Explore sponsorship (they show "Sponsored by Vegans Explore", take RSVPs through our page, a stage mention, our QR cards, tags; we give a featured calendar spot, a Daily Pulse mention, a story, the weekly roundup, door check-in, a recap, sponsor prices); 200+ apply for the full Events Guide sponsorship. Extras (sponsor 30% off): Pulse $50, pinned $50, social push $75, share bounty $75, ad slots $100, creator $150, recap reel $150, press release $500; Spotlight $149, Boost $279, Front Row $499. $50 ad credit once per host on claim, our slots, 90 days, no cash value, with creative support (we make the ad, they approve, one round; every ad on our pages made or approved by us). Heads-up email from the team signed by the Community Manager, never Sean''s name, at most every 14 days per host, events grouped, published emails only, London business addresses only, no prices, template approved once then automatic through the outreach engine. Build: event claim; heads-up; per-event ticketing; sponsorship and extras checkout; ad console credit, booking and creative support. Canon canon-ve-event-host-path.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-event-host-path' and kind = 'decision');
