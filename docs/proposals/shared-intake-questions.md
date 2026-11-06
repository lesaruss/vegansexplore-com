# ve-events-guide: shared intake questions (step 3 of the membership rule), for Sean to read

Canon `canon-ve-door-guides` v6, `shared_answers` (locked 2026-11-06). A question shared across the business Guides' intakes is asked once;
every later intake fills it in, skips it on the way through, lists it at the end with Change, and still pays its points, so each intake pays
its full 250. The newest answer wins in every intake. **Built and live in the database, with no question shared yet.** Nothing a member sees
changes until you approve the wording below.

## The four shared questions (Logan's draft)

| Key | Question | Kind | Choices |
|---|---|---|---|
| `chapter` | Which Vegans Explore chapter are you in, or closest to? | Pick one | South Florida, Central Florida, North Florida, Atlanta, Washington, D.C., Maryland, Virginia, Delaware, West Virginia, Philadelphia, New York, Los Angeles, London, Somewhere else |
| `org_name` | What is the name of your business, group or organization? | Short answer | |
| `org_link` | Your website or Instagram | Short answer | |
| `vegan_level` | How Vegan is what you run? | Pick one | Everything is Vegan; Mostly Vegan; Vegan options alongside other food; I am planning to make it more Vegan |

These are the four you named (city, how Vegan, what they do, their links). "What they do" is each intake's own first question (I host /
I promote / I run a venue; founder / owner / team), because the choices differ by Guide; it shows under the Registered badge (step 6).

## What changes in each intake

**Events** (no one has finished it, so nothing is lost):
- "Where do you mostly host?" becomes the shared `chapter` question.
- "The name of your group, business or event, and a link to it" splits into `org_name` and `org_link`.
- "How Vegan are your events?" becomes `vegan_level`. Its stored values stay the same (all, mostly, friendly, notyet), so the sponsor
  ranking in Depot > Event sponsors keeps scoring it.

**Restaurant** (no one has finished it):
- Adds `chapter`, `org_name` and `org_link`.
- "How Vegan is your menu?" becomes `vegan_level`.

**Creator and Nonprofit** get all four when they move onto the shared system (step 4).

Each intake's points are re-spread so it still totals 250.

## The words a member reads when an answer is filled in

- Above a filled-in question: "Filled in from what you told us before. Change it if it is different now."
- At the end: "You answered these before, so we filled them in:" then one button per question, "Change: <the question>".

## Decisions for Sean

1. Approve the four questions and their choices, or change them.
2. Approve the two lines a member reads.

Once approved, Logan tags the questions (one migration), checks both intakes in a browser at 1440 and 390 px, and merges.
