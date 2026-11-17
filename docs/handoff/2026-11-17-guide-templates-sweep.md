# Handoff: Guide templates sweep (2026-11-17)

Playbook `ve-holiday-guide`. Canon `canon-ve-guide-templates` (LOCKED by Sean 2026-11-17, always loaded).

## What Sean decided
- Four-option design panel (2026-11-16): D, Search first, won 4 of 5. Then Sean: "Do we have 2 templates?... audit the guides... I like the
  search template, but I would also like to see it with those adjustments."
- Phones: "I want the buttons and the pills on the right side, almost looking exactly like how it looks on desktop... the text in the middle
  of the tile [gives]." Done in the mocks and in `/public/ve-kit.css` `.k-row`.
- LOCK: "Yes, I want to lock it in... they all need to be uniformed, or we'll never be able to keep track of them at the rate that we're
  creating them." One shared frame, two templates: Finder (`/mocks/guide-templates/finder/`) and Handbook
  (`/mocks/guide-templates/handbook/`, `?v=progress` for the business Guides). `canon-guide-mobile-card` superseded.
- Each batch reviewed and approved by Sean on his phone ("the learning Guides look good, keep going", "they look good, keep going with the
  Welcome Guide", "Looks good.", "looks good").
- Parked: "take another pass at the nonprofit guide... borrow from the activist guide... we don't have to do that right this second."

## Live (10 of 17 Guides on the Handbook template, all verified live at 1440 and 390)
| Batch | Guides | Commit |
|---|---|---|
| 1 | Nutrition, Food Photographer, Creator, Nonprofit | 5fb81633 |
| 2 | Vegan Events, Vegan Activism | 1f04ae67, 465599d9 |
| 3 | Welcome Guide (`/passport`, referral landing) | c5744314 |
| 4 | Pre-Vegan Business, Pre-Vegan Restaurant, Vegan Restaurant (progress) | 42387f7c |

How it works: a moved page has `<body class="ve-gf gf-hb">`, links `/public/ve-kit.css` and `/public/ve-guide-frame.css`, a `gf-parts` JSON,
and loads `/public/ve-guide-frame.js` after its own script. The Guides' own scripts are (almost) unchanged; the frame script builds the
pink Guide bar, the Contents panel (from `#dgMenuSelect`), the Guide row (once), Part N of M, one orange action, Next part. Opt-in
settings: `_kids` in gf-parts (grouped Contents), `data-gf-head-go`, `data-gf-video` (Welcome), `data-gf-progress` (business Guides).
The Holiday Guide (body `ve-gf` without `gf-hb`) is untouched and pixel-identical.

## Proof tools
- `scripts/guide-audit.js snapshot <dir> [--only=<guide>] [--local=<repo>] [--shots=<dir>]` and `compare <before> <after>` (exit 1 if
  anything is missing).
- Before inventory: `docs/audits/guide-inventory/2026-11-17-before/` (17 Guides, 172 parts, 436 views). After records per batch in the
  same folder.

## Not finished
- **Finder batch (Airport, Stadium & Arena, Theme Park, Supermarket, Vegan Dairy)**: work in progress on branch
  `claude/finder-guides-wip` (a693d1c1, UNVERIFIED, not on main): Finder mode added to the shared frame, the three venue Guides wired,
  Supermarket's Stores view was being rewritten as the Finder. Finish it, prove it with the audit compare (and confirm the ten moved Guides
  and Holiday unchanged), then merge to main.
- Supermarket bugs from the baseline: `ve-guide-unlock` 404 on every view; `.sg-pbox` scrolls inside itself.
- Holiday Guide: moves last, after ThanksLiving (Nov 26). Baseline issues: no orange action on 40 of 44 phone views; four recipe pages
  scroll sideways at 390.
- Taste: retired publicly (`/guides/taste` redirects to `/passport`); move last or retire.
- Untested everywhere: a real signed-in member session.
- Leftover branch `claude/serene-allen-wijgxo-wip-batch2` (already merged content; delete when possible).
- Still pending from 2026-11-16: send-later check Wed Nov 18 8:30 AM ET (raise holiday-launch-explore to 195/day if clean); NYE menu
  outreach waits on Sean locking the page.
