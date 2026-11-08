# ve-community-directory: logo hunter, 212 logos added (2026-11-07 to 08)

Branch `claude/charming-volta-033by5` (not merged to `main`; the edge function is already live).

## What exists
- Edge function `ve-logo-hunt` (live, source sha256 63940aa8...). Actions: `start` (queue a run, up to 300 listings, works
  three groups of five at a time), `batch`, `status`, `export` (report.json in `vegan-media/media/logo-hunt/<run>/`),
  `stage` (signed upload links, `ext: 'zip'` for a zip), `apply` (one squared JPEG), `apply_zip` (a zip of `<listing_id>.jpg`).
  Ops only: anon key in Authorization plus `x-ops-token` (LESARUSS_ADMIN_TOKEN), called from SQL with pg_net.
- Table `ve_logo_hunts` (run_id, listing_id, status queued|claimed|working|done|failed, candidates, pick, verdict auto|review|none,
  why, cost_usd = Apify, claude_usd, applied_at, applied_url). Migrations `20261107_ve_logo_hunts*.sql`, `20261107_pause_logo_sweep.sql`.
- Squaring happens in the session (script in the 2026-11-07 transcript: trim the plain border, logo at 86% of an 800 px square,
  background white or the logo's own edge color; white logos on a dark square). Then `stage` zip, curl PUT, `apply_zip`.
- Facebook name search is built but off (`fb_search: true` turns it on); it mostly returned the wrong pages.
- The old logo sweep (cron `ve-logo-sweep`) is paused.

## Results
- Sample of 30: 10 saved. Run `batch-1107` (250 listings, 100% Vegan first): 111 auto (108 saved, 3 held), 97 review
  (80 saved after Logan checked each by eye, 6 rejected, 11 doubtful), 42 none. Sean approved all 14 doubtful/held,
  La Charrita shrunk on white. 212 logos saved in all; 6 wrong picks left on the letter.
- Cost: run batch-1107 Apify $5.48, Claude $3.80 (about 2 and 1.3 cents a listing).

## Money (Sean's to know)
- Apify Starter: hard $29 a month cap, cycle Nov 7 to Dec 6; about $11 used.
- Anthropic API account: $0 purchased, $43.73 promotional credit left (expires 2026-11-17), auto-reload off. When it runs out
  every Claude feature on the site stops. Sean adds credit Friday 2026-11-13. No admin key, so the session cannot see it.

## Next
1. Friday, after Sean adds credit: run the remaining ~447 listings with no logo (same query as batch-1107 minus listings in
   any `ve_logo_hunts` run), check every auto pick by eye, review picks too, send Sean only the doubtful ones.
2. Merge the branch to `main` when Sean says so.
3. Open from earlier: 44 Ready to list rows for Sean; Pacific Point Preserve (a SeaWorld exhibit, likely Remove) and
   Humane Association of Ga (Google shows Atlanta Humane Society) for Sean; the held-listings automated check (proposed, not built).
