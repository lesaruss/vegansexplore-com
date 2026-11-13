-- ve-holiday-guide: "confirm your feature" (Sean, 2026-11-13, after the test send of the Featured in the Holiday Guide program).
-- Sean: "What if we ask them to confirm their listing? That's the action... congratulations, we are featuring you in our holiday guide.
-- We're going to be starting promotions on November 20th... let us know if this item works for you. If you want to replace the photo, you
-- can. If you want to replace the item completely, you can... We might as well have them claim their listing as well... it could be one
-- process." And on Noshy: "you say kosher places, but Noshy is a food brand... maybe it's places and brands."
-- Run through BOSS and the panel (four lenses) the same day; consensus: one ask per message, the prize ask only after they are in the
-- dashboard. Sean said go on the defaults: confirm by Wednesday, November 18; the kosher group is Kosher Places and Brands.
-- What this does:
--   1. ve_holiday_gift_requests takes a kind (gift, menu, kosher) and a fix change (something to correct, in the note).
--   2. The three emails ask them to confirm their feature at /hello/gifts, which claims their listing free in the same step
--      (ve-claims start pay 'featured'). The menus and kosher emails now link there too.
--   3. The DMs say the same: congratulations first, the confirm link once they reply. Their hg- links go to /hello/gifts.
--   4. Kosher Places is renamed Kosher Places and Brands; the program's steps say what each one now does.
-- Every campaign stays a draft. Safe to run twice.

-- 1. Requests: the kind and the fix change
alter table public.ve_holiday_gift_requests add column if not exists kind text not null default 'gift';
alter table public.ve_holiday_gift_requests drop constraint if exists ve_holiday_gift_requests_kind_check;
alter table public.ve_holiday_gift_requests add constraint ve_holiday_gift_requests_kind_check check (kind in ('gift', 'menu', 'kosher'));
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.ve_holiday_gift_requests'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) like '%change%keep%item%photo%' loop
    execute format('alter table public.ve_holiday_gift_requests drop constraint %I', c);
  end loop;
end $$;
alter table public.ve_holiday_gift_requests add constraint ve_holiday_gift_requests_change_check check (change in ('keep', 'item', 'photo', 'fix'));

-- 2. The emails (not yet locked)
update public.ve_outreach_campaign_emails set subject = '{business}, confirm your spot in our Holiday Guide', updated_at = now(), body =
$b$Hi {first_name},

Congratulations: our team picked {business} for the Vegans Explore Holiday Guide, a free guide that helps people shop for the Vegans in their lives. We start promoting the guide on Friday, November 20, and we want it as complete as possible before then.

Please take a minute to confirm your gift:
{link}

Keep the gift we chose, or replace it (one item per business).
Use a better photo if you have one.
Claim your Directory page, free, in the same step.

Please confirm by Wednesday, November 18.

Thank you for making gifts our community can feel good about.

The Vegans Explore team$b$
where campaign_slug = 'gift-guide-2026-selected' and step = 1 and locked_at is null;

update public.ve_outreach_campaign_emails set subject = '{business}, confirm your spot in our Holiday Guide', updated_at = now(), body =
$b$Hi {first_name},

Congratulations: {business}'s holiday menu is in the Vegans Explore Holiday Guide, a free guide that helps people find Vegan holiday menus near them. We start promoting the guide on Friday, November 20, and we want it as complete as possible before then.

Please take a minute to confirm your menu:
{link}

Keep it as it is, or tell us what to update (an order link, an order-by date, a dish).
Claim your Directory page, free, in the same step.

Please confirm by Wednesday, November 18.

Thank you for feeding our community this season.

The Vegans Explore team$b$
where campaign_slug = 'holiday-guide-2026-menus' and step = 1 and locked_at is null;

update public.ve_outreach_campaign_emails set subject = '{business}, confirm your spot in our Holiday Guide', updated_at = now(), body =
$b$Hi {first_name},

Congratulations: {business} is in Kosher Places and Brands, part of the free Vegans Explore Holiday Guide for Hanukkah. It helps people who keep kosher find Vegan and plant-based places and brands. We start promoting the guide on Friday, November 20, and we want it as complete as possible before then.

Please take a minute to confirm your listing:
{link}

Tell us if anything is wrong, your certification included.
Feature one item for Hanukkah if you would like to.
Claim your Directory page, free, in the same step.

Please confirm by Wednesday, November 18.

Happy Hanukkah from the Vegans Explore team.$b$
where campaign_slug = 'holiday-guide-2026-kosher' and step = 1 and locked_at is null;

-- The menus and kosher emails land on the confirm page too (the link is made per person at send time from link_path).
update public.ve_outreach_campaigns set link_path = '/hello/gifts?l={slug}' where slug in ('holiday-guide-2026-menus', 'holiday-guide-2026-kosher');
update public.ve_outreach_campaigns set name = 'Featured: Kosher Places and Brands' where slug = 'holiday-guide-2026-kosher';
update public.ve_outreach_campaigns set note = replace(note, 'Kosher Places (Hanukkah)', 'Kosher Places and Brands (Hanukkah)') where slug = 'holiday-guide-2026-kosher';

-- 3. The DMs: their personal links go to the confirm page, and the words ask them to confirm
update public.ve_links set destination = 'https://vegansexplore.com/hello/gifts?l=' || substr(code, 4)
where initiative_slug = 'gift-guide-2026' and code like 'hg-%' and destination like 'https://vegansexplore.com/directory/%';

with x(slug, opener, follow_up, nudge) as (values
  ('rawchefcarla',
   'Hi Carla! Two pieces of good news: your Pumpkin Chocolate cake is in the Vegans Explore Holiday Guide''s ThanksLiving menus 🎃🍫, and Liz features you on the SoFlo Vegans Podcast. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep your menu as it is or tell us what to update (an order link and an order-by date for the cake would be perfect), and claim your Directory page, free, in the same step.',
   'Hi again, Carla! Your spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy ThanksLiving from the Vegans Explore team.'),
  ('no-49-handbags',
   'Hi No. 49 team! Congratulations: we featured your Vegan handbags in the Vegans Explore Holiday Gift Guide 🎁 Thank you for making them. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep the item we chose or swap it (or the photo), and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Gift Guide is still held: {link}. It takes a minute to confirm. Happy holidays from the Vegans Explore team.'),
  ('bramble-pets',
   'Hi Bramble team! Congratulations: we featured your fresh dog food in the Vegans Explore Holiday Gift Guide, in our For Your Animal Companion section 🐶 Thank you for making it. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep the item we chose or swap it (or the photo), and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Gift Guide is still held: {link}. It takes a minute to confirm. Happy holidays from the Vegans Explore team.'),
  ('phlur',
   'Hi Phlur team! Congratulations: we featured your Heavy Cream body mist in the Vegans Explore Holiday Gift Guide 🎁 A cream scent with no dairy anywhere near it. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep the item we chose or swap it (or the photo), and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Gift Guide is still held: {link}. It takes a minute to confirm. Happy holidays from the Vegans Explore team.'),
  ('the-organic-skin-co',
   'Hi Organic Skin Co. team! Congratulations: we featured your tinted face oil in the Vegans Explore Holiday Gift Guide 🎁 Thank you for making it. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep the item we chose or swap it (or the photo), and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Gift Guide is still held: {link}. It takes a minute to confirm. Happy holidays from the Vegans Explore team.'),
  ('black-rican-vegan',
   'Hi Black Rican Vegan team! Congratulations: your holiday menu is in the Vegans Explore Holiday Guide 🎉 Thank you for feeding our community. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep your menu as it is or tell us what to update (an order link, an order-by date), and claim your Directory page, free, in the same step.',
   'Hi again! Your menu''s spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy holidays from the Vegans Explore team.'),
  ('la-llamita-vegana',
   'Hi! Congratulations: La Llamita Vegana''s holiday menu is in the Vegans Explore Holiday Guide 🎉 Thank you for feeding our community. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: keep your menu as it is or tell us what to update (an order link, an order-by date), and claim your Directory page, free, in the same step.',
   'Hi again! Your menu''s spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy holidays from the Vegans Explore team.'),
  ('anixi',
   'Hi Anixi team! Congratulations: you''re in Kosher Places and Brands in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you make. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: tell us if anything is wrong (your certification included), feature one item for Hanukkah if you like, and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy Hanukkah from the Vegans Explore team.'),
  ('bunniecakes',
   'Hi BunnieCakes! Congratulations: you''re in Kosher Places and Brands in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you bake. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: tell us if anything is wrong (your certification included), feature one item for Hanukkah if you like, and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy Hanukkah from the Vegans Explore team.'),
  ('erin-mckennas-bakery',
   'Hi Erin McKenna''s team! Congratulations: your bakeries are in Kosher Places and Brands in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you bake. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: tell us if anything is wrong (your certification included), feature one item for Hanukkah if you like, and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy Hanukkah from the Vegans Explore team.'),
  ('pow-pow-franklin-square',
   'Hi Pow Pow team! Congratulations: you''re in Kosher Places and Brands in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you make. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: tell us if anything is wrong (your certification included), feature one item for Hanukkah if you like, and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy Hanukkah from the Vegans Explore team.'),
  ('sentir-vegan-mexican-restaurant',
   'Hi Sentir team! Congratulations: you''re in Kosher Places and Brands in the Vegans Explore Holiday Guide for Hanukkah 🕎 Thank you for what you make. Can I send you the link to confirm your spot?',
   'Here it is: {link}. We start promoting the guide on Friday, November 20, so please take a minute to confirm it by Wednesday, November 18: tell us if anything is wrong (your certification included), feature one item for Hanukkah if you like, and claim your Directory page, free, in the same step.',
   'Hi again! Your spot in our Holiday Guide is still held: {link}. It takes a minute to confirm. Happy Hanukkah from the Vegans Explore team.')
), lk as (
  select x.*, l.id listing_id,
    'vegansexplore.com/go/' || coalesce(
      (select k.code from public.ve_links k where k.code like 'hg-%' and k.initiative_slug = 'gift-guide-2026' and k.destination like '%l=' || l.slug),
      (select k.code from public.ve_links k where k.code like 'gg-%-claim' and k.destination like '%l=' || l.slug)) link
  from x join public.listings l on l.slug = x.slug
)
update public.ve_campaign_dms d set opener = lk.opener,
  follow_up = replace(lk.follow_up, '{link}', lk.link), nudge = replace(lk.nudge, '{link}', lk.link)
from lk where d.program_slug = 'gift-guide-2026' and d.listing_id = lk.listing_id and d.status = 'to_send' and lk.link is not null;

-- 4. The program and its steps say what each part now does
update public.ve_campaign_programs set
  goal = 'Everyone the Holiday Guide features confirms their feature before we start promoting the guide on Friday, November 20: the Gift Guide''s brands, the restaurants with holiday menus and Kosher Places and Brands. One page confirms the feature and claims their Directory listing free in the same step; once they are in their dashboard, the first opportunity is 11 Days of Giving (coming).',
  note = 'One email per kind of feature, one ask (confirm your spot, by Wednesday, November 18); whoever has no published email is in DMs (congratulations first, the confirm link once they reply). Rewritten 2026-11-13 after BOSS and the panel.'
where slug = 'gift-guide-2026';
update public.ve_campaign_program_steps set title = 'Confirm your spot: the email', who = 'Gift Guide brands with a published email' where program_slug = 'gift-guide-2026' and n = 2;
update public.ve_campaign_program_steps set title = 'DM 1: congratulations (no link)' where program_slug = 'gift-guide-2026' and n = 3;
update public.ve_campaign_program_steps set title = 'DM 2: the confirm link, once they reply (a nudge after 3 days)' where program_slug = 'gift-guide-2026' and n = 4;
update public.ve_campaign_program_steps set title = 'The confirm page: keep or change the feature, claim the listing free in the same step', who = 'Everyone who clicks' where program_slug = 'gift-guide-2026' and n = 5;
update public.ve_campaign_program_steps set title = 'Confirm your menu: the email' where program_slug = 'gift-guide-2026' and n = 7;
update public.ve_campaign_program_steps set title = 'Confirm your spot in Kosher Places and Brands: the email', who = 'Kosher Places and Brands' where program_slug = 'gift-guide-2026' and n = 8;
