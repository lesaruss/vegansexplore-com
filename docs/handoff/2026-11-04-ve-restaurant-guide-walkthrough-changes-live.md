# ve-restaurant-guide: Sean's walkthrough changes built and live, Liz's scripts approved but not recorded

Date: 2026-11-04. Playbook: `ve-restaurant-guide`. Also: `ve-audio-accessibility` (standard locked). Follows
`2026-11-04-ve-restaurant-guide-merged-link-tested.md`.

## Live on main (589c47bd, `guide-scripts/vegan-restaurant-guide.js`)
Sean walked the Guide and asked for changes; all merged ("merge it") and checked live (the live script carries "Top challenges").
- **Invitation only.** No personal link: the Your business tab shows "This Guide is by invitation" and Ask for an invitation (mailto). A super admin keeps the search (`isAdmin`).
- **The check starts on page load** on a personal link (`startMine`, `ve-restaurant-audit` `free` for the code's listing); Your business shows "Running your check" then the result with "Checked on <date>". Checked in a browser with mocked answers.
- **Top challenges** (was The fixes; address still `#/fixes`): a top 10 general checklist, not tied to their business. Members tick "This applies to me" (`pollBtn`, kind `fix` through `ve-cookbook` `gvote`: tick or untick only, one per member, no daily votes), ranked by count. "Fix N of M" is now "No. N of M". Every user-facing "fixes" in Overview, What to expect, My list and search was renamed. No migration (the `fix` vote kind already existed).
- **Claim your page** on a personal link embeds their own page (`viewListing(slug, true)`). **Your dashboard** is a new tab (`viewDashboard`): their listing's `?tab=brand` framed, with Claim this page and See a sample dashboard. **Try the demo** is a seven-step how-to; each Show me opens Green Leaf Kitchen full screen with Close (`openDemo`). Kept (Sean deferred): their own dashboard is the locked preview until they claim.
- **Overview** opens with the why (welcome, three things, then how to start).

## Liz
`docs/proposals/liz-audio-scripts.md` holds the full script, one line per tab, approved by Sean ("I approve everything... other than what I said", then his edits applied). **Nothing is recorded** (no el-media in these sessions; no voice picked without Sean). To record in her roster-profile voice (`IUMUPi350HfIhyzUBJB3`, Vegan as Veegan, stt check, `-v1`): Overview visitor (1), Your business (2), What to expect (3), Overview member (5), Top challenges (6), Your dashboard (7b), Claim your page (8), Try the demo (9). Already recorded and unchanged: Get in (4), Pulse (7), Promotions (10), My list (11), What's next (12). The on-screen `say` lines for Overview, Top challenges and Your dashboard match the script; Your business, What to expect, Claim and Demo `say` text still differ and move with their recordings.
**Standard locked** (CLAUDE.md, `ve-audio-accessibility`): Liz speaks on every page, scripts first, Sean approves, then recorded. No browser voice, no Listen button.

## Not done / not checked
- Top challenges and Your dashboard and the demo pop-out as a signed-in member in a browser (only the visitor flows were checked).
- Social stats on the dashboard are not built; the copy does not promise them.
- The server does not enforce the lock: `ve-restaurant-audit` `free` still takes any listing (the outreach `/check/<slug>` links and the pitch page use it).
- The auto-run counts as the "ran the free check" sign on the pitch list and spends a little Google quota.
- The `ve-outreach` change and the `20261104` playbooks migration that rode in with the earlier merge: deploy and apply not checked.
- Nothing sent, no city on. King Mustafa (water and hydration) said yes; Sean will ask for something to be prepared.

## Next (Logan)
1. A session with el-media: record the eight lines above, check with stt, add to `AUDIO`, match the screen text.
2. Confirm `ve-outreach` is deployed from main and the migration applied.
3. Look at the live front door and Top challenges as a member at 1440 and 390 px.
