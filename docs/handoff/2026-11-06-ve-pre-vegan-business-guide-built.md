# ve-pre-vegan-business-guide: the Guide built and proven (2026-11-06)

Playbook `ve-pre-vegan-business-guide`. Sean approved the tabs, survey and Maya's lines on 2026-11-06 ("Approved, go with your defaults
and build it"). Maya narrates (not Pascal). Branch `claude/magical-keller-s3v6ym`, commit f47a7a7. **Not on `main`.**

## Built
- `ve_guides` row `pre-vegan-business-guide`: published, door, survey_slug, $11 or 1,100 points. It stays published because
  `ve-guide-unlock` answers `guide_not_found` for an unpublished row; "not launched" means noindex, no catalog card, not in the sitemap.
- The business survey: 13 questions, 5 required at 12 points, 8 optional at 5 (100 in all). Migration `20261106_pre_vegan_business_guide.sql`.
- Members content (`content_html`, `pb-data`): What to add for gyms, juice bars, cafes and caterers. Never in the repo.
- `guides/pre-vegan-business-guide.html` and `guide-scripts/pre-vegan-business-guide.js`, copied from the Vegan Restaurant Guide.
  Visitors see Overview, Why add Vegan, What to add (Coffee shop free), How to say it, Get in. Members also get Sourcing, Buy or make,
  Get found, Claim your page, What's next and My list. Maya's lines show as text and Play is hidden until a line is recorded
  (`AUDIO_V` / `AUDIO_M`, files go in `vegan-media/media/maya/pre-vegan-business-guide/`).
- `ve-cookbook` v12 knows the Guide, so saves work (kind `fix`, key `add-<id>`).

## Proven live
- **Survey door on a pending test account (Cookbook Tester 3):**
  - A bad value was refused.
  - Each answer paid 12 points.
  - The fifth required answer admitted the account as a Founding Member with `entry_via` survey.
  - After that, the Guide opened (`via` door) and `ve-sourcing` listed 216 suppliers.
  - The account was then put back exactly as it was. Its class had to be `member` for the test, since `ve_survey_answer` refuses other classes.
- **`ve-sourcing`:** 200 for an active member, `guide_required` for a pending account, `not_authenticated` signed out.
- **Screenshots:** beside the Restaurant Guide at 1440 and 390 px, served from the repo. Same family, no sideways scroll, no script errors.
  The member views (Gym, Sourcing) also loaded.
- **`ve-once-pvbg`:** back to the 410 stub.

## Waiting on Sean
1. Merge the branch to `main`.
2. Approve recording Maya's lines (her voice is `sM8RysETdBj1LIqLd9tl`).
3. Decide on the banner: Maya in the Vegans Explore Tee at a coffee shop counter (Higgsfield credits).
4. Then Logan launches: noindex off, the sitemap, a catalog card.
