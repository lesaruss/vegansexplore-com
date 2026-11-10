-- ve-holiday-guide: two BrandDesk Outreach campaigns for the Gift Guide's featured brands (Sean, 2026-11-10: "an email campaign...
-- letting them know they were selected... after they claim it, there'll be an email... maybe 3 opportunities... contribute to the
-- giveaway... daily giveaways in December... anyone that claims membership by the end of next week, we'll put them in the vault").
-- Both are drafts: nothing sends until Sean approves the words in BrandDesk > Vegans Explore > Outreach campaigns. Members are added
-- there once each brand has a published contact email (none of the 14 had one on 2026-11-10). The vault is offered by reply, since
-- nothing for it is built yet. Safe to run twice.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, audience, email_count, daily_pace, sender_brand, link_path)
values
  ('gift-guide-2026-selected', 'Gift Guide 2026: you were picked', 'business', '{}', false,
   'The brands whose gifts our team picked for the Holiday Guide''s Christmas Gift Guide: they were picked, here is their card, claim the page free. Their own tracked link opens their claim. Playbook ve-holiday-guide.',
   'draft', 'door', 1, 20, 'vegans-explore', '/claim?listing={slug}'),
  ('gift-guide-2026-claimed', 'Gift Guide 2026: after you claim', 'business', '{}', false,
   'Sent to a featured brand once it has claimed its page: three ways in for December (the giveaway vault, the Holiday Guide, the Daily Pulse). Vault spots for brands that claim by Fri Nov 20. Playbook ve-holiday-guide.',
   'draft', 'door', 1, 20, 'vegans-explore', '/directory/{slug}')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, day_offset, subject, body)
values
  ('gift-guide-2026-selected', 1, 0, '{business} is in our Holiday Gift Guide',
'Hi {first_name},

Good news: our team picked {business} for the Vegans Explore Holiday Gift Guide this Christmas. It is a free guide that helps people find gifts for the Vegans in their lives, and gifts that do no harm for everyone else.

Your gift has its own card in the guide, with your photo, a link to buy it and a link to your page in our Directory:
https://vegansexplore.com/go/gift-guide

We started you off with one of our favorites. Have another item you would like in the guide? Press Suggest a Gift on that page and tell us it is your brand. There is also an optional question there about our holiday giveaway, which starts in December: say yes or no, either is fine.

We added {business} to the Directory so shoppers can find you. Claim your page to add your logo, photos and links, and to see who finds you. Membership is free with a short survey, and claiming is free for members:
{link}

Brands that claim their page by Friday, November 20 also get first pick of a few things we are planning for December. We will send them along as soon as you have claimed.

Thank you for making gifts our community can feel good about.

The Vegans Explore team'),
  ('gift-guide-2026-claimed', 1, 0, 'Three ways in for December, {business}',
'Hi {first_name},

Thank you for claiming {business} on Vegans Explore. Your page is yours now, and your gift is in the Holiday Gift Guide. Here are three ways to do more with it this December.

1. The giveaway vault. Every day in December we will give something away to our community. Add a product to the vault and we feature {business} on its day, with your page and a link to shop. Reply to this email with what you would like to give and how many. The vault is open to brands that claim by Friday, November 20.

2. Your spot in the Holiday Guide. Tell us about a holiday bundle, a gift set or a discount code, and we will add it to your gift card.

3. The Daily Pulse. Our team is writing about Vegan holiday gifts this season. Reply with the story behind your product, and we may feature {business}.

You can see your page here:
{link}

The Vegans Explore team')
on conflict do nothing;

insert into ve_links (code, destination, initiative_slug, tags, channel)
values ('gift-guide', 'https://vegansexplore.com/guides/holiday-guide#/xm-gifts', 'gift-guide-2026-selected', array['gift-guide-2026-selected', 'holiday-guide', 'gift-guide'], 'email')
on conflict (code) do nothing;
