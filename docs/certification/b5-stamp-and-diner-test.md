# vegans-explore-initiative-business-certification: B5, stamp and decal art, and the diner comprehension test

Draft for Sean, 2026-11-06 (Logan). Built from Standard V1.2 (playbook record 044b9cf2). Nothing printed, sent or published.
"Pre-Vegan" is the working name until the trademark search (A5) and this test pass.

## The art (`public/certification/`, our own SVGs, Montserrat, the logo's colors)

| File | What it is | Where it goes |
|---|---|---|
| `stamp.svg` | The seal: PLANT-BASED DISH on top, PRE-VEGAN CERTIFIED below, our suitcase mark (from `public/ve-logo-mark.svg`, never redrawn), VEGANS EXPLORE | Menu key, decal, the status page. 1 inch or larger |
| `stamp-mono.svg` | One color (black) | Menus printed in one color |
| `stamp-reversed.svg` | White on forest green | Dark menus |
| `stamp-small.svg` | The suitcase mark in a ring, no words | Beside a dish on a menu or delivery app, under 1 inch, always with the words beside it |
| `menu-line.svg` | Small mark + "Plant-Based Dish, Pre-Vegan Certified" | Under each certified dish |
| `menu-key.svg` | The key: N of M, what else they serve, not an allergen claim, the live link | Once on every menu page that carries the mark |
| `decal.svg` | Window decal, 8 x 10 in: "Selected dishes certified here", N of M, what else they serve, the QR, the link | Window or counter |
| `test-menu.svg` | Made-up menu (Harbor Table, v2 2026-11-06: starters and mains, 2 of 8 marked) for the diner test | The test only |

Placeholders `[N] [M] [serves] [CODE]` are filled per certificate from the Depot. The QR square in the decal takes the Depot's Download the QR.

### Rules that go into the agreement (B6) and the Verifier manual (B7)

1. The mark only ever sits beside a dish that is **active** on `/certified/<code>`. Never on the door, the sign, a logo, social profile art
   or a whole menu section heading.
2. Any menu page with the mark carries the key on the **same page**, readable before ordering.
3. The decal is only ever the whole decal (count, what else they serve, the QR). The seal is never cut out of it to stand alone.
4. Delivery apps: the words "Plant-Based Dish, Pre-Vegan Certified" in the dish description, and the key's lines in the store description.
5. Smallest seal: 1 inch (25 mm). Smaller: `stamp-small.svg` plus the words.
6. Suspended, expired, revoked or withdrawn: the mark comes off that dish within 2 business days (Standard V1.2 default); a whole-location
   end removes the decal the same way.
7. No recoloring, stretching, outlines or added words. Clear space around the seal: a quarter of its width.
8. For print, the text is converted to outlines (the files name Montserrat; a printer without it falls back to Arial).

## The diner comprehension test

Purpose: prove diners read the mark the way we mean it before anything is printed for a restaurant. Locked as part of B5 and named in
Standard V1.2 as the condition for keeping "Pre-Vegan".

### The risk it is built to catch

"Pre-Vegan" can be read as "almost Vegan" or "mostly Vegan, may contain a little". That reading is the opposite of what the gates prove
(the dish has no animal products and a protected cooking path). If diners read it that way, the name changes before print.

### Who

- 40 adults, no Vegans Explore team, no one who works at a first-round restaurant.
- At least 15 who do not eat Vegan, at least 10 who do, the rest in between (asked at the start, never used to screen out).
- Sources, in order: tasting-night guests and walk-ins at first-round restaurants (on paper, with the restaurant's OK), then members. Nobody
  is paid for an answer; a small thank-you (25 points for members) is the same whatever they answer.

### How

1. Show `test-menu.svg` for 10 seconds, then take it away.
2. Ask the questions below without the card. Write down the words they use for C4.
3. Show the card again with `decal.svg` and ask Q6 to Q8.

| # | Question | Correct | Critical |
|---|---|---|---|
| C1 | Is Harbor Table a Vegan restaurant? | No (some dishes only) | Yes |
| C2 | Which dishes carry the mark? | The curry and the burger (or "only the marked ones") | Yes |
| C3 | If you had a milk or egg allergy, does the mark tell you a dish is safe for you? | No | Yes |
| C4 | In your own words, what does "Pre-Vegan Certified" mean on a dish? | Coded: "no animal products and checked" = right; "almost / mostly / partly Vegan, may have some dairy" = misread | Yes |
| C5 | Does this restaurant serve meat or fish? | Yes | Yes |
| Q6 | If the curry's recipe changed yesterday, how would you check it is still certified? | Scan the QR or the link | No |
| Q7 | How much would you trust the mark, 1 to 5? Would it make you more likely to order the dish? | Recorded | No |
| Q8 | Which of these says most clearly that the dish has no animal products: "Pre-Vegan Certified", "Certified Plant-Based Dish", "Verified Vegan Dish"? | Recorded | No |

### Pass

- Each critical question right for **85% or more** of people (34 of 40), and
- C4 "almost Vegan" misreads at **10% or less** (4 of 40) overall and 15% or less among people who do not eat Vegan.

If C4 fails, the name goes back to Sean with Q8's numbers before any print order and before A5's trademark filing. Any other critical
question that fails changes the art or the key, then the test runs again with 20 new people.

### Scoring sheet

One row a person: group (eats Vegan / sometimes / does not), C1 to C5 right or wrong, C4 words, Q6, Q7, Q8 choice, where they were asked.
Two people code C4 apart; disagreements go to a third. The result is a dated playbook record (done is a recipe).

## What Sean decides

1. Approve the art as drawn, or say what to change.
2. Approve the test, its pass marks and where it runs. Default: at the first round's tasting nights and restaurants, paper sheets.
3. Hold "Pre-Vegan" until C4 passes (default yes).
