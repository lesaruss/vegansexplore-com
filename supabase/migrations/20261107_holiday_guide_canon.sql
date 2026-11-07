-- ve-holiday-guide: LOCKED by Sean 2026-11-07 ("lock it"), concept session with V.
-- Canon canon-ve-holiday-guide v1, the playbook decision record, and the Depot > Playbooks index row.
-- Nothing is built yet. Safe to run twice.

insert into knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by, body)
values (
  'canon-ve-holiday-guide',
  'Vegans Explore Holiday Guide, ThanksLiving and Give back',
  'decisions', 'guides', 'active', 'sar', false, 50,
  array['vegans-explore','guides','holidays','thanksliving','giving-tuesday','nonprofits','business-members'],
  1,
  'Locked by Sean 2026-11-07: the Holiday Guide, ThanksLiving as its first holiday, business holiday menus, wish lists, the Give back tab.',
  'v', 'v',
  jsonb_build_object(
    'why', 'Sean, 2026-11-07: "I want us to launch the holiday guide, and then it''s going to grow over time... focus on the ones that are at hand... products, gift ideas... an intake where our members can tell us what''s on their wish list... businesses can submit... if they have a Thanksgiving menu, a Christmas menu... the holiday guide will be giving them one more thing to do once they do become a member." Then: "let''s just use Thanksliving. We can own it with this Guide." Then: "a donation page where we link directly to our partner nonprofits donation pages... motivation for people to want to become partners with us as a nonprofit."',
    'what', 'One Holiday Guide that grows holiday by holiday, focused on the holidays at hand. Three parts: holiday menus from businesses by chapter, a gift and product list we compile (Directory brands and public lists, credited, never copied; buy links are tracked /go/ links with our Amazon tag), and member wish lists that feed a Most wanted shelf. A Give back tab is permanent.',
    'access', 'Free and public to read. Prompts to join sit at moments of intent (Save, Add to my wish list, Remind me when the next holiday opens, Submit your holiday menu), each opening one short window: members save this, joining is free, a short survey. What they tapped is remembered through sign-up and saved the moment they are in. Regular people join by the Explorer survey (one optional question added: What are you hoping to find this season?). Businesses: Submit your holiday menu, join free, the Restaurant or Pre-Vegan Business survey, claim the listing free, straight into the menu form with the deadline counting down. An exception to topic Guides being $11, because this one is a front door.',
    'thanksliving', jsonb_build_object(
      'name', 'ThanksLiving, on the fourth Thursday of November (2026-11-26). Shown as ThanksLiving (Thanksgiving) on the tab and the business form at least the first year, so search and businesses find it.',
      'ownership', 'The word is in shared use (sanctuary fundraisers such as Indraloka, Full Circle Farm Sanctuary, Animal Haven of Asheville, Freedom Farm, Austin Farm Sanctuary, Tribe, Woodstock; Explore Veg''s Virtual ThanksLiving; vKind; Christian Thanks-Living writing). No trademark found (Justia only, not a USPTO clearance). We never claim we coined it and never try to trademark it. We own being where everyone finds it: the ThanksLiving Guide, with every sanctuary''s ThanksLiving event on our calendar and in the Guide.',
      'rules', jsonb_build_array(
        'Three thanks: one person, one place (the roof over your head), one thing on your table.',
        'The Gratitude Table: share a plant-based meal, at home, at a member restaurant, or with someone who would otherwise eat alone.',
        'Say it out loud: send one person a thank-you they are not expecting.',
        'Give back: visit a sanctuary, give points to a rescue or nonprofit, volunteer, or give on Giving Tuesday.',
        'Start your reflection: ThanksLiving opens the wrap-up of the year.'
      ),
      'tone', 'Never built by tearing down Thanksgiving; use the right words without lecturing. The same day is the National Day of Mourning (since 1970): if we touch the history, point to Indigenous-led voices; invite a Native Vegan voice onto the podcast.',
      'gratitude_day', 'Considered and dropped the same day: World Gratitude Day is September 21 and Kazakhstan has a Gratitude Day on March 1.'
    ),
    'business_menus', 'Any member business with a claimed listing submits its holiday offer: the menu, order-by and pickup dates, price range if they want, and hours on the day. Free for members. A person checks each before it shows, by chapter, 100% Vegan first by the badge rules, votes never change the order. A business that is not Vegan shows a plant-based (Pre-Vegan) menu, never Vegan. Any holiday (Jewish holidays, Kwanzaa) is the same form with a different holiday. Members get a dated dashboard card (ve_dashboard_cards) and a holiday hours field on Your page, and see their menu''s status, views and saves. A one-time note to restaurants that publish an email is drafted for Sean''s approval; nothing sends without it.',
    'give_back', 'A permanent Give back tab, its big moment Giving Tuesday (2026-12-01). We link out to each organization''s own donation page and never handle money or call anything tax-deductible on our side (Vegans Explore Inc. is being dissolved and was never a 501(c)(3)). Each Give button is its own tracked /go/ link, so each partner can be shown the people we sent (on their dashboard). Members can give points to the same organizations. Nonprofit Partners are featured at the top (story, photo, what a gift does); every other Nonprofit, Rescue and Sanctuary in the Directory is listed plainer, with Run a nonprofit? Become a Nonprofit Partner to be featured. Copy: Give directly to <organization>; no matching, totals or promises.',
    'calendar', jsonb_build_array(
      'ThanksLiving 2026-11-26: business menus close Wed 2026-11-18, promotion 11-19 to 11-26.',
      'Giving Tuesday 2026-12-01: Give back tab featured.',
      'Hanukkah starts 2026-12-04: menus close Mon 2026-11-30, promotion 12-01 to 12-12.',
      'Christmas 2026-12-25 and Kwanzaa 2026-12-26: menus close Mon 2026-12-14, promotion 12-15 to 12-25.'
    ),
    'promotion', 'During each holiday the Guide takes one Guide banner slot in the rails, a Daily Pulse mention and city posts showing featured menus. No paid ad budget until Sean names one.',
    'guide', 'Theo narrates (he leads Holidays in the catalog). His lines are text until Sean approves them for recording.',
    'templates', 'Guide pages copy guides/vegan-dairy-guide.html; the business menu form copies claim.html (?step=).',
    'build_order', jsonb_build_array(
      '1. The business holiday menu form (on the clock: live about 2026-11-10).',
      '2. The dated dashboard card and the holiday hours field.',
      '3. The Guide with its ThanksLiving tab, the five rules and the sanctuary ThanksLiving events (a short crawl list plus an invitation to add their own).',
      '4. The Give back tab with tracked links, ready by 2026-12-01.',
      '5. Wish lists, the Most wanted shelf and the gift list.',
      '6. Hanukkah, Christmas and Kwanzaa tabs.'
    )
  )
)
on conflict (slug) do nothing;

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-holiday-guide', 'vegans-explore', 'V', 'decision', 'text',
  've-holiday-guide: LOCKED by Sean 2026-11-07 ("lock it"), concept session with V. Canon canon-ve-holiday-guide v1. '
  || 'The Holiday Guide grows holiday by holiday, holidays at hand first. Free and public; join prompts at moments of intent (Save, wish list, reminders, Submit your holiday menu), what they tapped kept through sign-up; people join by the Explorer survey, businesses by the business survey then claim free then the menu form. '
  || 'ThanksLiving (Thanksgiving) on 2026-11-26 is the first holiday, with five rules (three thanks, the Gratitude Table, say it out loud, give back, start your reflection); the word is shared, we never claim it, we become where everyone finds it, sanctuary ThanksLiving events included. '
  || 'Business holiday menus close 2026-11-18, person-checked, plant-based (Pre-Vegan) wording for businesses that are not Vegan, dated dashboard card and holiday hours. '
  || 'Give back tab permanent, Giving Tuesday 2026-12-01: link out to each organization''s own donation page with tracked /go/ links, never handle money; Nonprofit Partners featured, other Directory nonprofits listed plainer. '
  || 'Theo narrates. Build order: menu form (by ~11-10), dashboard card and holiday hours, the Guide and ThanksLiving tab, Give back by 12-01, wish lists and gifts, Hanukkah, Christmas, Kwanzaa. Open: a paid ad budget (none until Sean names one); the one-time restaurant note is drafted for his approval.'
where not exists (select 1 from playbook_records where slug = 've-holiday-guide' and body like 've-holiday-guide: LOCKED by Sean 2026-11-07%');

insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, due_on, priority, updated_at)
values ('ve-holiday-guide', 'vegans-explore', 'Holiday Guide',
  'A free Holiday Guide that grows holiday by holiday: business holiday menus, gifts, wish lists and a permanent Give back tab, starting with ThanksLiving.',
  'building', 'Locked, not built',
  'Logan: build the business holiday menu form (from claim.html) so businesses can submit ThanksLiving menus before 2026-11-18.',
  'Logan', '2026-11-10', 1, now())
on conflict (slug) do nothing;
