# How to build a Vegans Explore Guide

The prototype is **The Vegan Dairy Guide** (`/guides/vegan-dairy-guide`), finished 2026-10-10. Sean: "This is the gold
standard now... let's lock in how the Vegan Dairy Guide looks and the rest of them should follow suit." Every new Guide is
built by these steps, in this order. Copy the Dairy Guide's code; never start a Guide from a blank page.

Files to copy: `guides/vegan-dairy-guide.html` (the shell and its CSS), `guide-scripts/vegan-dairy-guide.js` (everything it
does), the edge functions it calls (`ve-guide-unlock`, `ve-cookbook`) and the migrations named below. The full history of
each decision is in `CLAUDE.md` under "Guides are mini apps" and "Guide pricing".

Two rules hold at every step:

- **Sean approves every word the Guide says before it is recorded**, and every Guide line is shown to him as a table:
  tab, visitor line, member line. Nothing is recorded on "probably fine".
- **No counts in anything the Guide says or in Guide copy** ("76 brands", "16 swaps"). A live count of a filtered list on
  screen is fine.

---

## 1. Decide (Sean's calls; bring a recommendation and a default)

1. **The topic and who it is for.** One sentence on who opens it and what they leave with.
2. **The Guide** (the character). Liz is the general Guide, Maya has dairy, the others each own a topic. Check
   `VE_GUIDE_ART` in `/public/footer.js` and `character_agents` for who exists, their voice id and their current art.
3. **The tabs.** The tabs are the tour, in order: Overview, then one tab per section, then My list (members), then Get
   access (visitors). Pick sections that each spotlight a tool we already run: the Directory (listings with votes), the
   Pulse (sourced facts plus our own episodes), the Cookbook, the Community Board. A Guide is a mini app that combines
   them, never a PDF or a slide deck.
4. **The one free example** a visitor can use without paying (Dairy: the Buttermilk swap).
5. **Price**: every paid Guide is `$11 or 1 Guide credit` (`ve_guides.access_rule = 'credit'`). Free Guides are only the
   enrollment Guides (Welcome, Partner).

## 2. Content, sourced

- **Facts**: each one with a source link (`sources: [[label, url]]`). One fact at a time on screen. Where research shows a
  link and not proof, say so.
- **Brands, businesses, books**: approved Directory listings, tagged for the Guide, shown with the Directory's own card
  (`VERegionDirectory.card`). A missing business becomes a listing first. Products go in `listings.details.<guide_key>` and a
  `ve_guide_product_sources` row maps them into `ve_products`, so stores get their Vegan aisle automatically.
- **Episodes**: our own `ve_pulse_content` slugs (`PULSE_PICKS`), played inside the Guide.
- **Recipes or how-tos**: rows in `recipes` (through `ve-cookbook`), never hard-coded, so members can vote, save, share their
  own and post Made it photos.
- **Members-only content** lives in the `<slug>-site` row of `ve_guides` (`content_html` holds the JSON); only the free preview
  ships in the page (`#dg-public`).

## 3. The page

Copy the shell and keep its layout exactly:

- **Desktop**: content on the left on a clean white page, the Guide fixed in the right column on every tab (picture or clip,
  her words in a bubble, Start the tour, Back / N of M / Next). Nav, Guide and footer share one screen; long lists scroll in
  their own box.
- **Phones (900 px and under)**: the Guide full width on top, her words under her, a **Hide / Show** switch, and Back / N of M
  / Next under the content; Next goes back up to her.
- **Visitors**: the header holds the $11 box (`$11` beside "one time / purchase", as tall as the Join for $11 button;
  on phones the button fills the row and "Already a member? Sign in" sits under it). Each locked tab shows the real section
  blurred with the offer on top, while the Guide explains it. The free example stays open.
- **One tile for everything** that is not a Directory listing (`row()`): a square picture on the left with rounded corners,
  the words, then vote and Save stacked at the top right. Summaries clamp to two rows.
- **Members** (`ve_owns_guide`) get: votes on everything (`ve_guide_votes`; recipes have their own), **Save** on everything
  and the **My list** tab (`ve_guide_saves`), search, and the full Cookbook-style tools the Guide needs.

## 4. Pictures

- **Every item gets a picture on its left.** Made in Higgsfield (`nano_banana_pro`, about 2 credits each), photorealistic for
  food and things, flagged `illustrative` and captioned "Illustrative photo" until a real one replaces it. Book covers come
  from the publisher (or the retailer's cover image), logos from the brand, each copied into our storage (`vegan-media`),
  never hot-linked. Look at every picture before it goes up: no stray words, all fingers in frame.
- **The Guide's poses**: one pose per tab so every tab looks different, made from the Guide's current art, waist up, white
  background, Vegans Explore tee, hands fully in frame. The first page is arms folded with an open smile. A toothy grin as a
  clip's start picture freezes, so clip start pictures use a closed-lip smile.
- **The banner** (LOCKED 2026-10-10): 800 x 500, rounded corners, white background, the Guide centered from the waist up in the
  tee (black or cream), smiling, holding what the Guide is about, no words except on the prop. Stored as
  `vegan-media/media/guides/banners/<slug>.jpg`, shown at the top of the Guide's card on `/guides`.

## 5. The Guide's words (two scripts)

- Each tab has `say` for **visitors** (why get it) and `sayMember` for **members** (walking them through what they have).
  Each line names everything in its tab (Dairy's Cookbook names recipes, What can I make, cookbooks, chefs, sharing your own).
- Under about 8.5 seconds spoken (roughly 25 words), so it fits one clip. A tab's `say` must match its recording word for word.
- Write "Veegan" in the text sent to the voice so it is said right; the page shows "Vegan".
- Show Sean the full table. Record only after "lines are good".

## 6. Recording the clips

1. **Voice**: `el-media` `tts` with the Guide's voice id (`character_agents.elevenlabs_voice_id`), saved to
   `vegan-media/media/<guide>/<guide-slug>/`. Shorten any pause longer than about half a second
   (`silenceremove=stop_periods=-1:stop_duration=0.45:stop_threshold=-38dB`).
2. **Lip sync**: Higgsfield `wan2_7`, 10 s, 720p, 1:1, `start_image` (the tab's pose) and `audio_references`. **One take per
   clip** (Sean, 2026-10-10, on credit spend: about 30 credits a clip); a second take only if the first fails.
3. **Cut**: `scripts/brand-door/assemble_r5.py` in Higgsfield's sandbox (0.25 s lead-in, cut where the mouth is closed, poster =
   first frame). Then check by eye: a strip of the last second (no wink, mouth closed), a strip across the talking (lips
   moving), and a full frame (hands in frame). Recut by hand if needed.
4. **Upload**: `el-media` `upload_url`, PUT from the sandbox, then compare md5 against the public URL.
5. **Wire**: `CLIPS[tab]` (visitors), `CLIPS_M[tab]` (members), each with `?v=`; raise `?v=` on every re-record.
6. **Long videos** (a welcome with b-roll): no fade to black (hold the first and last clear frames), no stray single frames,
   no clicks, about -15 LUFS to match the clips, and a posed poster so the first page never opens on black.

## 7. Test

- Playwright with mocked data, as a **visitor** and as a **member**, at 1440 x 900, 1366 x 768, 390 and 320 wide: every tab,
  the right clip and words for each audience, votes, saves, My list, the locked tabs and the free example, no sideways scroll.
- The edge functions with a real test account (the QA accounts in `ve_test_checkout_allowlist`), including the $11 checkout
  on the Stripe test key and a credit unlock; remove test votes and saves afterwards.

## 8. Launch

1. `ve_guides` rows published (`<slug>` and `<slug>-site`), `access_rule = 'credit'`.
2. The `/guides` card: the banner, a description with no counts, "Walked through by <Guide>", "$11 or 1 credit", Open the Guide.
3. Share preview on the page (`og:title`, `og:description`, `og:image`), a sitemap entry.
4. A tracked link for announcing it (`/go/<code>`, Depot > Links); never share the bare address.
5. Check it live as a signed-out visitor (it loads, no errors, the right poster, the offer), log it to `stream_events`, and add
   the Guide's own notes to `CLAUDE.md`.

## Costs to expect (2026-10-10)

About 2 Higgsfield credits a picture and about 30 a lip-synced clip. A Guide with eight tabs in two versions is about 16 clips
(roughly 500 credits) plus its pictures. The monthly plan gives 3,000.
