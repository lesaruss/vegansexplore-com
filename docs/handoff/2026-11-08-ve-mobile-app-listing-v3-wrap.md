# ve-mobile-app: store fill, listing v3 and the wrap-up lock (2026-11-08)

Playbooks: `ve-mobile-app` (main), `ve-pricing-points-passport` (two ideas). Nothing has been submitted to either store.

## Where it stands

- iOS 1.0.0 build 13 is in TestFlight; Android 1.0.0 build 5 is on Play internal testing (read from the stores with the workflow's `store_status`).
- App Store Connect (app 6776554626) is filled by API through `scripts/store-fill.mjs` (app repo, workflow inputs `store_fill`, `store_write`, `store_platform`):
  version 1.0.0 with build 13, copyright, description, keywords, promo, URLs, name, subtitle, privacy URL, categories, the full age rating, 4 screenshots.
  Not settable by API: review contact phone, review sign-in account, App Privacy, price, availability (both 404 until set once), content rights, EU trader.
- Play: listing, screenshots, feature graphic and icon uploaded; the edit's commit was refused 403 until the service account gets Edit store listing and
  Release to production.
- Listing v3 is written (app branch `claude/elegant-mayer-r6z3p0`, c0fe2b3, `store/listing.json` and `store/listing.md`), waiting on Sean's "approved".

## Waiting on Sean (each with its link)

1. Approve listing v3: https://github.com/lesaruss/vegansexplore-app/blob/claude/elegant-mayer-r6z3p0/store/listing.md
2. Work the checklist: https://claude.ai/artifact/J3sWNRENCjTBDCtzSkxZrb (App Store Connect review contact and account, App Privacy, price Free,
   availability, content rights; Play service account permissions, Data safety, content rating, app access, target audience, ads, category).
3. Lock or not the post-launch membership idea (ve_ideas 83d99dfc): Depot > Ideas, https://vegansexplore.com/admin/depot/ideas
4. Merge either branch only when Sean says "merge".

## Then Logan

1. Run the EAS build workflow with `store_fill` true, `store_write` true, `store_platform` android: https://github.com/lesaruss/vegansexplore-app/actions/workflows/eas-build.yml
2. Write and run the submission step (not built yet): iOS 13 to App Review (App Store Connect API `reviewSubmissions`), Android 5 to production (Play edit with a production track release).
3. Give Sean the links to watch both reviews.
4. After launch: SoFlo Vegans iOS app (`com.lmg.soflo`) off sale, Google sign-in on phones (OAuth client ids), Apple token revocation on delete, Sean's design feedback.

## The ledger (every item from this session and where it is stored)

| # | Item | Stored at |
|---|---|---|
| 1 | Builds confirmed in both stores | playbook_records ve-mobile-app "builds confirmed in both stores" (11:29 UTC) |
| 2 | Store submission path, delete my account, review account | playbook_records ve-mobile-app "store submission path" (12:21 UTC) |
| 3 | Store fill by API, what it could and could not set | playbook_records ve-mobile-app "store fill by API"; app commits 4ee8a97, 10ae3ac, 5ddc60c |
| 4 | Listing v2 (Sean's feedback and the panel) and v3 (main groups first, Help us build it) | playbook_records ve-mobile-app "store listing v2 and v3"; app commits f2f0503, c0fe2b3 |
| 5 | Sean's checklist doc | playbook_records ve-mobile-app "console checklist as a living doc"; https://claude.ai/artifact/J3sWNRENCjTBDCtzSkxZrb |
| 6 | "Explorer User" test account removed | same record as 5 |
| 7 | Every ask to Sean carries its link | canon-ask-carries-the-link; error registry COMM-ASK-WITHOUT-LINKS; CLAUDE.md (65198d4); playbook record |
| 8 | Post-launch membership back to $11, survey door closes, Founding perks later | ve_ideas 83d99dfc; playbook_records ve-pricing-points-passport |
| 9 | Gift a membership from points | ve_ideas 5c2ced89; same record as 8 |
| 10 | Wrap-up locked down: record as you go, the ledger, a query check | canon-wrap-up-standard v2; error registry WRAP-ITEM-MISSING; CLAUDE.md Wrap up section |
| 11 | ve_playbook_index row for ve-mobile-app | updated 2026-11-08, owner Sean, due 2026-11-14 |
| 12 | The app repo's tracking of its branch (a false "unpushed" warning) | fixed in this container only; nothing to store |

## Read this first in the next chat

```sql
select kind, left(body,300), created_at from playbook_records where slug in ('ve-mobile-app','ve-pricing-points-passport') order by created_at desc limit 8;
select * from ve_playbook_index where slug='ve-mobile-app';
select * from brief_checkpoints where session_label like 've-mobile-app%' order by created_at desc limit 1;
```
