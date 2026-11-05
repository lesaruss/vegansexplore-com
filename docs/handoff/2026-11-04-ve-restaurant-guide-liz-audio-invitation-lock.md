# ve-restaurant-guide: Liz speaks on every tab, and the free check is locked to the invitation (2026-11-04, updated 2026-11-05)

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

## Added 2026-11-05 (main at `78935f0`, live)

1. **The first-page Play button was off screen (a regression from the recordings).** The full welcome made the bubble about 370 px tall, so in the desktop
   fit layout "Start the tour" landed behind the footer at 1440x900 and off screen at 1366x768 (Sean's screenshot showed the bubble cut mid-sentence). Fixed in
   `guides/vegan-restaurant-guide.html` (the `html.dg-fit` rules: Play comes right under Liz's name, a long line scrolls in its own box) and in the Guide script:
   a tab can carry `show`, a short on-screen line used while its recording exists (Overview, What to expect, Try the demo). **Sean's rule, 2026-11-05: short text in the
   box, the audio does the work.** This supersedes "a line's text must match its recording" for those three tabs only; the recordings are unchanged and every other tab still shows its full line.
2. **Signed-in click-through, passed on the live Guide** (Logan Russell test member, `contact+logan@lesaruss.com`, active, not an admin, with Garden Butcher's code opened
   at its destination, no click logged): Play on Overview started `door-overview-member-v1.mp3` (14.7 s); all ten tabs load with Play on screen; Top challenges tick
   registered (it is a real vote in `ve_guide_votes`; unticked, 0 left); Claim your page frames the real listing; Your dashboard names the business; the demo's first of seven steps opens
   full screen on `/business/sample` and closes. No script errors. Not checked: audio on every member tab, the other six demo steps, phone width.
3. **`/go/bo-` tested with a [TEST] contact** (a `bo-test001` contact and link on Love Life Cafe, then deleted): 302 to `/guides/vegan-restaurant-guide?b=<code>`, the Guide opens on the business,
   Liz plays, the free check reuses the existing check. A headless browser is logged as a bot and does not count; a desktop browser counts (1 real, 1 bot). A click turns a contact Interested only
   when it was emailed first (`in_sequence`, a `sent` event before the click): `ve_outreach_sync` ignores a `not_sent` contact, by design. With a faked sent event it turned Interested, stopped
   follow-ups and routed to Sean (South Florida has no Community Manager). Every test row removed, Garden Butcher's real link still 0 clicks.
4. **How the session was made.** A one-time function `ve-once-rg-session` minted a one-hour token for the test member with the same signing as `ve-switch-account` (the HMAC from the service key),
   then was redeployed as the 410 stub (the old key answers 401). The token file was deleted. For a browser run of the live site, set `ve_token` and `ve_member` in `localStorage`.
5. **Drafted, not recorded:** Liz's scripts for the Vegan Events Guide (`docs/proposals/liz-audio-scripts.md`, Guide 2): 15 visitor and 15 member lines, four decisions for Sean (whose voice, money on the
   first visit, a gear affiliate line, the order of the Guides). Nothing is recorded or wired.

## Not done, still open

- Nothing on the Restaurant Guide blocks the emails. What is left is Sean's: approve the emails, turn a city on, read the pulled email addresses by eye. Nothing has been sent and no city is on.
- Not exercised: a real send followed by a click (the sender path), audio on each member tab, the other six demo steps, a phone-width pass.
- `ve-restaurant-audit` `latest` (the public `/check/<slug>` link) stays open to anyone, by design.
- The other Guides' silent tabs and the main pages (`ve-audio-accessibility`): the Events Guide scripts wait for Sean to read them.
- Sean has not said go on the engine change for HQ's People room.

## Next (Logan)

(2026-11-05) The Events Guide scripts are with Sean. When he approves, record two lines at a time with el-media from the database, check each with `stt`, wire as `AUDIO_V` and `AUDIO_M`. Older text:

`ve-audio-accessibility`: draft Liz's scripts for the next Guide's silent tabs in `docs/proposals/liz-audio-scripts.md` for Sean to read (his order: the
Guides, then the main pages). `ve-restaurant-guide`: when Sean has a member session or an ops token with `as_member`, click through the member tabs.
