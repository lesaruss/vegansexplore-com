# History: certification

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Pre-Vegan Certification (LOCKED by Sean 2026-11-05, playbook `vegans-explore-initiative-business-certification`)

Canon `canon-ve-pre-vegan-certification` (v2). **Nothing built, sent or charged.** Vegan-food verification, pass or fail, for named dishes and
the kitchen practice behind them at one location, never "this restaurant is Vegan"; the lane for restaurants with Vegan options (100% Vegan
restaurants stay in the Restaurant Guide lane). The standard to work from is the playbook record **STANDARD V1.2** (2026-11-05, locked by Sean
from the Legal Research Report V1 he uploaded, AI-assisted research, not an attorney opinion): gates G1 to G8 all must pass; one public standard,
no public levels and no Shared Equipment mark; every certified dish has a protected cooking path (a clean separate pan, pot or barrier counts;
never shared fryer oil, cooking water or an uncleaned grill with animal products); a change to a dish stops its mark at once; suspension does not
wait on intent; every critical staff question right; public registry with a live QR status page, never a failure log; records for the term plus 5
years; the fee never buys the outcome; the pilot cohort (5 to 10, South Florida) is free and the price is set after the first two audits are
timed; verifier, desk reviewer and approver are different people and the approver is a person. Stamp: "Plant-Based Dish, Pre-Vegan Certified",
with N of M menu items certified and what else the restaurant serves. **Entity**: Sean is dissolving Vegans Explore Inc. (the nonprofit, never
501(c)(3)) from 2026-11-05; Vegans Explore continues as a DBA of LESARUSS Inc. (a separate LLC is open, decided before paid applications), and the
Vegans Explore Stripe account, bank account and recurring billing must move to LESARUSS Inc. first. **Verifiers** are recruited by a job posting
to our network (experienced people), not hired until the pilot. **Done is a recipe**: each finished step gets a dated record of what, how, who and
where, so the playbook shows how to run the program again. **Work it from the playbook's A-to-Z WORK QUEUE record** (A Foundation, B Build, C Pilot,
D Launch, Parked; GATE steps block what follows); anything not in the queue is a new idea for Sean, never built quietly. The Pre-Vegan
Restaurant Guide copies `guides/vegan-restaurant-guide.html` (template gate).

## Pre-Vegan Certification: B1 to B3 (Sean, 2026-11-05, playbook `vegans-explore-initiative-business-certification`)

Canon `canon-ve-pre-vegan-certification` v5. The standard (V1.2), the A-to-Z work queue and the earlier CLAUDE.md notes live on branch
`claude/fervent-hamilton-fc48qo` (not on `main`); this section covers B1 to B3, built on `claude/inspiring-hypatia-ilwro1` (not on `main`).
**Nothing is launched, sent or charged.**

- **B1, the Verifier forms** (Claude Doc https://claude.ai/artifact/CPSYLTidahPfAWWQv2QXWG): Form A, the desk review (12 application checks,
  12 checks for each dish, the outcome) and Form B, the visit (arrival, storage with a 3-invoice sample, watching each dish, two staff
  questioned with 7 critical questions where one wrong critical answer fails G5, a channel spot check, the photo log, to the approver within 2
  business days). The approver cannot overrule a Fail.
- **B2, the pre-assessment** (migration `20261105_pre_vegan_assessment.sql`): survey `pre-vegan-assessment`, 27 questions (`pv_license` to
  `pv_notes`, 0 points), `ve_preveg_rules` (95 rows: question, gate, value, score 0 to 2, blocker, advice; RLS on, no policies) and
  `ve_preveg_readiness(member)` (answered, overall %, each gate's %, blockers, next steps, ready to apply = no blocker, all answered and every
  gate at 75% or more). A multi-select answer scores as its worst tick; an unanswered question counts 0. **Private**: only the member reads it,
  through `ve-mission-survey` `preveg_readiness` (v9). Never shown to anyone outside the team.
- **B3, the Pre-Vegan Restaurant Guide** (migration `20261105_pre_vegan_guide.sql`; `guides/pre-vegan-restaurant-guide.html`,
  `guide-scripts/pre-vegan-restaurant-guide.js`, copied from the Vegan Restaurant Guide, `noindex`): a free door Guide opened by finishing its
  survey (`ve_guides.door`, `survey_slug`; the survey `admits`, so finishing makes them a member). Tabs: Overview, The stamp, How it works,
  The 8 gates (`#/gates/g1..g8`), Start the check (guests); Your readiness and What's next (members). What's next has an **optional $11
  contribution** (`/dashboard?contribute=1`) with the normal **1,100 welcome points** on a first payment (Sean: no double points); the page
  says it has no effect on certification or the score. Liz's lines are text drafts. `survey.html` now sends a finished Guide survey to its
  `guide_slug`. **Not launched**: `published` false and the survey `active` false until Sean says go.
- **Webhook fix** (`ve-stripe-webhook` v64): a member who joined by a survey door gets the 1,100 welcome points on their first $11
  (`!entry_paid_at`), where before it counted as a repeat contribution and paid none.
- **Not proven live**: a real member reading their readiness, and a real first $11 granting the points (both tested in rolled-back transactions).
- **Next (Logan)**: B4, the dish status registry and the QR status page. **Sean**: A4 the attorney, A2 the entity, approve Liz's lines and the
  go to publish, both branch merges, the `ve_outreach_due` people-only guard, and whether invitation members also get 1,100 on a first $11.

## Pre-Vegan Certification: B4, the dish registry and the QR status page (Logan, 2026-11-06, playbook `vegans-explore-initiative-business-certification`)

Built from Standard V1.2 (playbook record 044b9cf2). The standard, the queue and B1 to B3 live on branches `claude/fervent-hamilton-fc48qo` and
`claude/inspiring-hypatia-ilwro1` (not on `main`); this is on `claude/gracious-gauss-d7r3h7` (not on `main`). **Nothing is certified, sent or launched.**

- **Data** (migration `20261106_pre_vegan_dish_registry.sql`, applied through the one-time `ve-once-preveg-registry`, now the 410 stub, since the
  connector held it): `ve_preveg_certs` (one location for one 12-month term: `listing_id`, the QR `code` (7 characters, no 0, O, 1, I or L),
  `term_start`, `term_end`, `menu_items_total` (the M in N of M), `also_serves` (meat, fish, dairy, eggs), `verifier_name`, `desk_reviewer_name`
  (must differ), `team_note`), `ve_preveg_dishes` (`status` applied, pending, active, suspended, expired, revoked, withdrawn; `certified_at`) and
  `ve_preveg_dish_events` (every move with its reason and who). RLS on, no policies. **Records are kept**: a delete on any of the three, or an edit to
  the history, raises `records_are_kept` (G8, term plus 5 years); a direct status update raises `use_ve_preveg_dish_set_status`.
- **Moves** (`ve_preveg_dish_set_status(dish, to, reason, actor)`, service role only): applied to pending or withdrawn; pending to active (the approver),
  applied (did not pass, re-test) or withdrawn; active to suspended, expired, revoked or withdrawn; suspended to active, expired, revoked or withdrawn;
  expired to applied (renewal); revoked and withdrawn are final. A reason is always required; only a super admin moves; **active needs** a current
  term, the menu count, both people named, and an approver who is neither of them (by member id or name). **No grace period**: cron
  `ve-preveg-expire` (05:05 UTC) and every team read expire dishes whose term ended, and the public read treats an ended term as not current at once.
- **Public** (`ve_preveg_cert_public(code)`, `ve_preveg_registry_public()`): only active and suspended dishes in a current term, N of M, what else
  they serve, the term; never a reason, never applied or pending, never the people or the note. States: certified, suspended (none active), not_current
  (once certified, nothing now, no detail), not_found (never certified). Never a failure log.
- **Edge function `ve-certification`** (verify_jwt off): public `status {code}`, `registry` (no-store, so a suspension shows at once); team (a super
  admin's token, or the admin token with `as_member`; a Guide account is view only) `list`, `get`, `listing_find`, `cert_save`, `dish_add`,
  `dish_edit` (a certified dish keeps its name: a changed dish is a new review), `dish_status`. Deployed from bdd8538, source sha256 matched.
- **Depot > Pre-Vegan Certification** (`/admin/depot/certification`, Directory in the Go to menu; copied from the Watchlist): certificates by
  Certified, Has a suspension, In progress, Not current; New certificate (find the Directory listing); one certificate (`#c/<id>`): the QR (drawn in
  the browser by `/public/vendor-qrcode.js`, qrcode-generator 1.4.4, MIT, our own copy) with Download the QR, the dishes with Change status (a move and
  its reason), Add a dish, What the public sees, the certificate form, the history.
- **The public pages** (`certified.html`, `noindex` until launch, not in the sitemap; copied from the listing page's hero, info bar and two columns):
  `/certified/<code>` (rewrite in `vercel.json`) is the QR status page: the stamp line "Plant-Based Dish, Pre-Vegan Certified", N of M, what else they
  serve beside it, each dish Certified or Suspended, Read before you order, What the stamp means (never a health, allergen or food-safety claim),
  Something wrong? (the Feedback window, the diner report until its own form is built), checked live with the time. `/certified` is the registry.
- **Proven 2026-11-06** in a rolled-back transaction (every move and refusal above, the public read with no reason leaking, expiry, the record locks)
  and live (public actions, the team actions refuse no token). Pages checked at 1440 and 390 px beside the listing page and the Watchlist against
  mocked answers. **Not proven**: a real certificate made through the Depot (it cannot be deleted, so the first real one should be a pilot restaurant).

## Pre-Vegan Certification: merged, and B5 to B7 drafted (Logan, 2026-11-06, playbook `vegans-explore-initiative-business-certification`)

- **Merged to `main` 2026-11-06** (Sean: "Merge all, in order"): `claude/fervent-hamilton-fc48qo`, `claude/inspiring-hypatia-ilwro1`, `claude/gracious-gauss-d7r3h7`
  (16b85ca; only CLAUDE.md conflicted, all three sections kept). Everything stays dark: the Pre-Vegan Restaurant Guide unpublished, its survey inactive,
  `/certified` noindex with 0 certificates. **The live webhook had lost B3's fix**: `ve-stripe-webhook` v65 was deployed from `main` before the merge, so a
  survey-door member's first $11 paid no 1,100 welcome points. Redeployed as v66 from 16b85ca (source sha256 58d2dc3b matched; it has both the money-in alerts
  and `firstPayment`). Lesson: before deploying a function from `main`, check that no unmerged branch has deployed a newer version of it.
- **B5, stamp and decal art and the diner comprehension test** (draft for Sean; `public/certification/*.svg` on branch `claude/blissful-fermi-qmyiwt`, not on
  `main`; `docs/certification/b5-stamp-and-diner-test.md`, sheet `docs/certification/b5-art-sheet.png`): the seal (color, one color, reversed), a small mark for
  under 1 inch (always with the words), the menu line, the menu key, the 8 x 10 decal with a QR square, and a made-up test menu (Harbor Table). Usage rules feed
  the agreement and the manual. The test: 40 adults, 5 critical questions, pass at 85% each, and the C4 "almost Vegan" misread at 10% or less; if C4 fails, the
  name "Pre-Vegan" goes back to Sean before print and before A5. **The seal carries our suitcase mark** (Sean, 2026-11-06: "use the actual suitcase that we use for our logo"), copied from `public/ve-logo-mark.svg`, never redrawn, in every version.
- **B6, the restaurant agreement draft for counsel** (`docs/certification/b6-restaurant-agreement-draft.md`): 14 sections and schedules A to F from the locked
  records, open choices in brackets, seven questions for counsel. To reconcile with the A3 Standard doc's 14 clauses (that Claude Doc is not shared with build
  sessions).
- **B7, the Verifier manual** (`docs/certification/b7-verifier-manual.md`): the job and independence rules, desk review, the visit, a G3 protected-path table for
  A6 to approve, training, a 10-case ring test (9 of 10 and no false pass), and the A6 reviewer profile. **C2 invitation text** drafted
  (`docs/certification/c2-pilot-invitation-draft.md`); it goes into Depot > Outreach only after C1 and A4.
- Nothing sent, printed, published or charged.

## Pre-Vegan Certification: the paid model (LOCKED by Sean 2026-11-06, playbook `vegans-explore-initiative-business-certification`)

Sean: "No, we're not doing free anything... This is real work... it pays for itself"; "lock it with my notes". Canon
`canon-ve-pre-vegan-certification` v8 (`paid_model_v8`), playbook decision 49755c18 and WORK QUEUE v2 13bcfd3d (replaces a194e04a for C and D).
**This replaces the free pilot in Standard V1.2.**

- **The Guide is free with its survey** (the education and the way in). **Certification is $250 per dish**, paid up front: the desk review, the
  Verifier's kitchen check, one community tasting night (feedback to the restaurant, anonymous to it, never pass or fail), the 12-month term and one
  courtesy check during it. **Renewal $150 per dish a year.** The fee buys the review, never the outcome; a failed dish may be submitted again. No free
  visits and no points for certification work.
- **The term never pauses**: a dish pulled from the menu keeps its clock running; the same unchanged dish back within the term still counts until the
  original end date.
- **Changes**: the restaurant tells us before any change to a certified dish; any change voids that dish's certification; ignorance is no excuse.
  **Hiding a change or misleading diners** ends every certification at the location and removes the restaurant from Vegans Explore (listing removed, never
  deleted) for **2 years**, then it may apply again.
- **Accountability**: every dish shows when it was last checked; secret shoppers spot check between visits (staff must say it is 100% plant-based); an
  anonymous report button on the QR page and the listing; staff kept trained.
- **Verifiers** are trained, paid-per-visit contractors, never staff. Members can train: self-paced modules, a quiz each with up to 3 tries, the 10-case ring
  test, a shadowed first visit; city by city (B7b builds the modules).
- **Starter kit included** (decal and menu marks as files); **print upgrade paid** (we redesign, print and deliver, approved before print; price after a
  printer quote). Recipes, sourcing and chef placement are separate services. The distributor pitch (Cheney Brothers, Sysco) is its own campaign.
- **Gate**: no paid application before A2 (who owns the program and the Stripe account), A4 and B6 (the attorney-reviewed agreement) and A7 (insurance).
- **The Guide gives the answers** (Sean, 2026-11-06: "we want to give them the answers... before they even decide to pay the 250, they can put those
  things into action... if all a restaurant does is takes this free guide and upgrades what they do in their kitchen and never takes the 250, I say this is
  successful"; canon v9 `guide_gives_answers_v9`). The free Pre-Vegan Restaurant Guide spells out exactly how to pass every gate (the protected cooking path,
  sourcing proof, labels, staff answers, what the Verifier checks), so a kitchen can put it in place without paying. A restaurant that only uses the Guide counts
  as a success: a traveler who will not go to a Vegan restaurant can trust one dish without asking whether the cheese is dairy or the pho has fish sauce. The $250
  buys our independent check and the public mark, never the knowledge. Measure Guide adoption on its own (readiness answers moving to ready), not only paid
  certifications.
- **Drafts rewritten 2026-11-06** on `claude/blissful-fermi-qmyiwt`: B6 (fees, term, change and deception clauses, tasting night, Schedule G), B7 (contractor,
  plain-words Form A, the Supermarket Guide scanner as a storeroom check, courtesy checks and secret shoppers, the member training path), C2 (a $250 invitation
  pointing to the free Guide), and the test menu (v2: starters and mains, 2 of 8 marked; `docs/certification/b5-art-sheet.png` redrawn). An SVG shown as an
  `<img>` cannot load the seal files it references, so the art sheet is rendered with them inlined as data URIs.

## Pre-Vegan Certification: gate how-tos and Guide adoption (Sean approved 2026-11-06, playbook `vegans-explore-initiative-business-certification`)

Sean approved `docs/proposals/pre-vegan-guide-gate-howtos.md` and the three defaults: **$150** for a re-review or re-check (B6 brackets removed), the
restaurant provides the tasting-night portions (about 10 to 15 guests, one tasting portion each), and the 2-year bar removes the whole listing (status
Removed, never deleted; only for concealment or misleading diners). On branch `claude/dazzling-faraday-k6y4dw`, not on `main`; the Guide stays unpublished.
- **Gate pages** (`GATES` in `guide-scripts/pre-vegan-restaurant-guide.js`, public, not `content_html`, which is empty for this Guide): The rule, What to do
  (numbered), Passes / Fails for G3, the seven staff questions with answers for G5 (drafts: they must match Form B's critical questions before launch), How to
  prove it, What the Verifier checks, Common ways kitchens fail, and Doing it without us on the gates list. Members get **Mark done** on each step (a
  `ve-cookbook` save, kind `fix`, key `<gate id>-<n>`; `pre-vegan-restaurant-guide` added to `GUIDES`, v13 from 990950d, sha256 matched). Ticks never change the score.
- **Adoption** (migration `20261106_preveg_guide_adoption.sql`, applied through the one-time `ve-once-preveg-adoption`, now the 410 stub): `ve_preveg_readiness_snaps`
  (RLS on, no policies): one row when the assessment is first finished (`is_first`, never overwritten), then at most one a member a day as answers change (triggers on
  `ve_survey_answers` and `ve_survey_completions`, which never block an answer). `ve_preveg_adoption(from, to)`: started, came back, moved up, cleared a blocker, reached
  ready, **ready without applying** (the headline), applied, median days to ready, gates improved, ticks by gate. **Depot > Pre-Vegan Certification > Guide adoption**
  (`#adoption/30|90|all`, `ve-certification` `adoption`, v4 from 990950d, sha256 matched): counts only, never a restaurant's score. Proven in a rolled-back transaction
  (no snapshot before finishing, the first kept with its blocker, same-day changes folded into one row, ticks counted); the card checked at 1440 and 390 px against
  sample answers. `ve-certification`'s admin-token route answers 401 (its `LESARUSS_ADMIN_TOKEN` env is not set; it was so before this change), so test it signed in.
