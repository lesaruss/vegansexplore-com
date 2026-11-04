# ve-restaurant-guide: Liz speaks on every tab, and the free check is locked to the invitation (2026-11-04)

Playbooks: `ve-restaurant-guide` (the Guide, the lock) and `ve-audio-accessibility` (Liz speaks on every page). Logan, with Sean's word on each merge.

## Done and live (main at `09e15db`, Vercel deployed, function version 20)

1. **Liz's recordings, all 11 tabs.** Recorded with el-media `tts` called from the database (pg_net, so the admin token never leaves it), in her
   roster-profile voice `IUMUPi350HfIhyzUBJB3` (`eleven_multilingual_v2`, approved by Sean, Vegan spoken as "Veegan"), each checked word for word
   with el-media `stt` (differences only punctuation, "guide" lowercase, "stop anytime", "Greenleaf"). Files in
   `vegan-media/media/liz/restaurant-guide/`:
   - visitor: `door-overview-v2`, `door-audit-v2`, `door-expect-v1`, `door-join-v1` (join was already there)
   - member: `door-overview-member-v1`, `door-fixes-v1`, `door-dashboard-v1`, `door-featured-v2`, `door-demo-v2`, `door-pulse-v1`,
     `door-promos-v1`, `door-mylist-v1`, `door-next-v1` (next was already there)
   A changed line is a new version, so lines that replace an older clip are `-v2` and the old `-v1` files stay. The Guide script
   (`guide-scripts/vegan-restaurant-guide.js`) has `AUDIO_V` (visitor) and `AUDIO_M` (member) maps and `lizAudio(k)` picks by `member()`; every tab's
   `say` text now equals its recording. Checked at 1440 and 390 px against the branch served locally with mocked answers: each tab resolves to its
   file, no script errors, nothing plays on its own.
2. **The invitation lock is on the server.** `ve-restaurant-audit` `free` (version 20, from `09e15db`, source sha256 `87d7a940...` matched the repo)
   runs only for ops, a super admin, or a request carrying the business's own `bo-xxxxxxx` code plus that same business's slug. A name with no
   listing, another business's slug, a bad code or any `fresh` re-run from a non-team caller is 403 `invitation_only`. The Guide sends its code
   (`PERSONAL.code`). Proven live (cached cases, no Google spend): no code, a name only, another slug's code, a bad code and a `fresh` run all 403;
   the business's own code 200; ops 200.
3. **Proof cleanup.** The proof's own-code call wrote a `ve_free_check_events` "ran" sign for Garden Butcher (it would have read as a BrandDesk
   pitch-list sign). Removed with a one-time function (`ve-once-free-check-sign`, now the 410 stub; the connector held the delete). None left.

## Found while doing it (worth knowing)

- **el-media is reachable without a special tool**: call it from the database with `net.http_post` and the token selected from `lesaruss_secrets`
  (the repo's own pattern; HQ's `supabase/functions/el-media/index.ts` takes `tts`, `stt`, `clip`, `upload_url`). A session with only Higgsfield's audio
  tool should not substitute it (different engine, credits, no profile voice, no stt, no storage path). A multi-statement `execute_sql` shows only the
  last statement's rows: run reads one at a time.
- The free path for a non-team caller writes a `ve_free_check_events` row (a sign) even when the check is reused. Test with a team token or clean up.

## Not done, still open

- A **real signed-in member** run on the deployed Guide (Top challenges tick, Your dashboard, Claim your page, the demo pop-out) and a real `/go/bo-`
  click end to end. The browser checks used mocked answers only.
- `ve-restaurant-audit` `latest` (the public `/check/<slug>` link) stays open to anyone, by design (it shows the free view of an existing check).
- Liz has no recording for a page outside the Restaurant Guide yet (the rest of `ve-audio-accessibility`: the other Guides' silent tabs, then the main
  pages). Scripts first, Sean reads them, then record.
- Nothing has been sent to a business and no city is on. Sean has not said go on the engine change for HQ's People room.

## Next (Logan)

`ve-audio-accessibility`: draft Liz's scripts for the next Guide's silent tabs in `docs/proposals/liz-audio-scripts.md` for Sean to read (his order: the
Guides, then the main pages). `ve-restaurant-guide`: when Sean has a member session or an ops token with `as_member`, click through the member tabs.
