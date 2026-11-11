# Guide tees for Humble Cabbage (Sean, 2026-11-09)

Sean: "I am loving every single one of those shirts that you have on them. Can we pull all of them from the last couple of videos
and clips... so we can get them into Humble Cabbage? A lot of them can just be various, like different color options, but the one
with just the mark, like in the last scene that she's wearing." And on placement: the logo on a shirt he bought sat "just a tad too
low"; he wants it placed the way it sits on the Guides (upper chest, high, close under the collar).

All pictures are in `public/guides/welcome/` (contact sheet: `docs/merch/2026-11-09-guide-tees-sheet.jpg`). These are drawings: use
them as design and placement references, never as product photos.

## 1. The mark only (the green suitcase icon, no words). Sean's favorite.

Placement on every one: centered on the upper chest, high, its top about a hand's width under the collar.

| Picture | Garment and color |
|---|---|
| `liz-pth-trail.jpg` (the scene Sean named) | cream tee (under an olive jacket) |
| `liz-pth-rescue.jpg` | forest green tee |
| `liz-pth-link.jpg` | mint green tee |
| `liz-pth-kitchen.jpg` | rust orange tee |
| `liz-pth-event.jpg` | white tee |
| `liz-pts-friends.jpg` | black tee |
| `liz-pts-checkin.jpg` | teal tee |
| `liz-pts-level.jpg`, `liz-pts-survey.jpg` | white tee |
| `liz-media-studio.jpg` | black long sleeve |
| `liz-pts-give.jpg` | maroon long sleeve |
| `liz-media-sofa.jpg` | cream tee |
| `liz-pth-badge.jpg` | heather gray hoodie |
| `liz-pth-creator.jpg` | lavender sweater (left chest) |
| `liz-pth-meetup.jpg` | burgundy sweater (left chest) |

## 2. The mark with VEGANS EXPLORE under it

| Picture | Garment and color |
|---|---|
| `liz-pts-guide.jpg` | lilac tee |
| `liz-pts-share-v2.jpg` | sage green tee |
| `liz-pts-shape.jpg` | navy tee |
| `liz-pts-bounty.jpg` | mustard tee, and a canvas tote with the mark |
| `liz-pth-shop.jpg` (Theo) | cream tee |
| `liz-media-share.jpg` | white long sleeve |
| `liz-media-network.jpg` | olive tee |
| `liz-media-books.jpg` | black tee |
| `liz-gd-*.jpg` (the other Guides) | black, white, heather gray, navy and green tees |

## 3. Volunteer tee

`liz-pts-give-v2.jpg`: deep red tee, VOLUNTEER across the chest, no logo (Sean: putting the mark on the back "looks like a mistake").

## 4. Liz's pink tee

Her pink Vegans Explore tee (the favorite in CLAUDE.md, "Guide scenes") belongs in the line too.

## 5. The Guide wardrobe: reference sheets for Guide art (Sean, 2026-11-11)

Sean: "make sure that we have all of these shirts already in our inventory... so that way you're using it as a reference when you're
making it... so you don't have to constantly be creating these. So we should have an apron."

Every garment a Guide wears (from the avatar set, `public/brand-kit/avatars/`) has a plain front view with the **real** mark
composited on it, never drawn by a model. The drawing is the to-scale tee from the review page (artifact `VLw5FQyYpEe2zCJkDRTAn6`,
size L), extended with the open layers, the chef jacket and the apron. Source and renderer: `scripts/guide-wardrobe/`
(`node scripts/guide-wardrobe/render.js <outDir>`). Placement: canon `canon-front-print-placement`, the top of the mark 2.0 in under
the collar seam, centered, 5 in wide. On the apron the mark sits 3.1 in under the bib's top edge, the highest the real apron prints
(measured on its Printify mockup); the drawing matches the product (Pascal's ids replaced 2026-11-11, the old ones retired). Mark color follows the brand kit: green on pink,
white and cream; ink on orange and bright green; all white on dark green.

Contact sheet: `docs/merch/2026-11-11-guide-wardrobe-sheet.jpg`; Printify mockups: `docs/merch/2026-11-11-guide-wardrobe-printify-mockups.jpg`. Files: `vegan-media/media/merch/guide-wardrobe/<name>.jpg`, 1600 x 2000 (4:5), each checked byte for byte against the public URL.

| Guide | Pass this reference (Higgsfield media id) | File | Mark |
|---|---|---|---|
| Liz | `84cdbb1f-eb35-4547-89a9-4d91120afea7` | `liz-pink-tee.jpg`, pink tee #FF9EC4 | green |
| Maya | `c4e930f0-227c-414f-9f0d-0818f7d490f8` | `maya-outfit.jpg`, white tee under the open light denim jacket | green, on the tee |
| Theo | `998f5f30-0420-4ace-8d7c-30fbef443cc9` | `theo-cream-tee.jpg`, cream tee | green |
| Nori | `32cec0e9-7009-4b14-8a4a-47be39903a18` | `nori-dark-green-tee.jpg`, dark green tee #2D5C27 | all white |
| Dani | `9de536f5-7bf5-4936-a0e5-7de78f73b045` | `dani-orange-tee.jpg`, orange tee #F69820 | ink |
| River | `28492716-11a8-4495-8087-2dcc745b7c52` | `river-bright-green-tee.jpg`, bright green tee #22C55E | ink |
| Kai | `77ea20e2-8a7b-4c3b-838c-813672d97213` | `kai-outfit.jpg`, white tee under the open mustard overshirt | green, on the tee |
| Pascal | `8d055c2b-b45b-4bb0-89cb-5427ae1206dd` | `pascal-outfit.jpg`, white chef jacket under the dark green bib apron | all white, on the bib |

The pieces on their own (for a scene where a layer comes off, or a product shot):

| Piece | Higgsfield media id | File |
|---|---|---|
| White tee (Maya, Kai) | `ceb91411-417a-4199-9b24-670391eded20` | `white-tee.jpg` |
| Light denim jacket, plain | `d3f23fc3-a2d0-410b-a42c-77e06ecdf002` | `maya-denim-jacket.jpg` |
| Mustard overshirt, plain | `3fb2c512-a933-4c87-8fdb-c3bb96da151e` | `kai-mustard-overshirt.jpg` |
| White chef jacket, plain | `213b78ba-1aab-43a9-b16b-b36acfcf52a5` | `pascal-chef-jacket.jpg` |
| Dark green bib apron | `38fd41bb-f6d0-4c12-8609-13dedb4115fe` | `pascal-bib-apron.jpg` |

**How Guide art uses them** (the Guide scenes recipe in CLAUDE.md): the Guide's own picture first, the style scene second, the
Guide's wardrobe reference third, with "wearing exactly the garment in the third reference, the suitcase mark in the same color,
size and place". Then check the mark in the render against the real file (canon `canon-ve-logo`); if the model drew it wrong, keep
the drawing and composite the real mark (canon `canon-front-print-placement`, lookbook rule).

### Humble Cabbage: the wardrobe products (LIVE 2026-11-11)

Sean, 2026-11-11: "I like the mock-ups. I approve." Defaults 1 to 4 below accepted. Both set visible at 19:13 UTC and proven on
production (`humblecabbage.com/products/6af4babfa731c69cb1011006` and `/products/6af4baf2e5e7d79941063a2e` load with Add to cart; `/shop`
lists both). Blanks stay as they are (Sean: "Let's keep what we're doing, what we're using"; organic options looked at and not adopted).
Orders cannot print until the Printify payment method is added to the shop.

Sean, 2026-11-11: "go ahead and look where we keep the secrets." The token is `PRINTIFY_API_TOKEN` in `lesaruss_secrets`; it was read server
side by the one-time function `ve-once-printify` (never copied into a chat), now back to the 410 stub.

| Draft | Printify id | Blank | Colors and mark | Price | Placement, measured on the mockup |
|---|---|---|---|---|---|
| Vegans Explore Mark Tee | `6af4babfa731c69cb1011006` | Bella+Canvas 3001, provider 39, S to 3XL | Natural, White, Pink: green. Forest: all white. Orange, Kelly: ink. Humble Cabbage neck label | $35 | Size L: art top 2.10 in under the front collar seam (pass 1.8 to 2.2). Printify draws one mockup per color, so XL and 2XL cannot be measured from mockups; S and M use their smaller print area at the same 5 in |
| Vegans Explore Mark Apron | `6af4baf2e5e7d79941063a2e` | Port Authority A900 heavy twill bib apron, blueprint 5549, provider 217, Dark Green, DTF | all white | $30 | 3.1 in under the bib's top edge (about 1 in under its stitched band): the top of the print area, as high as it prints |

Both are hidden and tagged `preview`, so production 404s them and only preview deployments show them. Review: the humble-cabbage preview of
branch `claude/humble-cabbage-guide-tees-p7k1w0`, `https://humble-cabbage-6imvdkikd-contact-2245s-projects.vercel.app/products/6af4babfa731c69cb1011006`
and `/products/6af4baf2e5e7d79941063a2e`. Going live is Sean's yes, then flipping them to visible.

Incident (error registry `PRINTIFY-CREATE-DEFAULTS-VISIBLE`): Printify creates products visible. The tee was visible for about a minute
(18:57 to 18:58:38 UTC) before it was hidden; production never listed it (checked: /shop without it, its page 404), no orders. The apron was
created and hidden in one command.

Print files: lesaruss/humble-cabbage branch `claude/humble-cabbage-guide-tees-p7k1w0`, `public/brand/print/vegans-explore/`
(`ve-mark-ink-tee-5in.png` and `ve-mark-white-tee-5in.png` added 2026-11-11; Printify uploads green `6af4baac89952fec489b5d9d`, white
`6af4baad2deb9418e6ed6159`, ink `6af4baae22f12ff04635718b`).

Not products: the denim jacket, the overshirt and the chef jacket carry nothing of ours, so they are reference sheets only.

Open with Sean (each has a default):
1. **Shirt colors against the brand kit.** Printify's Pink is a soft baby pink, lighter than Liz's #FF9EC4; Kelly reads blue green, not
   the bright green #22C55E; Orange is redder than #F69820. The catalog also has Charity Pink and Heather Grass Green. Default: keep
   Pink, Kelly and Orange; swap any you call out after looking at the preview.
2. **The Forest tee's mark is all white** (brand kit), not the bright green #3A9B3E of the 2026-11-09 draft. Default: white.
3. **Kai's mark.** His current drawing has it on the overshirt's left pocket; the wardrobe puts it on the white tee, like Maya's. Default: on the tee.
4. **The apron** at $30, mark 3.1 in under the bib edge (as high as this apron prints). Default: yes.
5. The rest of the 2026-11-09 line (Black, Mint, Teal, Rust on the Mark Tee, the long sleeve, hoodie, crewneck, tote, stacked colors,
   Volunteer, Liz's pink stacked tee) still waits on Sean's yes from part 1; the wardrobe drafts hold only the Guides' own colors.
6. **The Printify payment method** is still missing on the shop: no order can go to print until it is added.
