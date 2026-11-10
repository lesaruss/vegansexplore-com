-- ve-holiday-guide: the Gift Guide's brand outreach as a campaign program, with the DMs Sean sends by hand (Sean, 2026-11-10: "in the
-- campaign, we can have a section where it's easy for me to find the ones I need to send a DM to, and I can just copy each script").
-- Warm first, then the link (Sean, same day: "Shouldn't we warm them up first before we come in for the right hook?"): a story tag, a short
-- opener with no link, the link once they reply, one nudge after three days. HQ > Outreach > the program page shows each brand's DM with
-- Copy buttons and Sent / Replied / Done (lesaruss-hq components/branddesk/OutreachDesk.tsx, lib/veOutreachRead.ts). The picked-brand
-- email is cut to the good news and one link. RLS on, no policies: HQ reads with the service key. Safe to run twice.
create table if not exists public.ve_campaign_dms (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null references public.ve_campaign_programs(slug) on delete cascade,
  listing_id uuid references public.listings(id),
  channel text not null default 'instagram' check (channel in ('instagram', 'facebook', 'whatsapp', 'text')),
  handle text not null,
  opener text not null,
  follow_up text,
  nudge text,
  status text not null default 'to_send' check (status in ('to_send', 'sent', 'replied', 'done')),
  sent_at timestamptz,
  replied_at timestamptz,
  done_at timestamptz,
  note text,
  sort int not null default 100,
  created_at timestamptz not null default now(),
  unique (program_slug, listing_id, channel)
);
alter table public.ve_campaign_dms enable row level security;

insert into public.ve_campaign_programs (slug, name, goal, start_on, end_on, status, note) values
 ('gift-guide-2026', 'Holiday Gift Guide: featured brands', 'Every brand we featured in the Christmas Gift Guide hears it was picked, sees its card, can swap the item or photo, claims its page free by Friday, November 20, and can give to the December giveaway.', '2026-11-11', '2026-11-24', 'draft', 'Ten brands by email, four by Instagram DM (no published email). Warm first: a story tag and a short opener, the link once they reply.')
on conflict (slug) do nothing;
update public.ve_outreach_campaigns set program_slug = 'gift-guide-2026' where slug in ('gift-guide-2026-selected', 'gift-guide-2026-claimed');

insert into public.ve_campaign_program_steps (program_slug, n, day_offset, kind, channel, title, who, outreach_campaign, outreach_step, url, body, status) values
 ('gift-guide-2026', 1, 0, 'post', 'instagram', 'Story: the Gift Guide, tagging each brand', 'All 14 featured brands', null, null, null,
  'One story frame per brand: their gift''s photo from the Gift Guide with the Vegans Explore mark, tagging them. A tag lands in their notifications, not in Message Requests, so it warms them before the DM.', 'not_written'),
 ('gift-guide-2026', 2, 0, 'email', 'email', 'You were picked: the email', 'The 10 brands with a published email', 'gift-guide-2026-selected', 1, null, null, 'draft'),
 ('gift-guide-2026', 3, 0, 'post', 'instagram', 'DM 1: the opener (no link)', 'The 4 brands with no email', null, null, null,
  'Short, the good news and one question. Each brand''s own script is in the DMs to send section below.', 'draft'),
 ('gift-guide-2026', 4, 0, 'post', 'instagram', 'DM 2: the link, once they reply (a nudge after 3 days)', 'Who replies, then who has not', null, null, null,
  'Their own tracked link to their page. If there is no reply after three days, one nudge with the link, then stop.', 'draft'),
 ('gift-guide-2026', 5, 0, 'page', 'web', 'Their page: see the card, swap the item or photo, claim free', 'Every brand who clicks', null, null, '/hello/gifts?l=rebel-cheese', null, 'live'),
 ('gift-guide-2026', 6, 1, 'email', 'email', 'After they claim: three ways in for December', 'Brands who claim', 'gift-guide-2026-claimed', 1, null, null, 'draft')
on conflict (program_slug, n) do nothing;

-- The picked-brand email, cut to the good news and one link (their page does the explaining).
update public.ve_outreach_campaign_emails set updated_at = now(), body = 'Hi {first_name},

Good news: our team picked {business} for the Vegans Explore Holiday Gift Guide this Christmas, a free guide that helps people shop for the Vegans in their lives.

Here is your own page for it. See your card, swap the item or the photo if you like, and claim your page in our Directory, free:
{link}

Brands that claim by Friday, November 20 get first pick of a few things we are planning for December.

Thank you for making gifts our community can feel good about.

The Vegans Explore team'
where campaign_slug = 'gift-guide-2026-selected' and step = 1 and locked_at is null;

-- The four DMs, each brand's own words and its own tracked link (20261110_gift_guide_dm_links.sql).
insert into public.ve_campaign_dms (program_slug, listing_id, handle, opener, follow_up, nudge, sort)
select 'gift-guide-2026', l.id, x.handle, x.opener, x.follow_up, x.nudge, x.sort
from (values
  ('no-49-handbags', 'no.49handbags', 10,
   'Hi No. 49 team! We just featured your Vegan handbags in the Vegans Explore Holiday Gift Guide this Christmas 🎁 Thank you for making them. Can I send you the link to your card?',
   'Here it is: vegansexplore.com/go/gg-no49-claim. It''s your own page, where you can see your card, swap the item or the photo if you''d like, and claim your page in our Directory, free. Brands that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Gift Guide: vegansexplore.com/go/gg-no49-claim. Happy holidays from the Vegans Explore team.'),
  ('bramble-pets', 'bramblepets', 20,
   'Hi Bramble team! We just featured your fresh dog food in the Vegans Explore Holiday Gift Guide this Christmas, in our For Your Animal Companion section 🐶 Thank you for making it. Can I send you the link to your card?',
   'Here it is: vegansexplore.com/go/gg-bramble-claim. It''s your own page, where you can see your card, swap the item or the photo if you''d like, and claim your page in our Directory, free. Brands that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Gift Guide: vegansexplore.com/go/gg-bramble-claim. Happy holidays from the Vegans Explore team.'),
  ('phlur', 'phlur', 30,
   'Hi Phlur team! We just featured your Heavy Cream body mist in the Vegans Explore Holiday Gift Guide this Christmas 🎁 A cream scent with no dairy anywhere near it. Can I send you the link to your card?',
   'Here it is: vegansexplore.com/go/gg-phlur-claim. It''s your own page, where you can see your card, swap the item or the photo if you''d like, and claim your page in our Directory, free. Brands that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Gift Guide: vegansexplore.com/go/gg-phlur-claim. Happy holidays from the Vegans Explore team.'),
  ('the-organic-skin-co', 'theorganicskinco', 40,
   'Hi Organic Skin Co. team! We just featured your tinted face oil in the Vegans Explore Holiday Gift Guide this Christmas 🎁 Thank you for making it. Can I send you the link to your card?',
   'Here it is: vegansexplore.com/go/gg-tosc-claim. It''s your own page, where you can see your card, swap the item or the photo if you''d like, and claim your page in our Directory, free. Brands that claim by Friday, November 20 get first pick of a few things we''re planning for December.',
   'Hi again! Just making sure you saw your spot in our Holiday Gift Guide: vegansexplore.com/go/gg-tosc-claim. Happy holidays from the Vegans Explore team.')
) x(slug, handle, sort, opener, follow_up, nudge)
join public.listings l on l.slug = x.slug
on conflict (program_slug, listing_id, channel) do nothing;

-- The groups' first days, so the program shows on the Outreach home (nothing sends until Sean presses Start).
update public.ve_outreach_campaigns set start_on = coalesce(start_on, case slug when 'gift-guide-2026-selected' then date '2026-11-11' else date '2026-11-12' end)
where slug in ('gift-guide-2026-selected', 'gift-guide-2026-claimed');
