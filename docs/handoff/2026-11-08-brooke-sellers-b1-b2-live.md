# brooke-sellers: B1 client sign-in and B2 Clients room live (2026-11-08)

Playbooks: `brooke-sellers` (with `branddesk-production-wing`). Logan, build mode.

## Live on hq.lesaruss.ai
- **B1, client sign-in** (lesaruss-hq main 63f04eb). `branddesk_client_people` (HQ `supabase/migrations/084_branddesk_client_people.sql`, applied live; Brooke's
  row is the only one). `middleware.ts` Part 6: a signed-in non-staff viewer with a seat sees `/branddesk/brands/<slug>` rewritten to `app/client-desk/[brand]`;
  other staff pages redirect to their desk; staff APIs 403. Files: `lib/clientDesk.ts`, `lib/clientDeskEdge.ts`, `app/client-desk/[brand]/page.tsx`,
  `components/branddesk/client/ClientDesk.tsx`. Staff preview at `/client-desk/<slug>` (read only, labelled).
- **B2, Clients** (main af2f2ad). `lib/coachOs.ts`, `components/branddesk/client/ClientsRoom.tsx`, `app/client-desk/[brand]/actions.ts`. Reads and writes the
  `coach_os_*` tables with the client's own session, so `coach_os_has_access` / `coach_os_has_financial_access` decide, as on `dashboard.html`.
- Proven on the branch previews at 1440 and 390 px with throwaway logins (client, coach role, admin role) and the QA staff account; a real profile save and a logged
  check-in went through; every test row, login and access row removed; `ve-once-b1-proof` back to the 410 stub.

## Database changes recorded, not merged
- Brooke's Gmail made `admin` in `coach_os_dashboard_access` (Sean). GoHighLevel order pull (cron job 20) paused (Sean: GoHighLevel closed around Sept 5).
  Record: HQ `supabase/migrations/085_brooke_coach_os_admin_ghl_off.sql`, branch `claude/funny-goldberg-yghwuu` (dcf4171), waiting on Sean's merge.

## Canon
- `canon-ve-front-of-house` v14, key `hot_labs_v12`: group Hot Lab included; one-on-one Hot Lab $250 ($150 to the Community Manager); managed $500 a month plus a
  $250 setup on one Hot Lab call; managed split $250/$250; Show me how on every connection step; Brooke at $200 (we absorb $50), no added features, Sean her
  Community Manager for now.

## Found
- Every website person (385) is in `coach_os_contacts` today; a brand-new one would not be (no more GoHighLevel). Next build fixes it.
- One check-in typed 2026-12-12 (submitted 2026-10-12): client typo, left as is.
- HQ `lib/__tests__/staffRoutes.test.ts` already failed before this work (the list drifted).

## Next
1. Logan: add new website people (leads, check-in form, paid purchases) to `coach_os_contacts` automatically, so both dashboards stay complete.
2. Logan: Show me how pages for Search Console and social (written steps now, video scripts to Sean), I did it / I'm stuck (adds to her next Hot Lab).
3. Logan: B3 Insights. Needs Search Console access (via Show me how or her Hot Lab) and her channels added in Metricool.
4. Sean: merge the 085 record; look through her desk; approve V's lines and email 4fbbd9f4. Nothing is sent to Brooke without Sean.
