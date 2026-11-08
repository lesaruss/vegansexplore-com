-- ve-holiday-guide: the ThanksLiving note to restaurants as two BrandDesk campaigns (Sean, 2026-11-08: "We are using the BrandDesk for
-- Outreach", "Tuesday works"). Words approved by Sean 2026-11-08 (docs/proposals/holiday-guide-restaurant-note.md); "in {city}" became
-- {in_city} so a business with no chapter reads "People are already planning" instead of "People in  are".
-- One email each, from the team (brand vegans-explore), start Tuesday 2026-11-10 (the sender runs weekdays 9 to 5 Eastern).
-- The emails are locked (the words are approved); the campaigns are NOT approved: nothing sends until Sean approves each in BrandDesk.

-- A campaign can name its own sender and where its link goes ({slug} is the listing's slug); each member gets its own tracked link.
alter table ve_outreach_campaigns
  add column if not exists sender_brand text,
  add column if not exists link_path text;
alter table ve_outreach_campaign_members
  add column if not exists link_code text;

insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path)
values
 ('thanksliving-2026-vegan', 'ThanksLiving 2026: 100% Vegan places', 'restaurant', '{}', true,
  'The ThanksLiving holiday menu note, version A (100% Vegan). From the team. Menus close end of Wed Nov 18. Playbook ve-holiday-guide.',
  'draft', '2026-11-10', '{}', 'door', 1, 60, 'vegans-explore', '/business/holiday-menu?listing={slug}'),
 ('thanksliving-2026-plant', 'ThanksLiving 2026: plant-based options', 'restaurant', '{}', false,
  'The ThanksLiving holiday menu note, version B (places with plant-based options). From the team. Menus close end of Wed Nov 18. Playbook ve-holiday-guide.',
  'draft', '2026-11-10', '{}', 'door', 1, 60, 'vegans-explore', '/business/holiday-menu?listing={slug}')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, locked_at, day_offset)
values
 ('thanksliving-2026-vegan', 1, 'Feature your ThanksLiving menu on Vegans Explore',
'Hi {first_name},

People{in_city} are already planning their ThanksLiving table, and a lot of them would rather order it from a place like {business} than cook it all themselves.

Our free Holiday Guide puts Vegan holiday menus in front of them, chapter by chapter. Send us yours (what you''re making, your order-by date and your holiday hours) and we feature {business} in it, 100% Vegan places first.

It takes a few minutes. You can type your dishes, add photos, or drop a photo or PDF of your menu and we read it for you:
{link}

Membership is free with a short survey, and claiming your page is free for members. Menus for ThanksLiving close at the end of Wednesday, November 18.

Thank you for feeding our community.

The Vegans Explore team', now(), 0),
 ('thanksliving-2026-plant', 1, 'Feature your plant-based ThanksLiving menu on Vegans Explore',
'Hi {first_name},

People{in_city} are planning their ThanksLiving table, and many want a plant-based option they can order rather than cook.

Our free Holiday Guide shows holiday menus from places near them, chapter by chapter. If {business} is offering plant-based dishes for the holiday, send them to us (what you''re making, your order-by date and your holiday hours) and we feature them as your plant-based holiday menu.

It takes a few minutes. You can type your dishes, add photos, or drop a photo or PDF of your menu and we pick out the plant-based dishes for you:
{link}

Membership is free with a short survey, and claiming your page is free for members. Menus for ThanksLiving close at the end of Wednesday, November 18.

Thank you for making room at the table.

The Vegans Explore team', now(), 0)
on conflict (campaign_slug, step) do nothing;

-- The list as read by eye on 2026-11-08: open food places with a published email, not LESARUSS.ai's, minus the six addresses that are
-- not the business's own; one listing per address (Veggie Grill's three share one), the main listing first, then the most voted.
with base as (
  select l.id, l.vegan_status, lower(coalesce(nullif(c.email, ''), nullif(l.email, ''))) em,
         row_number() over (partition by lower(coalesce(nullif(c.email, ''), nullif(l.email, '')))
                            order by (l.parent_id is null) desc, coalesce(l.voter_count, 0) desc, l.created_at) rn
  from listings l left join ve_outreach_contacts c on c.listing_id = l.id
  where l.status = 'approved'
    and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep')
    and not ve_listing_is_closed(l.business_status)
    and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'])
    and coalesce(nullif(c.email, ''), nullif(l.email, '')) is not null)
insert into ve_outreach_campaign_members (campaign_slug, listing_id, step, send_status)
select case when vegan_status = 'fully_vegan' then 'thanksliving-2026-vegan' else 'thanksliving-2026-plant' end, id, 0, 'waiting'
from base
where rn = 1
  and em not in ('accessibility@dylish.com', 'deliverysupport@doordash.com', 'info@mysite.com', 'help@waterboyz.com',
                 'staugustine@themodernrose.com', 'platepass@urbanplates.com')
  and not exists (select 1 from ve_outreach_campaign_members m where m.listing_id = base.id
                  and m.campaign_slug in ('thanksliving-2026-vegan', 'thanksliving-2026-plant'));
