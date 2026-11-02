-- The Vegan Events Guide and event sponsorships (LOCKED by Sean 2026-11-01: "lock it"). Concept session with V;
-- canon canon-ve-events-guide, playbook ve-events-guide. Records the decision; the build follows.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-events-guide',
  'Vegans Explore: The Vegan Events Guide, event sponsorships paid in marketing, and host interviews (LOCKED by Sean 2026-11-01)',
  'decisions', 'product', 'active', 'sar', false, 50,
  array['vegans-explore','guides','events','sponsorship','podcast','directory'], 1, 'v', 'v',
  'Locked with V''s defaults (Sean: "lock it").',
  jsonb_build_object(
    'why', 'Sean: "an events guide... tips on running a successful event... access to resources... where the directory falls into place, maybe potential venues in different cities... address the elephants in the room... The goal of this guide, is of all guides, is to walk people through a journey so that they work with us... apply for a sponsorship from us... a slide that really sells them on why they should work with us... a survival guide for anybody hosting... what to do when it rains... interview event hosts and feature them... they record their voice for the answer... those voice recordings then become part of a podcast."',
    'name', 'The Vegan Events Guide (matches The Vegan Restaurant Guide; never "Survival Guide" in the title).',
    'audience', 'Anyone putting on a Vegan event: potlucks, social clubs, festival promoters, pop-up markets, a restaurant''s community night, a nonprofit fundraiser.',
    'role', 'The top of the funnel for organizers. It leads into Submit an event, Promote your event, Group Partners (tickets at 5%, the guest pass, the door list) and the sponsorship application, then hands off to the Group Partner Guide.',
    'narrator', 'River (he leads the live-event world with the Stadium & Arena Guide). Dani keeps the Group Partner Guide.',
    'price', '$11 or 1,100 points like every Guide; included for Group Partner leads (as the Nonprofit Guide is for Nonprofit Partner leads).',
    'free_example', 'What to do when it rains (and heat, no-shows, a vendor who does not show, losing power).',
    'tabs', jsonb_build_array(
      'Overview',
      'Kinds of events: potluck, social, dinner, market or pop-up, festival, fundraiser, workshop or talk, game-day watch party; for each what it costs, how big it gets, what goes wrong',
      'The plan: a countdown checklist from 12 weeks out to the day after, saved and exportable',
      'Money: budget template, free vs paid, ticket pricing, vendor fees, sponsors, break-even; our ticketing stated as fact',
      'Venue: what to ask, contract red flags, Event Venues in the Directory',
      'Vendors and food: recruiting, vendor agreements, labeling, food kept separate at a venue that is not Vegan, permits',
      'Gear: the shop (canopy and weights, wagon, string lights, cords, generator, tablecloths, signage, card reader, first aid, rain kit), every item a tracked /go/ Amazon link with our tag; partner printers and booth makers later',
      'Getting the word out: our calendar, the Daily Pulse, creators, Meetup, Partiful, flyers with QR codes',
      'Day of: run of show, volunteers, the door list, What to do when it rains',
      'After: recap, photos, guest survey, thanking vendors, the next one',
      'The elephants in the room',
      'Hosts who''ve done it: the interviews',
      'Work with us: why us, and the sponsorship application',
      'My list and Get access'),
    'elephants', jsonb_build_array(
      'Free RSVPs no-show (expect about half): a small deposit or the guest pass',
      'The same 40 people at every event: reaching people who are not Vegan yet',
      'Vendors losing money: booth fees vs real foot traffic, being fair to vendors',
      'Vegan events at venues that are not Vegan: animal products on site, shared kitchens, what to get in writing',
      'Sponsors that are not Vegan: where the line is',
      'Organizers in one city clashing on dates: use the calendar',
      'Activism vs a good time: reading the room',
      'Insurance and permits',
      'Burnout and hosting alone',
      'Accessibility'),
    'directory', 'A new Services > Event Venues sub-section (private rooms, breweries, galleries, permitted parks, community centers) plus a "hosts events" flag on restaurants; change every section list together per CLAUDE.md. The Guide also points to Vendors, Food Trucks, Catering and brands that vend (Sells at: Markets & events), Groups and Nonprofits as co-hosts and beneficiaries, Studios and Content Creators for coverage, People for speakers.',
    'sponsorship', jsonb_build_object(
      'principle', 'We sponsor in marketing, never cash.',
      'we_give', 'Featured on the calendar and the chapter''s Daily Pulse, 2 social posts and a story, an ad slot on the chapter''s pages for 2 weeks, a creator or member covering it, a recap feature after.',
      'they_give', 'A 10x10 booth, two comped meals or tickets, our logo on their materials, a mention from the stage, our QR cards at the door.',
      'bounty', 'A Represent Vegans Explore gig on the chapter''s Gig Board: a member staffs the booth and hands out QR cards for points and the comped meal, approved like a visit bounty (3 photos and a recap, used in their recap).',
      'who_qualifies', 'Vegan events; plant-forward events at venues that are not Vegan only if the host is a Group Partner.',
      'cap', '2 sponsorships a chapter a month to start.',
      'application', 'A paginated intake (the event, expected crowd, past events, what they ask for, what they offer) into the Inbox, routed to the chapter''s Community Manager; approve or decline.'),
    'why_us', 'Lead with what is true today: 13 chapters, a Directory of 1,000+ places, vendors and groups, a calendar that crawls every Vegan event, a Daily Pulse in every chapter, ticketing at 5%, the guest pass, a team that connects them to vendors and venues. The 2027 plan is labeled as the plan. Never claim reach we cannot show (221 real visitors in October 2026).',
    'host_interviews', 'Tell us your story on the Hosts tab: 6 questions answered by voice in the browser (your first event; what went wrong; your rain story; how you got people back; advice for someone starting; your proudest moment), a release checkbox, 100 points once approved. The release: audio use on our shows and site, their name credited, taken down on request. Good answers become clips in the Guide under the matching tab, a recurring Vegans Explore Podcast segment (Host Notes), People profiles with credits, and the content index.',
    'build_order', 'The Guide shell and the rain tab; the checklist and the gear shop; Event Venues; the sponsorship intake and bounty; the voice interviews.',
    'playbook', 've-events-guide')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-events-guide');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-events-guide', 'vegans-explore', 'V',
  'Locked by Sean 2026-11-01 ("lock it"). The Vegan Events Guide: for anyone hosting a Vegan event, narrated by River, $11 or 1,100 points, included for Group Partner leads; free example What to do when it rains. Tabs: Overview, Kinds of events, The plan (12-week countdown checklist), Money, Venue, Vendors and food, Gear (the shop, tracked /go/ Amazon links with our tag), Getting the word out, Day of, After, The elephants in the room (no-shows, the same 40 people, vendors losing money, venues that are not Vegan, sponsors that are not Vegan, date clashes, activism vs fun, insurance and permits, burnout, accessibility), Hosts who''ve done it, Work with us, My list, Get access. Directory: a new Services > Event Venues sub-section and a hosts-events flag on restaurants; the Guide points to Vendors, Food Trucks, Catering, brands that vend, Groups, Nonprofits, Studios, Content Creators, People. Sponsorship, paid in marketing never cash: we give calendar and Daily Pulse feature, 2 posts and a story, a 2-week chapter ad slot, creator or member coverage, a recap; they give a 10x10 booth, two comped meals or tickets, our logo, a stage mention, our QR cards. A Represent Vegans Explore gig staffs the booth (points plus the meal, approved like a visit bounty). Vegan events qualify, plant-forward at non-Vegan venues only for Group Partners; 2 a chapter a month; paginated application to the Inbox and the chapter''s Community Manager. Why us leads with what is true today; the 2027 plan labeled as a plan. Host interviews: 6 voice questions in the browser, a release (our shows and site, name credited, taken down on request), 100 points once approved; they become Guide clips, the Host Notes podcast segment, People credits and the content index. Build order: shell and rain tab; checklist and gear shop; Event Venues; sponsorship intake and bounty; voice interviews. Canon canon-ve-events-guide.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-events-guide' and kind = 'decision');
