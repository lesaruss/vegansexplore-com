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

## Build, 2026-11-09 (Logan): waiting on Sean's yes

**Where the store lives** (on record, not guessed): humblecabbage.com, the Next.js storefront in `lesaruss/humble-cabbage`, Stripe checkout,
**Printify** fulfillment (shop 28392315; `brand_context` humble-cabbage and the repo README). New listings are preview-first: hidden in Printify
and tagged `preview`, so only Vercel preview deployments show them (`lib/printify.ts` `shown`).

**Print files**: `lesaruss/humble-cabbage` `public/brand/print/vegans-explore/` (branch `claude/humble-cabbage-guide-tees-p7k1w0`, 8992e38), with a README.
Rendered from `public/ve-logo-mark.svg` and `public/logo-ve-portrait-v1.svg`; on dark shirts the suitcase is #3A9B3E and VEGANS EXPLORE white.

**Review page for Sean** (mockups to scale on a size L, each beside its drawing): https://claude.ai/artifact/VLw5FQyYpEe2zCJkDRTAn6

**Proposed products**

| Product | Garment | Colors | Print | Price |
|---|---|---|---|---|
| Vegans Explore Mark Tee (lead) | Bella+Canvas 3001 | Natural, White, Black, Forest, Mint, Teal, Rust | Mark 5 in, front | $35 |
| Vegans Explore Mark Long Sleeve | Bella+Canvas 3501 | Black, Maroon | Mark 5 in, front | $42 |
| Vegans Explore Mark Hoodie | Bella+Canvas 3719 | Athletic Heather | Mark 5 in, front | $55 |
| Vegans Explore Mark Crewneck | crewneck (Independent SS3000) | Lavender, Burgundy | Mark 3 in, wearer's left chest | $50 |
| Vegans Explore Mark Tote | natural canvas tote | Natural | Mark 5 in | $25 |
| VEGANS EXPLORE Stacked Logo Tee (existing listing, add colors) | Bella+Canvas 3001 | Lilac, Sage, Navy, Mustard, Olive, White, Athletic Heather (+ Black, Natural already live) | Stacked 7 in, front | $35 |
| VEGANS EXPLORE Stacked Long Sleeve | Bella+Canvas 3501 | White | Stacked 7 in, front | $42 |
| Volunteer Tee | Bella+Canvas 3001 | Cardinal | VOLUNTEER 10 in, front only, no mark anywhere | $35 |
| Liz's Pink Tee | Bella+Canvas 3001 | Pink | Stacked 7 in (white letters as drawn; black shown as an option) | $35 |

Color names are the closest catalog names, to be checked against provider 39's live catalog.

**Placement**: canon `canon-front-print-placement` v3 already sets the art top 3.0 in under the collar seam on L (the top of Sean's 3 to 3.5 in).
Sean's GeekFon Society Logo Tee (Black, XL, order d013cd24) was placed 2026-10-08 10:48 UTC, about 8 hours after every tee moved to 3.0 in, so
the likely cause of "a tad too low" is size: the rule was only measured on L. Every mockup gets measured on L, XL and 2XL (2.8 to 3.2 passes).

**Blocked on Sean**: (1) the yes on the line, colors and prices; (2) `PRINTIFY_API_TOKEN` as a secret in the Claude Code environment (not copied
out of Vercel into chat); (3) the Printify payment method, still missing (`PRINTIFY-SHOP-PAYMENT-METHOD-MISSING-HUMBLE-CABBAGE`), so no order can print.
Defaults if Sean says nothing else: stacked colors join the existing listing; pink tee white letters as drawn; the Volunteer tee keeps the inside
Humble Cabbage neck label.
