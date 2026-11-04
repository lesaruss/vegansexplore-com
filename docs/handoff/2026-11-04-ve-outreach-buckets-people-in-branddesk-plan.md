# ve-outreach-buckets: People in BrandDesk for Vegans Explore (plan, merged branch, HQ read)

Date: 2026-11-04. Playbooks: `ve-outreach-buckets` (owner of this work), `ve-pathways` (parent). No database change this session.

## What happened
- **ve-pathways: merged `claude/dazzling-archimedes-3rxgti` to `main`** (Sean: "merge it"). Merge commit `ed0e2db`, authored Sean A. Russell, no conflicts, pushed. Vercel production deployment `dpl_2anGvHLwTXg3u3d1yXV1N5x9Krca` is READY from that commit. The live `guide-scripts/vegan-restaurant-guide.js` carries the `rg_b` personal-link code (5 places) and `/guides/vegan-restaurant-guide?b=<code>` answers 200. **Not tested end to end**: a real `/go/bo-` link into the Guide (the code-to-business lookup is server side; test with a test contact first).
- **ve-outreach-buckets: read HQ** (`lesaruss/lesaruss-hq`, attached with `add_repo`, shallow clone at `/home/user/lesaruss-hq`, `79335cf`; the clone is ephemeral, clone again). Nothing was built or pushed in HQ.
- Nothing has been sent to a business. The three Restaurant Guide emails are still drafts. No city is on.

## What HQ has (read 2026-11-04)
- **BrandDesk brand home**: `components/branddesk/BrandHome.tsx`, route `app/(shell)/branddesk/brands/[brand]/page.tsx`. Tabs today: Overview, Brand kit, Blueprint, Social, Web, Insights (`VIEWS` array, tab in the address as `?view=`, `go()` pushes history, rooms are components such as `InsightsRoom`, `SocialRoom`, `BlueprintRoom`; styles `DESK_CSS` in `deskCss.ts`). A People tab is a new `VIEWS` entry and a `PeopleRoom` component.
- **HQ People and Distributions live under `app/(modules)/`**, not `(shell)`: `people/` (list, `PeopleClient.tsx`, `distribute/`, invites) and `distributions/` (`page.tsx`, `actions.ts`: Overview, The emails, People, Send days, Interested; switch, save email, plan days, approve day, take out, send test). Both are super admin only (`superadminMemberId` in `people/access.ts`).
- **`lib/outreach.ts`** is HQ's only door to the engine: `outreachCall(action, body, asMember)` posts to the `ve-outreach` edge function with `LESARUSS_ADMIN_TOKEN` (server side only; `as_member` is honored only for people lists). Distributions asks `overview` for `kind: 'people'` only.
- **The gap**: the restaurant lists are `kind: 'city'`, so HQ cannot see or work them. A small read-only change in `ve-outreach` (or a new action) is needed so HQ can read city lists with their doors, contacts, email sources and batches.
- **BCPS Marcom `CertFollowupPage.tsx` was not read** (that repo is not attached). Pattern from Sean's description: campaigns, people grouped, Preview, a Test button per group, Send checked, Sent / Opened / Clicked badges. Attach `bcpsmarcomm` (or ask Sean for the file) before copying it.

## The plan (Logan's recommendation, waiting for Sean's go)
1. A **People** tab in the Vegans Explore brand home, three views in the address: `?view=people&p=campaigns|people|days`.
2. **Campaigns**: one row per door (restaurant first), counts, the three emails, Preview and Send me a test.
3. **People**: contacts grouped by door and region with where each email was found. This is where the wrong addresses from Find emails get read and removed (DoorDash support boxes, web vendors' accessibility mailboxes, chain inboxes). Send checked and Sent / Opened / Clicked badges.
4. **Send days**: approve 30 a day spread across regions. Nothing sends until the day is approved and a city is on.
5. **Engine**: read-only access for HQ to city lists; no new sending path.
6. Pull non-restaurants out of the restaurant door before anything is staged; the city lists hold some.

Defaults Logan will take unless Sean overrides: People on Vegans Explore only (prototype), Workspace and Mission Control left alone; work on an HQ branch `claude/vibrant-knuth-1nds2h` and show Sean before anything goes to HQ `main`; Send checked only schedules approved days.

## Still open
- London and Washington D.C. fail Find emails with `WORKER_RESOURCE_LIMIT` (not diagnosed).
- Find emails takes wrong addresses (read every batch by eye).
- The Instagram message is not loaded.
- The Day 0 wording for Vegan-options places is Sean's call.
- Stage the 30 restaurants (Sean approves each send day and turns cities on) after People exists.
- The Welcome Guide four-step version and the Explore sorting hat come after the restaurant batch.
- CLAUDE.md's Deploy rule says commits are authored Sean A. Russell; earlier branch commits used Claude `<noreply@anthropic.com>` because the push check wanted it. Sean has not said which to keep. The merge commit used Sean A. Russell.

## Paste prompt for the next chat
> ve-outreach-buckets: People in BrandDesk for Vegans Explore. Read `docs/handoff/2026-11-04-ve-outreach-buckets-people-in-branddesk-plan.md` in lesaruss/vegansexplore-com (main). The Restaurant Guide branch is merged and live (main `ed0e2db`, Vercel READY). Nothing has been sent and no city is on. I read HQ (`lesaruss/lesaruss-hq`): BrandDesk's brand home is `components/branddesk/BrandHome.tsx`, HQ's People and Distributions are under `app/(modules)/`, and `lib/outreach.ts` reaches the `ve-outreach` function but only for people lists, so the restaurant (city) lists are not visible to HQ. Say which playbook this is and its next action first. Attach `lesaruss-hq` (add_repo, push access) and clone it once. Then, if I say go, build a People tab in the Vegans Explore brand home (campaigns by door, people with email sources, send days), on an HQ branch, and show me before it goes to HQ main. Also attach the BCPS Marcom repo or ask me for `CertFollowupPage.tsx` to copy its follow-up pattern. Read every batch of found emails by eye; nothing sends until I approve a send day and turn a city on.
