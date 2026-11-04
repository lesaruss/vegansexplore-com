# ve-outreach-buckets: Outreach live in BrandDesk, V's Hide, tour and audio, brand buttons

Date: 2026-11-04. Playbook: `ve-outreach-buckets` (parent `ve-pathways`; the Restaurant Guide is `ve-restaurant-guide`).

## Done and on main
- **Engine**: `ve-outreach` v25 deployed from vegansexplore-com main 0cd6cf8, sha256 `fb32506960c427cabb83611f477f8deccd32cda9be299b5811be5e423215efb4` (75,699 bytes), matches main. HQ can run plan, approve, cancel, remove, contact, city and test on city lists as a signed-in super admin (admin token + `as_member`).
- **HQ** (`lesaruss/lesaruss-hq`): #150 People tab, #151 Hide V + tour + audio per view + look, #152 rename to **Outreach** + buttons wear the brand's accent. Main 9855976. Production for 9855976 was still building at wrap-up: check it is READY before saying it is live.
- **V**: Hide me / Show V (all BrandDesk tabs), one line and recording per Outreach view, a 9-step tour (`lib/branddeskTours.ts`, `components/branddesk/Tour.tsx`), Take the tour in V's panel and on the page. 12 mp3s in `geekfon-media/voice_samples/v/branddesk/` (`people-campaigns|people|days-v1`, `tour-people-1..9-v1`), her roster-profile voice.
- **Look**: green (brand accent) actions, styled inputs, status tags, city switches, email list, Send days 1-2-3-4 strip, a "what this page is" line per view.

## Not verified
- A signed-in look at the live HQ page. Everything was checked from the real code with mocked answers at 1440 and 390 px (no script errors, no sideways scroll) and a preview build that went READY.
- Take out, approve, fix email and plan against the live engine. Only the city switch was exercised (South Florida, already Off).
- 10 of 12 recordings were not read back with `stt`. The two view lines checked match; "Read by eye" reads back as "Read by i": listen to it.
- Orange elsewhere: the Blueprint tab's studio component, the Social iframe and any colour outside `deskCss.ts`.

## Next actions
1. **Sean**: open BrandDesk > Vegans Explore > Outreach signed in; try Hide me, Take the tour, Hear V on each view, Preview and Send me a test (to your own address). Say what reads wrong.
2. **Logan**: confirm production READY for 9855976; fix what Sean finds; exercise take out, plan and approve with Sean watching (nothing sends unless a day is approved and a city is on).
3. **Sean's idea, awaiting his go**: a tour and recording for every BrandDesk page and tab. Recommendation: tab by tab, Overview first (each is a `TOURS` list plus about ten recordings).
4. After `ve-restaurant-guide` is finished: stage the first 30 restaurants (Sean reads every email and where it was found, approves each send day, turns each city on). London and Washington D.C. still fail Find emails (`WORKER_RESOURCE_LIMIT`, not diagnosed).
5. Commit authorship is still undecided (Claude noreply vs Sean A. Russell).

## State
No email has gone to a business; no city is on. `event-hosts` (the event heads-up Sean approved Nov 3) is the only enabled list.
