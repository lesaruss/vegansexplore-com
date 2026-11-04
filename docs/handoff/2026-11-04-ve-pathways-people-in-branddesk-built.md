# ve-pathways and ve-outreach-buckets: People built in BrandDesk, engine change waiting, certification playbook set up

Date: 2026-11-04. Playbooks: `ve-pathways` (parent), `ve-outreach-buckets` (People work), `vegans-explore-initiative-business-certification` (new row and records), `ve-restaurant-guide` (split out, see its own handoff).

## Built, not on HQ main
- `lesaruss/lesaruss-hq`, branch `claude/vibrant-knuth-1nds2h` (8e47d93, 7f8b865; HQ `main` untouched): **BrandDesk > Vegans Explore > People**, `?view=people&p=campaigns|people|days`. Files: `components/branddesk/PeopleRoom.tsx`, `app/api/branddesk/people/route.ts`, `lib/veOutreachRead.ts`, `components/branddesk/BrandHome.tsx` (tab, Vegans Explore only), `lib/branddeskV.ts` (V's line, text only), `app/(shell)/branddesk/brands/[brand]/page.tsx`. Super admin only. Copies the follow-up pattern of BCPS Marcom's `CertFollowupPage.tsx` (repo `lesaruss/bcpsmarcomm`, read only, 52357c3).
- Campaigns: a row per door (restaurant is the only ready one), the three emails (drafts), each city with an on/off switch. People: every contact with email, where it was found, Sent / Opened / Clicked, **read by eye** flags (vendor or platform host, generic mailbox such as help@ or accessibility@, one address on 3+ businesses, found on a different site), Preview, Send me a test (to Sean's own address only), Fix email, Take out. Send days: Plan the days, Read them (every business with its source before approval), Approve this send, Pull it back.
- Checked: type check clean; every column exists in the live database; the flags catch the known bad ones in the live data (a DoorDash box, accessibility@dylish.com, support@hawkhost.com, chitchat@nextlevelvg.com on 3 businesses, help@waterboyz.com found on a cafe's site); all three views rendered at 1440 and 390 against mocked answers with no script errors and no sideways scroll. **Not checked**: a real signed-in HQ page, a real Preview or test send, whether Vercel built a preview.

## The engine change is NOT deployed
`supabase/functions/ve-outreach/index.ts`: `HQ_CITY_ACTIONS` lets HQ (admin token plus `as_member`, a super admin) run `plan`, `approve`, `cancel`, `remove`, `contact`, `city` and `test` on city lists, as the Depot does. On `claude/laughing-dirac-udxp3j` (905cbf8). Until it is merged and deployed (`ve-function-deploy` from the commit, check the source sha256), take out, fix email, plan, approve and the city switch are refused by the engine; reads, Preview and the test email work. Sending is unchanged: an approved day, a city that is on, weekdays 9 to 5 Eastern, within the daily cap. Merging this branch to `main` also redeploys the site (Vercel).

## Live numbers (read-only, 2026-11-04)
219 contacts, 122 on the restaurant door, 2 queued send days, 0 cities on, 0 real sends. No email has gone to a business.

## Certification playbook
V's Aug 4 concept page (briefings `vegans-explore-initiative-business-certification`, type status-brief, kosher model) is now in the Playbooks index with three Nov 4 decision records (Vegan-options restaurants come in through certification; how a business moves through it; the Vegan Brand Guide and wholesale idea, with the contact Sean called Benny's Corner, formerly Vegan Corner, name to confirm). The page itself was not rebuilt; rebuild it from the active playbook template after Sean's concept talk.

## Next actions
1. Sean: say go to put the engine change live; then look at the HQ branch preview signed in. Logan then brings `claude/vibrant-knuth-1nds2h` to HQ `main` (Sean sees it first).
2. After `ve-restaurant-guide` is finished: Logan stages the first 30 restaurants (Sean reads every email and its source, approves each send day, turns each city on). London and Washington D.C. fail Find emails with `WORKER_RESOURCE_LIMIT` (not diagnosed).
3. Welcome Guide four-step and the Explore sorting hat wait until after the restaurant batch.
4. Commit author: this session used Claude `<noreply@anthropic.com>`; CLAUDE.md says Sean A. Russell; Sean has not said which to keep.
