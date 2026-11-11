# Handoff: the Guide wardrobe and Humble Cabbage (2026-11-11)

Playbook `guide-tees-merch` (brand `humble-cabbage`). Sean: "make sure that we have all of these shirts already in our inventory... so
that way you're using it as a reference when you're making it... So we should have an apron."

## Done and proven

- **Reference sheets, every garment a Guide wears**: 13 plain front views with the real suitcase mark composited (never model drawn),
  in `vegan-media/media/merch/guide-wardrobe/`, md5 checked against the public URLs, imported into Higgsfield. Per Guide ids, files and
  mark colors: `docs/merch/2026-11-09-guide-tees.md` part 5. Source and renderer: `scripts/guide-wardrobe/` (copied from the review page's
  to-scale garment drawing). The Guide scenes recipe in CLAUDE.md now passes the wardrobe sheet as the third reference.
- **Live on humblecabbage.com** (Sean: "I like the mock-ups. I approve."):
  - Vegans Explore Mark Tee `6af4babfa731c69cb1011006`, Bella+Canvas 3001 / provider 39, Natural, White, Pink (green mark), Forest
    (white mark), Orange, Kelly (ink mark), S to 3XL, $35, Humble Cabbage neck label. Measured 2.10 in collar seam to art top on L.
  - Vegans Explore Mark Apron `6af4baf2e5e7d79941063a2e`, Port Authority A900 / blueprint 5549 / provider 217, Dark Green, white mark,
    $30. Prints no higher than 3.1 in under the bib edge; Pascal's apron and outfit references are drawn to match.
  - Proven 19:34 UTC: both product pages load with Add to cart, each with its own color picker only, and `/shop` shows two cards.
- **Blanks stay as they are** (Sean: "Let's keep what we're doing, what we're using"). Organic options looked at: Stanley/Stella
  Creator 2.0 (SXU001, 100% organic, US printers 217 and 74) and Bella+Canvas 3001RCY; not adopted.

## Rules learned (error registry)

- `PRINTIFY-ACCESS-TOKEN-IN-LESARUSS-SECRETS`: the Printify token is in `lesaruss_secrets`; never ask Sean for it. Use a one-time
  `ve-once-printify` function that reads it server side (now the 410 stub).
- `PRINTIFY-CREATE-DEFAULTS-VISIBLE`: Printify creates products visible; hide in the same command. (The tee was visible about a
  minute before review; production never listed it.)
- `HC-DESIGN-TAG-LINKS-UNRELATED-PRODUCTS`: `design:<slug>` is only for one design split into per-color listings (Collective 111);
  sharing it linked the apron and the tee. Removed.

## Waiting on Sean

- **The Printify payment method on the Humble Cabbage shop.** Orders for these (and every product) sit unprinted until it is added.
  That also blocks a sample order to check fit and color in hand.
- The rest of the 2026-11-09 line (part 1 of the merch doc: other Mark Tee colors, long sleeve, hoodie, crewneck, tote, stacked
  colors, Volunteer tee, Liz's pink stacked tee) still waits on his yes.

## Loose ends

- The print files (ink and white marks) are on lesaruss/humble-cabbage branch `claude/humble-cabbage-guide-tees-p7k1w0` (`29ea6f1`),
  not merged. The live products use the Printify uploads (green `6af4baac89952fec489b5d9d`, white `6af4baad2deb9418e6ed6159`, ink
  `6af4baae22f12ff04635718b`), so nothing depends on the branch; merge it with the rest of the line.
- Both products still carry the harmless `preview` tag (ignored once visible).
- Kai's current avatar has the mark on his overshirt pocket; his next drawing uses the wardrobe sheet (mark on the tee).
