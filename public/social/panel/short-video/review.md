# Short-form video review: What is Vegans Explore (reel + carousel)

**Lens:** the first second, motion, what reads inside the Reels/TikTok/Shorts safe zones at thumb size, and how the reel and carousel work as a pair.

## What works
- The locked reel template is right for short video: label and two-row headline sit in the top band, clear of the app bar, so every frame
  says what it is with the sound off.
- One shot per voice phrase, cut every 3 s, matches `canon-video-shot-pace`. Liz's nine lines are clean and already proven word for word.
- Section colors change with each section, so the cut itself shows something new.

## What does not
- **The pictures are too small, and Sean is right.** In the current reel the phone fills about 45 percent of the frame width and the desktop
  browser shots (shots 2, 6, 7) shrink a 2560 px page into a 950 px strip: at feed size (360 px wide) no word on the screen can be read. Most
  of the 4:5 picture area is flat background.
- **The key UI sits under the app's own interface.** On Reels the caption, handle and audio rows cover roughly the bottom 360 px (frame y
  1560 and down), and the like/comment/share column covers the right 140 px from about y 1150. The current phones run from about y 1030 to
  1600, so the part of each page that matters (the Directory doors, the listing's buttons, the event cards) is partly under the caption.
- **No hook in the first second.** Shot 1 opens on a small phone of the homepage with a tiny Liz in the corner, and it barely moves. A
  question headline over a static screen is a swipe.
- **The motion is too small to see.** The zoom is 1.00 to 1.06 over 3.4 s. On a phone that reads as a still slideshow.
- **The Guides vanish.** Liz narrates but is only seen as a thumbnail in shot 1; the other Guides are not in the reel at all, so Sean's "the
  guides will anchor it" is lost.
- **Reel and carousel are the same nine pictures re-sliced**, so they compete instead of working together.
- Grid note: Instagram's profile grid shows reel covers cropped to 3:4 (frame y 240 to 1680). The cover must hold up in that crop.

## "The images are small"
Fix it by dropping the device frame and putting the phone capture **full bleed** across the picture area at near native size (the 1170 px
capture shown 1080 px wide, about 2.2 times larger than now), cropped INTO the part of the page that matters. No desktop shots in the reel:
a desktop page never reads at 9:16. In the carousel, the same crop-in on the 1:1 picture area (sample 05). The viewer sees the real
viewing window, and every word on it reads at 360 px.

## Redesign approach
1. **Hook first second:** open on Liz's scene, big, her face in the safe band, with a pull-out from 1.22 to 1.00 so the very first frame is
   already moving; the site's own header sits under her so it says "this is an app". Headline "Meet Vegans Explore" (matches line 1).
2. **Full-bleed screens, cropped to the point:** each shot is the phone page edge to edge, the key element (doors, listing head and
   buttons, event cards) placed in art y 0 to 990 so it stays above the caption rows.
3. **Visible motion:** an eased push-in to 1.12 to 1.16, anchored to the left edge so the text never slides off the left; only the picture moves.
4. **Guides as insets, not wallpaper:** a 260 to 300 px rounded scene card on the left (never under the action column), the section's Guide
   doing that thing (Maya with a menu on the listing, River at a festival on Events). Some shots stay screen-only (the Directory), per Sean.
5. **Two assets, one storyboard:** the reel is the 28 s "watch it" version (reach, non-followers, the hook); the carousel is the pinned
   "read it at your own pace" version (saves, profile visitors). Same order, same headlines, same Guides, so a viewer who sees one recognises
   the other. The reel ends on Join free; the carousel ends on its end card. Post the reel's caption with "Swipe the pinned post for the
   full tour".
6. **Safe-zone check on every frame** before render (top 220 px, bottom 360 px, right 140 px from y 1150), plus the 3:4 grid crop of the cover.

## The one change first
Swap every reel shot's picture for a full-bleed, cropped-in phone screen with the key UI above the caption line. That alone fixes "small",
fixes readability and fixes the safe zones, and it reuses the approved voiceover and timing unchanged.

## Files in this folder
- `sample-01.jpg` to `sample-04.jpg`: reel frames 1080 x 1920 (hook, Directory, listing, Events).
- `sample-05-carousel.jpg`: carousel inside slide 1080 x 1350 (Directory, the same crop-in on the 1:1 picture area, Theo inset).
- `reel.mp4`: 12.4 s sample of the first four shots with the push-ins, over the first four approved Liz lines from the current reel.
- `compose.py` (picture-area compositor), `reel-sample.js` (copy of `scripts/brand-templates/reel.js` with per-shot eased zoom and an
  audio input), `spec.json`, `art/` (the 4:5 and 1:1 pictures).
