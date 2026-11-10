-- ve-holiday-guide: contacts for the Gift Guide's brands and their place in the "you were picked" campaign (Sean, 2026-11-10: "Go ahead with
-- the brand contacts"). ve-outreach find_emails (listing_ids, v34) read each brand's own site and found four: Finchberry, ID-Eclair, PAWJ
-- California, Veggie Grill. These six came from a web search for a published address, never a guess; email_source says where each was seen.
-- Rebel Cheese, Conscious Step and Saie publish theirs on their own pages; Nhiar's is from its own press release (2021); Renegade Foods' and
-- Korean Vegan Beauty's were seen second-hand (a marketplace listing, a reseller's seller details). None found for No. 49 Handbags, Bramble,
-- Phlur or The Organic Skin Co. The campaign is a draft: nothing sends until Sean approves it. Safe to run twice.
with src(slug, email, src) as (values
  ('rebel-cheese', 'info@rebelcheese.com', 'rebelcheese.com (customer service, found by web search)'),
  ('conscious-step', 'hello@consciousstep.com', 'consciousstep.com/pages/faqs'),
  ('saie', 'hi@saiehello.com', 'saiehello.com/pages/faqs'),
  ('nhiar-chocolates', 'info@nhiar.com', 'Nhiar press release, presseportal.de, 2021'),
  ('renegade-foods', 'info@renegadefoods.com', 'second-hand: a marketplace listing (not seen on renegadefoods.com)'),
  ('korean-vegan-beauty', 'support@koreanveganbeauty.com', 'second-hand: vegan-america.com seller details (not seen on koreanveganbeauty.com)')
)
insert into ve_outreach_contacts (listing_id, community_slug, email, segment, email_source)
select l.id, 'brands', s.email, 'brand', s.src from src s join listings l on l.slug = s.slug and l.status = 'approved'
where not exists (select 1 from ve_outreach_contacts c where c.listing_id = l.id);

-- Every featured brand with a contact joins the draft campaign (members wait until it is approved and active).
insert into ve_outreach_campaign_members (campaign_slug, listing_id, step, send_status)
select 'gift-guide-2026-selected', c.listing_id, 0, 'waiting'
from ve_outreach_contacts c join listings l on l.id = c.listing_id
where (l.details->>'added_from' = 'Holiday Gift Guide, 2026-11-10' or l.slug = 'veggie-grill')
  and not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'gift-guide-2026-selected' and m.listing_id = c.listing_id);
