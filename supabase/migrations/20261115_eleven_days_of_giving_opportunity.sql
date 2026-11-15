-- Sean, 2026-11-15: "once they show interest, then when they land and claim, then they get information about the 11 days of giving" and
-- "build 11 Days of Giving". Build step 2 of the plan locked 2026-11-13 (playbook ve-holiday-guide, BOSS + PANEL): the business dashboard's
-- first opportunity. One row in ve_dashboard_cards (the Opportunities feed, 20261113_ve_business_opportunities.sql), so a business that has
-- claimed sees it in Opportunities and in Home's New for you. "I'm in" logs interest (ve-claims partner_interest -> ve_initiative_interest,
-- campaign 11-days-of-giving-2026) and our team sets up the prize with them; nothing to pay or ship now. HELD: starts_at 2099 hides it until
-- Sean has read it; publishing is one update (starts_at = now()). The member page, the rules and the draw are Coming (build steps 3 and 4;
-- the attorney reads the rules once), so this row promises only what is real. Closes at the end of Friday, November 27, so prizes are set
-- before December 1. Safe to run twice.
insert into public.ve_dashboard_cards (audience, kind, title, body, cta_label, cta_url, starts_at, ends_at, sort, listing_kinds, opp_kind, interest_slug)
select 'business', 'offer', '11 Days of Giving: give a prize',
  'December 1 to 11, our members enter free for a chance to win prizes from Vegan businesses, drawn at random in the open. Give up to $100 in prizes (four $25 prizes work best). Nothing to pay or ship now: you send each prize straight to its winner within 30 days after the giveaway ends. Your business is shown with your prize, and you earn 250 points for each one. Press I''m in and our team sets it up with you.',
  'See it', '?tab=opportunities', '2099-01-01 00:00:00+00', '2026-11-28 05:00:00+00', 0, array['food', 'brand', 'service'], 'holiday', '11-days-of-giving-2026'
where not exists (select 1 from public.ve_dashboard_cards where interest_slug = '11-days-of-giving-2026');
