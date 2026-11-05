# ve-pre-vegan-business-guide: tab list, survey and Pascal's lines (draft for Sean, 2026-11-05)

Free door Guide for businesses that are not Vegan and are adding Vegan (coffee shops, gyms, juice bars, cafes, caterers).
Parent: the Vegan Restaurant Guide (copied under the template gate, content changed only). Pascal narrates. Header box:
"Free with a short survey". Nothing below is built. Every line is a text draft; nothing is recorded (Pascal has no approved voice).

Rules kept throughout: no promise of sales, customers or no backlash; tasting nights are Coming until one has run; never
"fully Vegan" for a mixed menu or a mixed-line company; plant-based material is not a Vegan claim; featuring never buys rank;
no chapter counts.

## 1. Tabs

Visitors see the first four and Get in; the rest open after the survey (the Restaurant Guide's `after: 1`).

| # | Tab | Who | What is on it |
|---|---|---|---|
| 1 | Overview | everyone | What the Guide is, the three steps (read, survey, use), one button: Take the survey |
| 2 | Why add Vegan | everyone | Honest reasons: who asks for it, cost and waste of a short Vegan list, what it does not do. Sourced facts only, each with its source |
| 3 | What to add | everyone (one type free) | By business type: Coffee shop, Gym or studio, Juice bar, Cafe or bakery, Caterer or venue. Each: 3 to 5 easy first items, what to stock, what to watch for (shared fryers, honey, whey, gelatin, bone char sugar). **Coffee shop is the free example** |
| 4 | How to say it | everyone | Menu words: "Vegan" only for an item with no animal products; "Vegan options" for the menu; never "fully Vegan" unless the whole menu is. Cross-contact line to use. Labels we use in the Directory |
| 5 | Sourcing | members | The shared supplier directory (`ve-sourcing`, guide `pre-vegan-business-guide`), honest labels |
| 6 | Buy or make | members | `#/sourcing/make`: each item, who sells it, or a home-scale recipe (labeled home scale) |
| 7 | Get found | members | How the Directory lists Vegan options, the 10-member-vote vetting rule, Being vetted, what moves a listing up (votes, never payment) |
| 8 | Claim your page | members | Find your page, claim it ($11, 1,100 points or the Partner plan, as today), or Join the Directory if not listed |
| 9 | What's next | members | The Restaurant Guide's What's next, with Tasting nights marked Coming |
| 10 | My list | members | Saved items (what-to-add items, suppliers) |
| — | Get in | guests | "Adding Vegan to your menu? Tell us about your business in a short survey and the whole Guide opens. Free, no card." |

**Recommendation:** use these 10 plus Get in. The Restaurant Guide's audit, Pulse, demo, Promotions and dashboard tabs are left out.
They are about a Vegan restaurant's page, not adding to a menu. Claim your page covers the dashboard.
**Default if you don't override:** as above.

Open to you: should "What to add" list one business type free or all of them? **Default: Coffee shop free**, the rest after the survey.

## 2. The business survey (`ve_surveys` `pre-vegan-business-guide`, 100 points, 5 required)

Points add up to 100: the five required are 12 each (60), the eight optional are 5 each (40).

| # | id | Kind | Question | Req | Pts |
|---|---|---|---|---|---|
| 1 | pb_kind | choice | What kind of business is it? Coffee shop · Gym or studio · Juice or smoothie bar · Cafe or bakery · Restaurant · Caterer or venue · Something else | yes | 12 |
| 2 | pb_role | choice | Are you the owner, a manager, or part of the team? | yes | 12 |
| 3 | pb_now | choice | What Vegan do you serve today? Nothing yet · One or two items · A few items · A full Vegan section | yes | 12 |
| 4 | pb_add | multi | What do you want to add? Plant milks · Food items · Baked goods · Desserts · Protein (shakes, bars) · Grab-and-go · Not sure yet | yes | 12 |
| 5 | pb_worry | long | What is your biggest worry about adding Vegan? | yes | 12 |
| 6 | pb_who | multi | Who is asking for it? Regulars · New customers · Staff · Nobody yet, I want to get ahead | no | 5 |
| 7 | pb_city | text | What city are you in? | no | 5 |
| 8 | pb_size | choice | How many locations? 1 · 2 to 5 · 6 or more | no | 5 |
| 9 | pb_buy | multi | Where do you buy food today? A distributor (Sysco, US Foods, Cheney Brothers...) · Restaurant Depot or a warehouse club · Local suppliers · Grocery stores · Make it in house | no | 5 |
| 10 | pb_make | choice | Would you rather buy it ready or make it? Buy it ready · Make it · A mix | no | 5 |
| 11 | pb_kitchen | choice | Do you have a kitchen? Full kitchen · Small prep area · No kitchen, ready-made only | no | 5 |
| 12 | pb_when | choice | When do you want it on the menu? This month · In 3 months · This year · Just looking | no | 5 |
| 13 | pb_help | multi | What would help most? Suppliers · Recipes · Menu words · Getting found · Training staff · Someone to do it for me | no | 5 |

**Recommendation:** these 13. They match the brief (kind, chapter via city, what they serve, what they want, who buys, biggest worry).
They also feed Sourcing and Buy or make, so a supplier campaign can be matched later. City is a text field, not a chapter picker,
because these businesses are anywhere. **Default:** as above.

## 3. Pascal's lines (text drafts)

`say` is for visitors, `sayMember` for members. Where only one is given, both are the same.

- **Overview.** say: "Hi, I'm Pascal. If you're adding Vegan to your menu, this Guide walks you through it: what to add, who to buy it from, and how to say it honestly. Read around. When you're ready, take the short survey and the whole Guide opens. It's free." sayMember: "Welcome in. Start with What to add for your kind of business, then Sourcing to find who sells it. Save anything to My list."
- **Why add Vegan.** "Here's the honest version. Who asks for Vegan, what a short Vegan list costs you, and what it won't do. Every number has its source under it."
- **What to add.** say: "Pick your kind of business. Coffee shops are open to everyone: the first things to add, what to stock, and what to watch for. The rest open with the survey." sayMember: "Pick your kind of business. Each one has a few easy first items, what to stock, and what to watch for."
- **How to say it.** "The words matter. Call an item Vegan only when it has nothing from an animal. Call your menu Vegan options, not fully Vegan, unless it is. Here's a line for shared kitchens too."
- **Sourcing.** "You don't have to make it all. Here's who sells it, and every supplier wears an honest label. Check with the supplier before you order."
- **Buy or make.** "For each item, see who sells it ready, or a recipe to make it. The recipes are home scale, so test a batch before you scale it."
- **Get found.** "Here's how people find you in our Directory. Places with Vegan options are vetted by member votes, and nobody can pay to move up."
- **Claim your page.** "If your business is in our Directory, claim your page and keep it current. If it isn't, add it here."
- **What's next.** "You're in. Thank you. Claim your page, save what you need, and follow us. Tasting nights are coming, and we'll tell you when the first one runs."
- **My list.** "Everything you saved is right here."
- **Get in.** "There's one way in, and it's free. Take the short survey about your business, and the whole Guide opens."

**Default:** these words, shown as text beside Pascal's still picture until you approve a voice.

## After approval (step 2, Logan)

A migration with the `ve_guides` row (door true, survey_slug, unpublished) and the survey rows, then the page and script copied
from the Restaurant Guide (noindex, Pascal, nav, footer, corner and min scripts), then step 3: prove it live.

Open calls for launch (Sean): Pascal's voice (none approved on his roster profile), the banner (Higgsfield credits), and the catalog card and sitemap.
