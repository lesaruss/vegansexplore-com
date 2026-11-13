-- The business dashboard's Opportunities (playbook ve-business-dashboard, build step 3; Sean, 2026-11-13: "go ahead with Opportunities").
-- The approved mock (/mocks/business-dashboard, slide 5): ways in, each one row in the database aimed at the kinds of listing it fits, what
-- it is, when it closes, one button; a filter picks one kind; taking part logs interest for our team (ve-claims partner_interest ->
-- ve_initiative_interest). Built on the What's new cards (ve_dashboard_cards, audience business), as the mock says, not a new table.
--   opp_kind       contribute | feature | sponsor | ads | holiday: the row is an opportunity, shown in Opportunities under that kind
--   interest_slug  the campaign an "I'm in" logs (the same slugs ve-partner-dashboard.js used, so interest already logged carries over);
--                  null when the button goes to cta_url instead
-- cta_url '?tab=opportunities' sends Home's New for you row to Opportunities. Safe to run twice.

alter table public.ve_dashboard_cards add column if not exists opp_kind text;
alter table public.ve_dashboard_cards add column if not exists interest_slug text;
alter table public.ve_dashboard_cards drop constraint if exists ve_dashboard_cards_opp_kind_check;
alter table public.ve_dashboard_cards add constraint ve_dashboard_cards_opp_kind_check
  check (opp_kind is null or opp_kind in ('contribute', 'feature', 'sponsor', 'ads', 'holiday'));
create unique index if not exists ve_dashboard_cards_interest_slug_key on public.ve_dashboard_cards (interest_slug) where interest_slug is not null;

-- The cards that already are opportunities.
update public.ve_dashboard_cards set opp_kind = 'holiday' where id = '8ed978aa-5ee8-4c95-9f95-1132768f0b9e';   -- ThanksLiving menu
update public.ve_dashboard_cards set opp_kind = 'contribute', interest_slug = 'community-groups', cta_url = '?tab=opportunities', cta_label = 'See it',
  body = 'Your group''s home here: your events on your page and the calendar, members finding you in every city, and a share of what your members bring in. Coming: we are building it with the first groups now.'
  where id = '8661a703-08a7-4a94-8ab2-d41f348c5f4e';                                                               -- Host your group
update public.ve_dashboard_cards set opp_kind = 'feature', interest_slug = 'guide-feature', cta_url = '?tab=opportunities', cta_label = 'See it',
  listing_kinds = array['brand', 'food'], body = 'Where people are choosing where to eat and what to buy. Coming.'
  where id = '5d6f1b26-c850-4851-b730-001894f38605';                                                               -- A featured spot in a Guide
update public.ve_dashboard_cards set opp_kind = 'contribute' where id = '26c62cc5-ffb6-4dda-b4b5-28521db20907';  -- Nonprofit Partner
update public.ve_dashboard_cards set opp_kind = 'contribute' where id = 'a3311fb6-ab5a-4363-956f-6341be9f2667';  -- Podcast Network

-- The rest, moved from the lists written into ve-partner-dashboard.js (CAMPAIGNS, ORG_OPPS, PODCAST_OPPS), with the same slugs and words,
-- plus the mock's Holiday menus, Daily Pulse story, Guide page and ad spots rows.
insert into public.ve_dashboard_cards (audience, kind, title, body, cta_label, cta_url, starts_at, ends_at, sort, listing_kinds, opp_kind, interest_slug)
select v.* from (values
  ('business', 'offer', 'Send your Hanukkah, Christmas and Kwanzaa menus', 'The Holiday Guide''s holiday menus. Hanukkah closes November 30; Christmas and Kwanzaa close December 14.',
    'Send my menus', '/business/holiday-menu', now(), '2026-12-15 05:00:00+00'::timestamptz, 2, array['food'], 'holiday', null::text),
  ('business', 'offer', 'The Plant-Based Showcase', 'Miami Dolphins game day, Hard Rock Stadium. Sunday, November 29, 2026.',
    'See it', '?tab=opportunities', now(), '2026-11-30 05:00:00+00'::timestamptz, 3, array['food', 'brand'], 'contribute', 'plant-based-showcase-2026-11-29'),
  ('business', 'offer', 'Community nights', 'In each city, starting in South Florida in November 2026.',
    'See it', '?tab=opportunities', now(), null, 6, null, 'contribute', 'community-nights'),
  ('business', 'offer', 'Your story in the Daily Pulse', 'Tell us what''s new. Our team writes it up.',
    'Tell us', '/pulse/suggest', now(), null, 7, null, 'feature', null),
  ('business', 'offer', 'The Showcase at college games and festivals', 'Events that are not Vegan events. Dates to be set. Coming.',
    'See it', '?tab=opportunities', now(), null, 8, array['food', 'brand'], 'contribute', 'showcase-events'),
  ('business', 'offer', 'Present a Guide page', 'Sponsor the Holiday Guide''s Holiday Menus in your city. Coming.',
    'See it', '?tab=opportunities', now(), null, 9, array['food', 'brand', 'service'], 'sponsor', 'guide-page-sponsor'),
  ('business', 'offer', 'An ad spot on Vegans Explore', 'Our ad spots, with each page''s monthly views shown before you ask. Nothing runs until you approve it.',
    'See the spots', '?pd=ads', now(), null, 11, null, 'ads', null),
  ('business', 'offer', 'Our Q1 2027 campaigns', 'January to March 2027. Details to be set. Coming.',
    'See it', '?tab=opportunities', now(), null, 14, array['food', 'brand', 'service'], 'sponsor', 'q1-2027-campaigns'),
  ('business', 'offer', 'Your promo on our shows', 'Your trailer or promo played on our own shows. Coming.',
    'See it', '?tab=opportunities', now(), null, 15, array['show'], 'feature', 'podcast-promos'),
  ('business', 'offer', 'We produce your show', 'Editing, show notes, publishing and your release schedule, managed for you. Coming.',
    'See it', '?tab=opportunities', now(), null, 16, array['show'], 'contribute', 'podcast-production'),
  ('business', 'offer', 'Sponsorships through the network', 'When a brand sponsors the network, member shows can carry the read. Coming.',
    'See it', '?tab=opportunities', now(), null, 17, array['show'], 'sponsor', 'podcast-network-sponsors'),
  ('business', 'offer', 'Clips and social promotion', 'Short clips from your episodes on our Instagram and TikTok, and in the Daily Pulse. Coming.',
    'See it', '?tab=opportunities', now(), null, 18, array['show'], 'feature', 'podcast-marketing')
) v(audience, kind, title, body, cta_label, cta_url, starts_at, ends_at, sort, listing_kinds, opp_kind, interest_slug)
where not exists (select 1 from public.ve_dashboard_cards c where c.title = v.title and c.audience = 'business');

-- What one listing kind can take part in, for its dashboard (the server's owner_dashboard filters the same way). Open to read: offers.
create or replace function public.ve_business_opportunities(p_kind text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'opp_kind', c.opp_kind, 'title', c.title, 'body', c.body, 'cta_label', c.cta_label,
      'cta_url', c.cta_url, 'interest_slug', c.interest_slug, 'ends_at', c.ends_at, 'starts_at', c.starts_at)
    order by c.ends_at asc nulls last, c.sort, c.starts_at desc), '[]'::jsonb)
  from ve_dashboard_cards c
  where c.audience in ('business', 'all') and c.opp_kind is not null and c.starts_at <= now() and (c.ends_at is null or c.ends_at > now())
    and (c.listing_kinds is null or p_kind = any (c.listing_kinds));
$$;
revoke all on function public.ve_business_opportunities(text) from public;
grant execute on function public.ve_business_opportunities(text) to anon, authenticated;

-- Follow-up, same day: the ThanksLiving menu card had no listing kinds, so podcasts, groups and nonprofits were asked for a menu.
update public.ve_dashboard_cards set listing_kinds = array['food'] where id = '8ed978aa-5ee8-4c95-9f95-1132768f0b9e' and listing_kinds is null;
