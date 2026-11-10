-- ve-holiday-guide: the picked-brand campaign and the four DMs now land on the brand's own page, /hello/gifts?l=<slug> (Sean, 2026-11-10:
-- "give them that page that they land on... a specific one for this campaign that matches the business one we created"), where they keep
-- or swap the item or photo, answer the giveaway soft ask and claim their page. Safe to run twice.
update ve_outreach_campaigns set link_path = '/hello/gifts?l={slug}' where slug = 'gift-guide-2026-selected';

update ve_outreach_campaign_emails set updated_at = now(), body = 'Hi {first_name},

Good news: our team picked {business} for the Vegans Explore Holiday Gift Guide this Christmas. It is a free guide that helps people find gifts for the Vegans in their lives, and gifts that do no harm for everyone else.

Your gift has its own card in the guide, with your photo, a link to buy it and a link to your page in our Directory.

We started you off with one of our favorites. Would you like us to feature a different item instead, or use a different photo? Your own page for this is here. You can keep your gift as it is, swap the item or the photo, and tell us if you would like to be part of our December giveaway:
{link}

From the same page you can claim {business} in our Directory, free, to add your logo, photos and links and see who finds you. Brands that claim their page by Friday, November 20 also get first pick of a few things we are planning for December.

Thank you for making gifts our community can feel good about.

The Vegans Explore team'
where campaign_slug = 'gift-guide-2026-selected' and step = 1 and locked_at is null;

update ve_links set destination = 'https://vegansexplore.com/hello/gifts?l=' || substring(destination from 'listing=([a-z0-9-]+)')
where code like 'gg-%-claim' and destination like '%/claim?listing=%';
