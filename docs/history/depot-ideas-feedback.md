# History: depot-ideas-feedback

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Feedback button on every page (Sean, 2026-11-03)

"A feedback button... prominent across the site, the same way we have the share button... it loads the page you are on as the default, you can still
choose another... select different options... so we know immediately if anything is wrong" (the weeks into January). `/public/ve-feedback.js`
(`VEFeedback.open`, `button`; any element with `data-ve-feedback` opens it), loaded by `nav.js` and the dashboard's top bar beside Share (icon only
under 1060 px; on phones a small fixed tab bottom right). The window: **What is it about?** (this page, the main pages, or Another page with a
line to say which), the kind (Something is broken, Wrong or out of date, Confusing, Something is missing, An idea, Working well, Something else),
what happened, an optional email for a reply. `ve-feedback` (public, verify_jwt off, 5 an hour and 15 a day per visitor) saves a `ve_feedback`
row (migration `20261103_ve_feedback.sql`, RLS on, `status` new | working | fixed | set_aside | spam) with the page, the viewport and the browser,
and emails contact@lesaruss.com at once ("[Feedback] kind: page", reply-to their email). **Depot > Feedback** (`/admin/depot/feedback`, Site in the Go to menu; built 2026-11-03): status chips New / Working / Fixed / Set aside / Spam with counts, a kind and a page
filter and a search over what they said (`#list/<status>/<kind>/<page>`), and one item per view (`#item/<id>`: the message, the page it was about, who, when, screen
and browser, a note, and the status buttons). `ve-feedback` `admin_list`, `admin_get`, `admin_set` (super admin token). A New item is also an Inbox row
(`feedback`, migration `20261103_feedback_inbox.sql`) until its status moves. Logan still reads it every day.

**Search queue, working it** (Sean, 2026-11-03): Logan works the queue daily with discretion (answer, write it up as a Guide piece, add a listing
or set aside); the queue feeds what we write next (articles, new sections, new Directory listings). Spam: a question sent through the box needs
an email; abusers are quarantined. **Spam control built 2026-11-03** (migration `20261103_search_queue_spam_control.sql`; `ve-search` v5): `ve_search_ask` takes `p_explicit` (an explicit ask without an email is refused, `email_needed`), files a question as `quarantined` when it is junk (`ve_search_q_junk`: a link or address, mostly non-letters, one character repeated, no vowel) or comes with neither a visitor id nor an email (a script), and refuses with `rate_limited` (429 from `ve-search`) a visitor or email past 15 new questions an hour or 40 a day (Logan's defaults, Sean's to change). A quarantined question never shows in the queue's open list. The Liz card's email stays optional (the dead end is logged anonymously; the email only says where to write back). Proven live: a junk ask came back quarantined, a normal one open, both removed.

## Talk to Liz: the page's Guide for super admins (Sean, 2026-11-05, playbook `ve-page-guide`)

"When I do that as a super admin, that is the equivalent of me speaking to you here." For a super admin signed in as themselves (not View As), the Feedback
button opens **Talk to Liz** (`public/ve-page-guide.js`, `VEPageGuide.open`; `ve-feedback.js` loads it, `{form: true}` forces the plain form, and the chat has
**Send as feedback instead**). Say what is wrong on a Directory listing; Liz (Claude Opus 5.5, edge function `ve-page-guide`, verify_jwt off, super admin token)
reads the listing, its outreach contacts, recent team notes and the page's text, answers, asks when unsure, and lists exact changes (what it is, what it becomes).
Tick and **Apply** (`apply` re-checks each against the allowed list): listing name, website, Instagram, Facebook, TikTok, phone, email, street, ZIP, about, menu link,
hours (through `ve-outreach` `listing_fix` with Sean's own token, each a `ve_listing_edits` row; name and email written directly, logged `where: page_guide`), a team note
(`details.admin_notes`), and the outreach contact: name (sets `ve_outreach_contacts.name_confirmed`, so the greeting uses it), email, or do not email (`held`). Every turn
and apply is a `ve_page_guide_log` row (RLS on, no policies). Migration `20261105_page_guide.sql`. Everyone else's Feedback form now starts with **A change to this page**
(kind `suggestion`), emailed at once and in the Inbox; **Depot > Feedback** has a daily digest switch (`ve_site_settings` `feedback.digest`, off; cron
`ve-feedback-digest` 13:23 UTC). Outreach greetings use the first name only when the email address contains it or the name is confirmed, else "Hi there,"; Day 0 no longer
carries the check-up line; business outreach sends as email brand `ve-business-outreach` (unsubscribe on vegansexplore.com; people lists stay `lesaruss`). Proven live
2026-11-05 as Sean (proposals only, nothing applied). **Step 2, live on `main` 2026-11-05 (merge 8885bd1, function from d89d768, source sha256 64f851e5 matched)**: the same chat speaks as the page's own Guide (`guide` liz, maya, river, nori, dani, theo, kai, pascal; `GUIDES` in the function, `NAMES` and `GT` in `ve-page-guide.js`). For a super admin `ve-feedback.js` loads `ve-page-guide.js`, which puts **Talk to <Guide>** on the Guide rail (`#dgRail` `data-guide`), the Partner Dashboard tour's narrator (`.vgt-narr`) and each Resources card (`.gt-card`), watching for tabs that draw later; the Feedback button opens the rail's Guide, else the Resources Guide, else Liz. On a page that is not a listing the Guide files a **Note for Logan** (target `logan`: a `ve_feedback` row, kind suggestion, named "Sean (via <Guide>)") and listing edits are refused (`not_a_listing`). Proven live as Sean through the one-time `ve-once-page-guide-step2` (now 410): River filed a note from the Events Guide, a phone edit there refused, Maya answered on The Rabbit Hole as herself; the test row removed. Confirmed live signed in as Sean (a one-hour session from the one-time `ve-once-session-proof`, now 410) at 1440 and 390 px: Talk to River on the Events Guide, Talk to Maya and Talk to Liz on The Rabbit Hole's Resources tab, Talk to Liz on the Restaurant Guide, each opening its chat, no script errors, no sideways scroll; the deployed `ve-page-guide.js` and `ve-feedback.js` match the repo byte for byte. **Step 3, members and visitors, built 2026-11-06** (Sean: "Go with your defaults, build step 3"; `ve-auth` v74 from 9362197, source sha256 acc450e3 matched; migration `20261106_guide_kb_questions_page_url.sql`). **Talk to <Guide>** is on the Guide panels for everyone (`ve-feedback.js` loads `ve-page-guide.js` on any page with `#dgRail`, `.vgt-narr` or `.gt-card`, watching for tabs that draw later; the Feedback button stays the plain form for anyone but a super admin). `open()` picks the mode: a super admin gets the step 2 chat (`openAdmin`); a **member** (`VEAuth.isLoggedIn`, paid or survey) gets `openMember`: saved answers first (`ve-auth` `guide_ask`, free, with related questions as chips), then on the newest question **Ask <Guide> directly · 4 points** (`guide_chat_send`, the monthly allowance, a conversation id kept for the visit, points left shown, a failed reply costs nothing) or **Ask a person, free** (`guide_ask_person`); no changes, no Apply. A **visitor or unpaid account** gets `openVisitor`: Suggest a change in the Guide's voice (one box, an optional email) sent to `ve-feedback` as kind suggestion, named "A visitor (via <Guide>)", with a note that members can ask the Guide and a link to join. `guide_ask`, `guide_chat_send` and `guide_ask_person` take an optional `page_url` (kept in `guide_kb_questions.page_url`, so the gaps list says where people ask); `guide_chat_send` also takes `page_label` and `page_text` (an excerpt of the page, 1,500 characters), which only the reply engine sees as a line before the question, so River answers from the page (without it he said the Events Guide had no rain plan). The page link drops a member's `?ref=`. Guide replies render light markdown (bold, italics, headings, bullets). Proven 2026-11-06 at 1440 and 390 px on the Events Guide (River) and The Rabbit Hole's Resources tab (Maya), as the Logan test member (a token from the one-time `ve-once-member-proof`, now 410; a saved answer, a no-match, a 4-point reply in context, 1,117 points left) and signed out (the suggestion window, its POST answered locally so nothing reached the team); no script errors, no sideways scroll; the test questions and draft answers removed. Not proven live: Ask a person (it emails the team; unchanged code), the window on a phone signed in with a real member.

## Ideas: Sean's idea inbox (Sean, 2026-11-06, playbook `ve-idea-intake`)

"An intake somewhere that I can go to drop ideas... voice dictation, upload assets... links... give you context... you confirm what I'm asking,
and then I approve, and then you start working on it... provide me with the link to see what you've done." **Depot > Ideas** (`/admin/depot/ideas`,
Site in the Go to menu; super admins), copied from Depot > Feedback: **New idea** (`#new`: the idea typed or spoken with the site's mic, screenshots,
photos and files (tap, drop or paste; pictures shrunk to 1600 px JPEG in the browser, 25 MB each, up to 12, into the private bucket `idea-files`),
links one a line, the page it is about, `?from=<url>` fills it), the list (`#list/open|new|read|approved|building|done|set_aside|all`, search) and
one idea (`#idea/<id>`). Sending it has **Logan read it** (edge function `ve-ideas`, Claude Opus 5.5 on the API key, about 7 to 30 seconds, cents
a read; it sees the pictures and PDFs): what he thinks is asked, tweak / build / big, the playbook it belongs to (from `ve_playbook_index`, or a new
slug), how he would do it and up to three questions. **Correct me** adds Sean's words to the thread and reads it again; **Approve** sets it approved;
Set aside. Table `ve_ideas` (migration `20261106_ve_ideas.sql`, RLS on, no policies): body, links, files, page_url, status new | read | approved |
building | done | set_aside, read, thread, playbook_slug, session_url, result_url, note. `ve-ideas` actions `list`, `get`, `upload_start`, `create`,
`read`, `approve`, `set`. **Step 3 is not wired**: approving does not start a build yet (requested 2026-11-06, the plan is in `docs/handoff/2026-11-06-ve-idea-intake.md`: a scheduled task picks up approved ideas); Logan picks approved ideas up in his next session and sets
`session_url`, `result_url` and done (`set`). Proven live 2026-11-06 as Sean (upload, create and read with a screenshot in 7 s, a correction read
again, approve, a second approve refused, a bad status and a bad file type refused, the page at 1440 and 390 px); the test idea is Set aside. On `main` since 12920c8.

## Blueprint > Ideas, and one Blueprint (Sean, 2026-11-06, playbook `ve-feedback`)

"Every idea goes through the Blueprint, and the Blueprint sends it to the right playbook or decides it needs its own." **BrandDesk > a brand >
Blueprint > Ideas** (HQ `components/branddesk/IdeasView.tsx`, `app/api/branddesk/blueprint/ideas/route.ts`, `lib/blueprintIdeas.ts` with tests;
tables `blueprint_ideas` and `blueprint_idea_events`, HQ migration `082_blueprint_ideas.sql`, RLS on, no policies; on HQ main b63cdb3, seen live
2026-11-06 as the QA account at 1440 and 390 px): chips New, Sent, Own playbook, Parked, Declined, All, search, **Add an idea** (typed or spoken);
one idea per view (`?b=ideas&pb=<id>`) with Logan's suggested home (`suggested_playbook`, `suggest_reason`, written from his session) and, for
Sean's owner accounts only, **Send to a playbook** (a decision record plus a pending item under "From the Blueprint ideas" on its page, edited
without a model; a page without the template markup gets the record only), **Make it its own playbook** (a page from the active template, an
index row, Parked or Building), **Park it** (optional date), **Decline** (reason required), Open it again. Nothing is deleted. Not proven: the
sort buttons (the QA account is not an owner). `ve-feedback` is the tweak queue again, titled Feedback; its ideas (Vegan House, the talent shop,
the bounty rules) moved to Ideas as Parked. On 2026-11-06 the stale pass closed 122 items on Launch to January 1 and Chapters and Community
Managers (Completed tab, "Closed in the stale pass, Nov 6, 2026", each labelled Done, Off or past, Replaced) and moved 27 more into 16 ideas; the
pages before each change are in `zz_playbook_close_20261106` (drop it once Sean is happy). **Next (Sean, same morning): one Blueprint.** There
are three idea places (this tab, Depot > Ideas with `ve_ideas` and the `idea-files` bucket, and the Blueprint's own build threads); Sean is
merging them in one chat. The Blueprint is finite: build its main parts first, then it becomes the one idea capture, with uploads (screenshots,
documents, voice memos) queued under New for Logan to sort. Handoff `docs/handoff/2026-11-06-ve-feedback-blueprint-ideas.md`.

## The Depot home, and Ideas lives in the Depot (Sean, 2026-11-07, playbook `branddesk-production-wing`)

"We are going to keep the depot, this is where the ideas should live instead of the blueprint, because I feel like it's kind of buried in the
blueprint." **This replaces "Blueprint > Ideas holds every idea" below**: Depot > Ideas (`ve_ideas`) is the one place ideas are dropped, with
Feedback beside it; BrandDesk's Blueprint > Ideas (`blueprint_ideas` in HQ) stays as it is until the two are merged (not done).
**The Depot opens on its home** (`/admin/depot`, `admin/depot/index.html`), not the Library (now `/admin/depot/library`): one tile per section
with what is waiting today (`ve-depot` `home`, `ve_depot_counts()`, migration `20261107_depot_home.sql`), a search that finds any tool by name,
`#s/<section>` for a section's tools and `#trash` for the trash bin. Sections (`SECTIONS` in `public/depot-tabs.js`): Directory (with Secret
Shopper), Logos (Directory review > Logos for now), Content (with the Library), Bounties (Bounties, Check-ins, Submissions, Watchlist), Guides
(Preview journeys, Onboarding, Dashboard checklist), Ideas (Ideas, Feedback), Demos, and **Moving to BrandDesk** (People, Outreach, Business
outreach, Ambassadors, Founding Members, Nonprofit and Group Partners, Community Managers, Profiles, Invites, Referral claims, Links, Members,
Leads, Role applications, Social, Playbooks, Analytics, Community Insights, Platform health, BrandDesk clients), each tool staying here, working,
until BrandDesk does everything it does. Admin and Site and QA are gone. The Go to menu lists each section once (it showed Content twice when
rows of another group sat between Content rows). **The trash bin** (`TRASH` in `depot-tabs.js`, the same list in `ve-depot`): Challenges,
Passport Challenge and its card and kit, Pulse (old articles), Pulse Cities, Passport Partners, the old Logos page, Tours, Services, Dinner
guests, Import narration and Guest reviews (empty since free accounts ended). Nothing is deleted; a retired page opened by its address says so,
and **Restore** (`ve-depot` `trash_set`, `ve_site_settings` `depot_trash`) puts it back in its section. Mock `/mocks/depot/`; V's tour script
`docs/proposals/depot-tour-script.md` (13 chapters, approved by Sean; recorded 2026-11-07 at `geekfon-media/voice_samples/v/depot/tour-<n>-v1.mp3`, all 13 checked word for word with stt). Not built yet: V's tour and
Ask V on the Depot, Logos as its own tool (category filters, Most viewed), better logo suggestions, the Guides back end and See every page,
People in BrandDesk.
**Analytics into BrandDesk Insights, step 1 (2026-11-07, merged to HQ main 2026-11-07 (ce9fc16), Sean: "merge both branches to main"):** BrandDesk > Vegans Explore >
Insights gained Chapters, Site sections (Directory, Events, Media, Daily Pulse, Guide tabs), Members (Who joined; What they told us = Community Insights),
Costs (the Google ledger) and Health (Platform health), Vegans Explore only (`components/branddesk/InsightsPlatform.tsx`, `lib/vePlatformInsights.ts`:
`ve_report` is `ve-analytics` with the admin token, `ve_members` the ported `ve-insights` tally, `ve_health` `ve_ops_snapshot`; super admins only). The Depot
pages stay until Sean says these work. `ve_ops_snapshot` had been timing out (8.4 s against the API's 8 s; per-job scans of `cron.job_run_details`); one pass now,
0.2 s (migration `20261107_ops_snapshot_cron_one_pass.sql`). Handoff `docs/handoff/2026-11-07-branddesk-production-wing-analytics-into-insights.md`. **Retired 2026-11-07** (Sean: "Retire the three Depot pages to the trash bin"): Depot > Analytics, Community Insights and Platform health are in the trash bin (`TRASH` in `public/depot-tabs.js` and `ve-depot` v5, restorable, nothing deleted); the dashboard's See full insights, Recent Votes and Leaderboard View all, and the super admin's Platform Health tile open BrandDesk Insights in a new tab. The Depot clean-up branch (a40da58: pins, tool pictures, Social, Playbooks and Business outreach trashed) merged to `main` the same day, so main's `ve-depot/index.ts` now equals the live v5. **A to Z check-in, 2026-11-07** (handoff `docs/handoff/2026-11-07-branddesk-production-wing-a-to-z-checkin-wrap.md`): done A to I, K, L, O, P, Q; Sean merges HQ 75b8223 (Where I looked), clicks the Ideas sort buttons (J), approves the lookbook; Logan does N as one idea store (`ve_ideas` in the Depot, Blueprint > Ideas reading it), then M (Send to the Daily Pulse and podcast news, drafts only) and R.
**Where each lives (Sean, 2026-11-07, "I totally agree"; replaces the pass-through plan above):** BrandDesk lives only in HQ (`hq.lesaruss.ai/branddesk`);
Vegans Explore links to it (a button that opens HQ in a new tab, signed in through the LESARUSS connector), because BrandDesk is the step up for the
higher tier, closer to the source. The Depot lives only in Vegans Explore: it is the platform's back office on this site's database; the relationship
tools still move to BrandDesk one at a time. No pass-through, no iframe, no two-door sync. **Depot clean-up (Sean, 2026-11-07: "make sure they don't touch the BrandDesk... old, inferior versions of what we've built"):** the
Depot's copies of what BrandDesk already does are in the trash bin (still working by address, restorable): Social, Playbooks and Business outreach
(BrandDesk > People has Roster, Campaigns, Cities and Send days). A **BrandDesk** section on the Depot home opens those BrandDesk rooms in HQ in a new
tab (`kind: 'hq'` in `TABS`). Nothing in HQ was changed. Still in Moving to BrandDesk because BrandDesk has no version yet: People, Outreach (the
personal message queue, `ve_people_outreach`), the partner and invite consoles, Members, Leads, Role applications, Links, Analytics (Insights lacks the
chapter ranking, Guide tabs and Google costs), Community Insights, Platform health, BrandDesk clients (onboarding, Library, check-ins, rotation).
The podcast stays in BrandDesk; its platform side (content index, Books, the Pulse's episode pages) stays in Depot > Content.
**Depot home extras (2026-11-07):** **My list** (a star on every tool; `ve-depot` `pin_set`, `ve_site_settings` `depot_pins`, per account), Logos back
inside Directory, a thumbnail on every tool (demos: `public/depot/demos/`, the public pages taken signed out; admin tools: live captures in the private
bucket `depot-thumbs`, `tools/<slug>.jpg`, handed to super admins as one-hour links by `ve-depot` `home`; never put admin captures in the repo), each
tool's own waiting count, and the Guide banners on the Guides section. To check before promising automatic sign-in: Vegans Explore
to HQ needs a one-time code exchange (the reverse of `ve-lesaruss-sso`); not built. **Next: the two tours** (Depot, V; BrandDesk, V, on the existing
`lib/branddeskTours.ts` in lesaruss-hq, which has only the People tour so far), each as a video per `canon-ve-guide-tour-standard` v3.

## One idea store, Send to, and the max_tokens rule (2026-11-08, playbook `branddesk-production-wing`, N, M, R; merged to main by Sean)

**N, one idea store** (migration `20261108_one_idea_store.sql`; vegansexplore-com main 1bd9617, lesaruss-hq main 17c2f33). `ve_ideas` holds every idea, Depot >
Ideas and HQ's BrandDesk > Blueprint > Ideas alike; there is no sync. The 30 `blueprint_ideas` rows moved in with their ids (`blueprint_idea_events`, the history,
points at `ve_ideas` now); the old table is kept as `blueprint_ideas_retired_20261108`. The `blueprint_ideas` view over `ve_ideas` was
retired 2026-11-08 once nothing read it (migration `20261108_retire_blueprint_ideas_view.sql`); write to `ve_ideas`, never the old name. New columns: `brand_slug` (default vegans-explore), `title` (filled from the first sentence by `trg_ve_ideas_title`), `source`
(depot, blueprint, feedback, playbook, fieldy) and the Blueprint's sorting fields. **One status list**: new, approved, building, done (the Depot's build path) and
sent, own_playbook, parked, declined (the Blueprint's sorting). No `read` status: a read idea stays new (the Depot shows it as Read back); Set aside is parked.
HQ shows approved, building and done under a **Building** chip. `ve-ideas` v10 reads and writes `ve_ideas` for both (the Depot's read is the Blueprint's read).
Checked signed in (QA login) on the HQ preview at 1440 and 390 px: 31 ideas, chips right, no errors.

**M, Send to, drafts only** (migration `20261108_idea_send_to_drafts.sql`; `ve-ideas` `sends`, `pulse_draft`, `pulse_save`, `pulse_approve`, `pulse_discard`,
`podcast_draft`). An idea's page in Depot > Ideas has **Send it to**. **A chapter's Daily Pulse**: Logan writes a story (title, take) from the idea's words only,
a `ve_pulse_features` row with `status` draft and `idea_id`, for one chapter or every chapter on one Eastern date (default tomorrow); Sean edits it and **Approve
for the Pulse** (live) or **Don't use it** (discarded). `ve_pulse_features_apply` takes only `status = 'live'` (every older row is live). Approving is Sean's
token only (the ops token is refused). **The podcast's news**: a proposed Top stories segment for Kai (`ve_pod_segments.idea_id`) on the next episode still in
planning, after the last news slot; scripted and approved in BrandDesk > Podcast. An episode already Ready (Episode 145 on Nov 8) takes nothing: `no_episode`.
Proven live 2026-11-08 on a [TEST] idea (the draft written, held out of a real Pulse and taken in once live in a rolled-back transaction, the podcast draft placed
on a [TEST] episode), then every test row removed through the one-time `ve-once-idea-test-cleanup` (now 410).

**Ideas live only in Depot > Ideas** (2026-11-08, Logan's default on Sean's 2026-11-07 call; merged to both mains by Sean the same day, VE bd098e1, HQ 4333630). Sorting moved from HQ's
BrandDesk > Blueprint > Ideas into `ve-ideas` (v12, live: `sort_options`, `sort_send`, `sort_own`, `sort_park`, `sort_decline`, `sort_reopen`; a super
admin's token only, never ops) and Depot > Ideas has **Sort it**, **Where I looked** and the idea's **History**. HQ branch `claude/bold-feynman-esaemy`
(dd5e30c) takes the Ideas tab out of BrandDesk (an old `?b=ideas` link shows a pointer) and deletes its route and helpers; this repo's branch of the same
name carries the page. `sort_own` refuses a slug any page, `ve_playbook_index` row or record already uses: the first version checked pages only and, in
its test, overwrote the `branddesk-production-wing` index row (restored from the seed and the handoff; its exact earlier stage and next action are lost).
HQ's old route is deleted (HQ main 4333630).

**Merged and live 2026-11-08** (HQ main d9df825, VE main 0dc086e; checked signed in at 1440 and 390 px). **Then merged by Sean the same day (HQ main 985c570, VE main 868c3e5; not yet seen live signed in)**: **BrandDesk > Clients** (HQ `/branddesk/clients`, `components/branddesk/ClientsRoom.tsx`, `/api/branddesk/clients`, `lib/branddeskClients.ts`; onboarding, Library, check-ins, rotation through ve-branddesk as the signed-in person; billing and Social stay in the Depot) and **Depot > Members** (VE, `admin/depot/members.html`, read only, the Go to menu's Members). Handoff `docs/handoff/2026-11-08-branddesk-production-wing-clients-room-members.md`.

**The Outreach Roster's Who filter** (2026-11-08, playbook `branddesk-production-wing`; Sean's "2": work the queue): BrandDesk > Vegans Explore > Outreach > Roster has a **Who** dropdown: Businesses (the Roster as before) or ten people groups (members, Founding Members, Ambassadors, Community Managers, leads, invited, Nonprofit and Group Partners, role applications, referral claims), each with a count, search and a list; read only, and every person has **Open in the Depot** to the page that still does the work. One function, `ve_people_who(p_who, p_q, p_limit, p_offset)` (migration `20261108_people_who.sql`, applied live, service role only), read by HQ `readWho` in `lib/veOutreachRead.ts` through `/api/branddesk/people?p=who`. **On branches, not merged**: HQ `claude/bold-feynman-esaemy` 493e100, VE same name c569e12 (the migration file). Checked with mocked data at 1440 and 390 px; not yet seen signed in. Next in the queue: a BrandDesk Clients room in HQ, then a read-only member list in the Depot. Handoff `docs/handoff/2026-11-08-branddesk-production-wing-who-filter.md`.

**R, the max_tokens rule.** On the 5.x models thinking counts against max_tokens, so every 5.x Claude call gets 16000 and treats any end but `end_turn` as an
error (cut_off), never half an answer. Done 2026-11-08 in `ve-discover`, `ve-invites`, `branddesk-insights`, `ve-listing-intake`, `ve-books`, `ve-brand-kit`,
`ve-listing-about`, `ve-page-guide`, `ve-event-check`, `ve-plan`, `ve-people` (all redeployed, source sha256 matched) and in HQ `app/api/branddesk/v`,
`app/api/pulse-studio/guide`, `lib/branddeskProposal.ts`, `lib/houseMeetings.ts` and the functions `fieldy-digest` (v11), `people-email-harvest` (v9). The 4.x
calls do not think unless asked and were left alone. Only `ve-ideas` uses web search (already 16000). A new Claude call follows the same rule.
`ve-function-deploy` reads only this repo: an HQ function was deployed by a temporary copy in a commit on the session branch, then reverted.

## One Blueprint, and Signal (Sean, 2026-11-06, playbooks `branddesk-production-wing`, `signal`)

The three Blueprint chats are one: `branddesk-production-wing` is the Blueprint playbook (ve-idea-intake parked and folded in), and **`ve-feedback` is the Blueprint's small-fixes queue**.
Blueprint > Ideas holds every idea, Blueprint or not; sorting sends each to its playbook. The A to Z (A to G live, H and I waiting on Sean, J to R pending, K next: uploads on Ideas with the
Claude output-limit check built in) is in `docs/handoff/2026-11-06-branddesk-production-wing-one-blueprint-a-to-z.md`. **Signal is its own playbook, `signal`** (Sean: "our version of ISD,
Information Systems Division... everything about technology, the background, the platform"): Search Console, page speed, tag manager, uptime and errors, database security, costs and the technical
fixes, building on `canon-branddesk-blueprint-signal`. Logan's defaults, not yet confirmed: Sentinel (`sentinel-gap-closure-playbook`) becomes Signal's monitoring engine, and the older
`arch-signal-system` (an interest-based comms layer) gets renamed so Signal means IT only.

**Ideas: uploads, Logan's read, the conversation and web search (2026-11-06 to 07, playbook `branddesk-production-wing`; handoff
`docs/handoff/2026-11-07-branddesk-production-wing-web-search-wrap.md`).** Blueprint > Ideas takes typed or spoken ideas with screenshots,
PDFs, text files and voice memos (private bucket `idea-files`; HQ migration 083). `ve-ideas` `read_blueprint` (v8) reads them: pictures and
PDFs as attachments, audio as words (ElevenLabs, kept on the file), max_tokens 16000, anything but a clean end is an error (`cut_off`,
`refused`, `stopped_*`), the last good read kept, never half a read. **The read searches the web** (Sean, 2026-11-07: "You start with the web
search"): `web_search_20260209` and `web_fetch_20260209`, 5 searches and 3 pages a read, a paused turn resumed up to 4 times, `read.searched`
and `read.sources` saved; proven on a test idea (5 searches, the real wholesaler's pages, the made-up link said unread). The conversation
with Logan is a scroll that opens on the newest turn (HQ main f60acd9); this period's plan merged (HQ main 2458e72). **Not on HQ main**: the
"Where I looked" list under each read (HQ branch `claude/keen-hamilton-7bia8n`, 75b8223) waits for Sean's merge and a check at 1440 and 390 px.
The paused hourly idea task and `zz_playbook_close_20261106` are deleted (Sean, 2026-11-07). Next: Send to a chapter's Daily Pulse and today's
podcast news (drafts, Sean approves each), then retire Depot > Ideas.

**Old links and page templates, live (2026-11-06 and 07, playbook `signal`; handoff `docs/handoff/2026-11-07-signal-old-links-and-page-templates.md`).**
Every old WordPress address and the 404 page go to `api/gone.js`, which asks `signal_resolve_old` (hand map `signal_redirects`, then a listing or a
Pulse article, 301; else the Explorer intake `/passport?from=old-link`, 302), and every visit is a `signal_old_hits` row. Search titles and
descriptions follow one rule, `public/ve-seo-text.js` (titles fit 65, descriptions 70 to 155), used by `api/listing.js`, `directory/listing.html`,
`api/event.js` and `api/pulse-article.js`; chapters are served by `api/chapter.js` with their own head and heading; every banner page carries a seed
`<h1 class="vcb-ssr">` the banner replaces (`api/event.js` strips it and the Events page's own share tags). The scanner counts headings and pictures only
outside scripts. Rescan 2026-11-07: 3,325 pages, about 7,000 flags to 7. Waiting on Sean: merge 20309bf (slugs with an underscore). Next: the Signal tab in BrandDesk.

## Playbooks: open here first (Sean, 2026-11-03)

"I've steered away from it being work on a playbook to going back to working on individual tasks... It's just idea after idea after idea. I need
the playbooks to reel me in." **Depot > Playbooks** (`/admin/depot/playbooks`, first in the Go to menu; `ve_playbook_index`, edge function
`ve-playbooks`, super admin token; migration `20261103_playbook_index.sql`; playbook `ve-playbook-index`): one card per active playbook with its
goal, where it stands, **the one next action**, who owns it (Logan or Sean) and a due date. Tabs: Needs Sean (soonest due first), Building,
Watching, Parked, Done, All and **Not in the index** (playbooks with records and no row, Vegans Explore only). One playbook per view (`#p/<slug>`):
edit the row and read the playbook's records, newest first. Status words: Building, Waiting on Sean, Watching, Parked, Done.
- **Every chat names its playbook first.** Before building anything, Logan says which playbook the work belongs to and what its next action is. Work
  that fits no playbook is a new idea: say so, and bring Sean a recommendation (add a playbook, or park it), never build it quietly.
- **Wrap up updates the row** (with the playbook record, canon and the rest of the wrap-up above): where it stands, the one next action, status, due date.
- **Everything handed off is named by its playbook** (Sean, 2026-11-03: "named by their playbook... the playbook is the name of the task... I'm going in and updating it manually"): every playbook record, `brief_checkpoints` summary, `stream_events` summary, handoff doc title and paste prompt starts with the playbook's slug and the task, as `<playbook slug>: <task>` (for example `ve-pricing-points-passport: referral field on the join steps`). One chat can touch several playbooks; list each as its own line with the same pattern, never a bare task name.
- **`ve-feedback` is Sean's spot-check playbook** (Sean, 2026-11-03: "I want to be able every day just to look through the site. And if I
  see something small, a little tweak... go to this playbook... I'm only working out of one playbook"). Always open, never closed: Watching
  when nothing is queued. Logan triages every item Sean gives before touching it: a tweak to something that exists goes in this queue; an
  item that belongs to an existing build goes to that playbook's queue, named by its slug; anything bigger than a tweak is a new idea, so say
  so and bring Sean a recommendation (a new playbook, or park it), never build it quietly. One pinned task per playbook (a second task on the
  same playbook is wrapped and its open items go back to the queue). Work the queue top to bottom, confirm each item live, mark it Done, pull
  the next one without being asked. Each item is one decision record `ve-feedback: <task>`. **A visual copy of the queue** (Sean, 2026-11-04: "I want both experiences", a list he browses and a guide that walks him): `briefings` slug `ve-feedback`, brand `vegans-explore`, filled from the active playbook template, at `hq.lesaruss.ai/branddesk/brands/vegans-explore/playbook/ve-feedback` (a signed-in page). Pending is grouped You decide / Logan works / Recurring / Parked, each item numbered, with Completed beside it; Sean says "pick for me" or an item's number. It is a written page: when an item moves, update its pending and done lists in `briefings.content` (through the playbook skill, never hand HTML) and the `ve_playbook_index` row. Not yet seen in a browser (first build session could not reach HQ). First two items, both Done: the dashboard Insights
  block and the Depot moved to the bottom (above). Item 3, Done 2026-11-03 (main e7008ae): the footer overlapped the dashboard's content on phones
  because `html,body{height:100%}` with the flex-column body let `.console-frame` shrink; the body now grows (`height:auto`) and the frame is
  `flex:1 0 auto`. Any page that puts the footer last in a flex-column body must not give the body a fixed height.
- Seeded 2026-11-03 with 23 rows (Vegans Explore, and BrandDesk in HQ) from these notes. A playbook with records and no row is added from Not in the
  index or left as history. Not built: rows for other brands, a Needs Sean count on the dashboard.

## Analytics (Sean, 2026-10-28)

"Use the same exact structure as the analytics section in BCPS Marcom... put it in our depot... see what's popular, what's
working, which communities are growing the most... break it down by our communities... a ranking based off certain metrics."
**Depot > Analytics** (`/admin/depot/analytics`, first in the Go to menu, group Insights; super admins only), laid out like
bcpsmarcomm's `AnalyticsPage.tsx`: the period (Last 7 / 30 / 90 days, This year, Custom; always against the period just before),
four tiles two by two beside the traffic graph (Visitors, Page views, New members, Top source), then the sections as one dropdown at every width (Sean, 2026-11-01: "I'd rather it be a drop down"),
each a searchable, sortable, ranked and paged table: Top pages, **Communities**, Daily Pulse, Directory, Traffic sources, Places,
Campaigns, Ads, Members. The address carries it (`?range=90&bots=show#communities`).

- **Communities** ranks every chapter by any column (Rank by, or a column head): Visitors (Google places them in the chapter: by
  city for a chapter with a city list, by state for a whole-state chapter; `chapterOf` in `ve-analytics`), Visitor growth, Hub page
  views, Members, New members, Listings, New listings, Listing views and actions, Check-ins, Pulse posts and comments, Upcoming
  events, and **Overall** (each shown column scored against the best chapter in it, best = 100, averaged). The columns are picked on
  the page and kept in the browser (`localStorage` `ve_an_chapter_cols`, `ve_an_chapter_rank`).
- **Traffic is Google Analytics**, property 432623792 (vegansexplore.com, tag G-2B6SKSQZLX in `/analytics.js`; history from March
  2024). Every public page carries it: `nav.js` loads `/analytics.js` on any page that does not, and `analytics.js` runs once a page
  (`window.__veGA`); never on `/admin/` pages or the board consent, so the team's Depot work is not traffic (Sean, 2026-10-28).
  **The team's visits count like anyone's** (Sean, 2026-10-28: "it's still traffic to the page... include my traffic as well";
  Google counts each browser once as a visitor). A few hours' exclusion of super admins' browsers the same day was undone, and
  `analytics.js` clears its old mark (`localStorage` `ve_ga_off`). Google's numbers are read live by the edge function `ve-analytics`
  with the LESARUSS analytics reader
  (`lesaruss_secrets` `GA4_SERVICE_ACCOUNT_JSON`, `lesaruss-analytics-reader@...`, which can read every LESARUSS property), cached
  3 hours in `ve_analytics_cache` (Refresh now skips it). Our own numbers are `ve_analytics_internal(from, to, prev_from, prev_to)`
  and `ve_chapter_of(city, state)` (migration `20261028_ve_analytics.sql`).
- **Likely bots are left out by default** (the box on the page; `bots: 'show'` counts everything): visits with no city, from cloud
  data-center cities (`BOT_CITIES`) and from China. Found 2026-10-28: about 6,400 of October's 7,000 Google "visitors" were a
  Frankfurt data center with no city hitting `/join` about 200 times a day (it stopped when `/join` began forwarding to
  `/passport`), plus crawlers in China and Singapore. Real visitors, Sep 29 to Oct 28: 221.
- **Members** count `member_class` 'member' only (9 active on 2026-10-28): not the Guides (`agent`), the team and its test logins
  (`internal`), or seed and spam sign-ups (`quarantined`). 43 rows are `active` in all. Most members have no home chapter, so
  Communities leans on visitors and activity more than members.
- Pulse topic views are Google's views of the post's own address (`?post=<id>`); comments leave out the opening reply.
