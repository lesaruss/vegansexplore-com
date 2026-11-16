-- 11 Days of Giving: the brand ask (Sean, 2026-11-15: "reaching out to CPG brands to be giving out holiday packs... a good entry point
-- for them to start working with us"; 2026-11-16: "lock it at $150 per pack"). The page it links to, /partners/giving, was locked first
-- (outreach is the last step). One email, from the team, to brands in the Directory (ve_giving_brand_list: the email on file, else one
-- read on their own site through ve-web-reader). DRAFT: nothing sends until Sean approves in HQ Outreach. Safe to run twice.
insert into public.ve_campaign_programs (slug, name, goal, start_on, end_on, status, note, parent_slug, part_name, sort)
values ('giving-brands-2026', '11 Days of Giving: Brand Packs',
  'Brands in the Directory give one to four holiday packs (up to $150 retail each) for 11 Days of Giving, December 1 to 11. They say yes on /partners/giving by Friday, November 27; in return they get the full campaign and a report in January.',
  '2026-11-18', '2026-11-27', 'draft', 'One email, one ask (say yes on the brands page by Fri Nov 27). Starts Wed Nov 18, after Monday''s Featured in emails. Logan, 2026-11-16.',
  'holiday-launch-2026', '11 Days of Giving: Brands', 4)
on conflict (slug) do nothing;

insert into public.ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace,
  sender_brand, link_path, program_slug)
values ('giving-2026-brands', '11 Days of Giving 2026: Brand Packs', 'business', '{}', false,
  'The brand pack ask. From the team. Yes by end of Fri Nov 27 on /partners/giving (locked by Sean 2026-11-16, $150 per pack). Playbook ve-holiday-guide.',
  'draft', '2026-11-18', '{}', 'door', 1, 40, 'vegans-explore', '/partners/giving?b={slug}', 'giving-brands-2026')
on conflict (slug) do nothing;

insert into public.ve_outreach_campaign_emails (campaign_slug, step, day_offset, subject, body)
values ('giving-2026-brands', 1, 0, 'A holiday pack from {business} for 11 Days of Giving?',
  E'Hi {first_name},\n\nFrom December 1 to 11, Vegans Explore is running 11 Days of Giving: our members enter free, and each day winners are drawn at random, in the open.\n\nWe would love {business} to be one of the prizes. You give one to four holiday packs of your products, worth up to $150 retail each. There is nothing to pay, and nothing to ship until after the draws: we send you each winner''s address, and you ship by January 10.\n\nIn return, your brand is part of the whole campaign: your pack on the giveaway page in our Holiday Guide, with your logo linked to your page in our Directory; ads across Vegans Explore; posts and stories on our social accounts; and your own tracked link. In January you get a report with your real numbers.\n\nEverything is on one page, with a short form if you are in:\n{link}\n\nPacks are first come, first served (the giveaway is capped at $5,000 in prizes), and we need your yes by the end of Friday, November 27.\n\nThank you for being part of our community.\n\nThe Vegans Explore team')
on conflict do nothing;
