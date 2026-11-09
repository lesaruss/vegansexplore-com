# ve-mobile-app: iOS in App Review, Android draft saved, the launch process v1

Session 2026-11-08 (Logan), branches `claude/elegant-mayer-r6z3p0` in lesaruss/vegansexplore-app and lesaruss/vegansexplore-com. **Nothing merged
to main; Sean says "merge".** Times Eastern.

## Where it stands

- **iOS 1.0.0 (13)**: sent to App Review 12:30 PM, submission `b4cb0fe6-718a-4607-ae08-d4d121196add`; read Waiting for Review at 7:22 PM.
  Watch: https://appstoreconnect.apple.com/apps/6776554626/distribution/ios/version/inflight
- **Android 1.0.0 (5)**: Play listing saved 12:58 PM; draft production release saved 7:24 PM (validated). Sean finishes the app Dashboard's
  **Set up your app** list (answers in `store/LAUNCH-PROCESS.md`), then Publishing overview > **Send for review**.
- **Listing v4** approved by Sean with his notes (app commit cfa7095), in App Store Connect and Play.
- **The launch process v1**: `store/LAUNCH-PROCESS.md` in the app repo. Sean: "lock this into a process that we can sell." It holds the order, the
  owner's steps, how we give directions, every hiccup with its fix, the owner's questions answered up front, listing rules and the review log.
- Checklist: https://claude.ai/artifact/J3sWNRENCjTBDCtzSkxZrb

## Ledger (every item this session, where it is stored)

1. Listing v4 from Sean's notes: app commit cfa7095 (`store/listing.json`, `store/listing.md`); record 5fc72a79.
2. Listing v4 sent to App Store Connect (run 42501358790): record 5fc72a79.
3. Checklist Step 1 ticked and noted: checklist doc rev 7.
4. App Privacy coached (Data Not Collected was wrong; User ID added): runbook hiccups; record 626c7453.
5. Phone question answered (review phone private, EU trader phone public): runbook questions.
6. App Review page is the submissions list; details live on the version page: runbook hiccups.
7. Readiness check found availability missing, then all OK (runs 42504982684, 42505191450): record 9117ac33.
8. iOS submitted (run 42505254984): record 9117ac33; checklist rev 13; runbook review log.
9. Sellable launch process created: app commit 9d59001; record 626c7453.
10. Play Users and permissions is account-level: commit bd97058; checklist rev 20; record 99361789.
11. Play's icon-only menu, direct links with account id 5154985357477749293: commit a4e5b74; checklist rev 21.
12. Permission label is Manage store presence: commit a16b4c8; checklist rev 22.
13. Draft apps need Edit and delete draft apps (Account permissions tab): commits c7ac6f5, 8388585; checklist revs 23, 24; record e87a81e7.
14. Play listing saved (run 42507746476): record e87a81e7.
15. Directions rule (no menu paths from memory): commit d2e7baa; record 99361789.
16. Play setup from the app Dashboard list with answers: commit 5846b62; checklist rev 25.
17. Review login cannot be read from Key Room; copy from Apple; username appreview@lesaruss.com: commit f543d5d; checklist rev 25; record a24711ec.
18. Sean asked to pin the review settings at the top of Key Room: not done, Key Room is write-only and those keys are not in it (record a24711ec).
19. Android draft production release saved (run 42539916132): commit 4fd70eb; record a24711ec.

## Waiting on Sean (each with its link)

1. Play app Dashboard, Set up your app, ten items: https://play.google.com/console/u/0/developers/5154985357477749293 then the arrow on Vegans
   Explore. Answers in https://github.com/lesaruss/vegansexplore-app/blob/claude/elegant-mayer-r6z3p0/store/LAUNCH-PROCESS.md
2. Then Publishing overview, Send for review (same app).
3. EU trader details in App Information if not done: https://appstoreconnect.apple.com/apps/6776554626/distribution/info
4. Forward any App Review email from Apple or Google.
5. Say "merge" for both branches when ready.

## Next for Logan

Watch both reviews; answer or fix what reviewers ask; log each event in the runbook's review log. After launch only: SoFlo Vegans iOS app
(com.lmg.soflo) off sale, Google sign-in client IDs, Apple token revocation on delete, Sean's design feedback. Open idea ve_ideas 83d99dfc ($11
after launch) is not built without Sean's "lock it".
