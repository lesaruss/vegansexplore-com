# Handoff 2026-11-15: social schedule, the Founding Member series and the design team (playbook ve-social-schedule)

Branch `claude/sweet-ritchie-oiq411` (pushed, NOT merged to main). Full record: `docs/history/social.md` (2026-11-15 entries) and
`docs/history/guides-standards.md` (Theo and Maya looks; social art cast rule). Canon: `canon-ve-design-team` (new).

## Where it stands
- Week of Mon Nov 16 to Sun Nov 22 in Depot > Social (https://vegansexplore.com/admin/depot/social#days/vegans-explore/up/all):
  **16 scheduled** in Metricool, **17 waiting** for Sean's approval (batches `week-2026-11-16`, `week-2026-11-16-mix`, re-dated `soflo-112`,
  `founding-series`). No push errors. Views: `public/social/week-2026-11-16/grid-preview.jpg` (feed, newest top left) and `stories-preview.jpg`.
- Founding Member series scheduled Mondays 9 AM ET: Your week (Nov 16), Straight to the point (Nov 23), Be one of the first (Nov 30),
  Your city (Dec 7). Pin each as it posts; the Holiday Guide stays the first pin.
- Paused by Sean: the What is Vegans Explore carousel and its reel (skipped slots).

## Sean's decisions this session (his words)
- "I like the first carousel post... I just need to see that one fixed" (Theo's fridge). Final, after "I think both need to be shut. And then him
  holding the handle": both doors shut, hand on the handle; Founding 1 re-pushed.
- "I wouldn't want to have two cityscapes back to back just for the grid's sake" (rule for every week; this week re-spaced, a Saturday
  ThanksLiving post added).
- "I almost just want to lock in that design team that created those graphics... anything that hasn't gotten a once over from that panel, let's
  do that" (canon-ve-design-team; the once-over of this week is applied: 46 files, captions, re-pushes).
- On audio: "I don't like the audio. It sounds like it's AI. In the first clip, Liz is speaking way too fast" (reel paused; any future voice needs
  better pacing first).
- "if it's not a guide, let's mix up the characters, because people want to see themselves in these characters" (rule in guides-standards).
- Theo and Maya keep their original looks (theo-v3, maya-v4 in VE_GUIDE_ART; the request had been lost between chats, logged in
  signal-context-efficiency).

## Built, not yet proven live
- Branch only, not on main: `public/footer.js` (theo-v3, maya-v4), `mocks/brand-kit/roster.html`, `CLAUDE.md` pointer, the renderers
  (`scripts/brand-templates/carousel.js`, `reel.js`, `screen-art.js`, `capture.js`, `podcast-pack/` incl. `episode-card.js`, the end-card fix in
  `pack.css`). Social files themselves are already live in `vegan-media` (Metricool reads storage, not the site).

## Waiting on Sean
1. Approve the 17 waiting posts (Depot approve works again, HQ e106855), or say approve in chat.
2. Merge `claude/sweet-ritchie-oiq411` to main (puts Theo and Maya's restored looks live on the site).

## Next actions for the next chat
- **Sun Nov 22, before Mon 9 AM ET**: retake the live screenshots on slides 2, 3 and 5 of Founding 2 (`public/social/founding/direct-response/src/render.js`;
  place and event counts, event dates), re-render, upload over `media/social/founding/direct-response/slide-02/03/05.jpg`, re-push the slot (batch
  `founding-series`) through ve-social push, and pick its TikTok song. (The reminder for this was deleted at wrap so it does not fire into another chat.)
- Each Monday: pick a current TikTok trending song for that week's Founding post (Music panel).
- Week of Nov 23: plan it the same way (design team brief, once-over, grid alternation, feed and stories views), including the other nine city
  carousels on the Philadelphia pilot template once Sean OKs it (designer note: second line = neighborhood or a known dish, add a photo credit).
- Parked: a Feed / Stories filter in Depot > Social; a full-size Plantbaed logo copied into vegan-media (Ep 146 slide 2 is soft); the Holiday Guide
  Events page lists past events first (site fix).

## Start here (new chat)
```sql
select created_at, left(body::text, 600) from playbook_records where slug='ve-social-schedule' order by created_at desc limit 8;
select to_char(slot_at at time zone 'America/New_York','Dy MM-DD HH12:MI AM') et, status, kind, title from ve_social_slots
 where brand_slug='vegans-explore' and slot_at >= now() and status<>'skipped' order by slot_at;
select body from knowledge_records where slug='canon-ve-design-team';
```
