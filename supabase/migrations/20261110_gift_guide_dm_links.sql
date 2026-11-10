-- ve-holiday-guide: Instagram DMs for the four Gift Guide brands with no published email (Sean, 2026-11-10: "Write the DM version for the
-- other four"). Their Instagram handles go on their listings (No. 49 and The Organic Skin Co link theirs from their own sites, per the logo
-- hunt; Bramble's is in Petfood Industry's company listing; Phlur's is credited as @phlur in the press). Each brand gets two personal tracked
-- links (CLAUDE.md, Tracked links): its card in the Gift Guide and its claim page, so a click names the brand. Safe to run twice.
update listings l set instagram = h.ig, ig_handle = h.ig, updated_at = now()
from (values ('no-49-handbags', 'no.49handbags'), ('the-organic-skin-co', 'theorganicskinco'), ('bramble-pets', 'bramblepets'), ('phlur', 'phlur')) h(slug, ig)
where l.slug = h.slug and coalesce(l.instagram, '') = '';

insert into ve_links (code, destination, initiative_slug, tags, channel)
select x.code, x.dest, 'gift-guide-2026-selected', array['gift-guide-2026-selected', 'gift-guide', 'instagram-dm', x.slug], 'dm'
from (values
  ('gg-no49', 'https://vegansexplore.com/guides/holiday-guide#/xm-gifts', 'no-49-handbags'),
  ('gg-no49-claim', 'https://vegansexplore.com/claim?listing=no-49-handbags', 'no-49-handbags'),
  ('gg-bramble', 'https://vegansexplore.com/guides/holiday-guide#/xm-gifts', 'bramble-pets'),
  ('gg-bramble-claim', 'https://vegansexplore.com/claim?listing=bramble-pets', 'bramble-pets'),
  ('gg-phlur', 'https://vegansexplore.com/guides/holiday-guide#/xm-gifts', 'phlur'),
  ('gg-phlur-claim', 'https://vegansexplore.com/claim?listing=phlur', 'phlur'),
  ('gg-tosc', 'https://vegansexplore.com/guides/holiday-guide#/xm-gifts', 'the-organic-skin-co'),
  ('gg-tosc-claim', 'https://vegansexplore.com/claim?listing=the-organic-skin-co', 'the-organic-skin-co')
) x(code, dest, slug)
on conflict (code) do nothing;
