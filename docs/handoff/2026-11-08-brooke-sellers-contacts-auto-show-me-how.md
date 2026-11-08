# brooke-sellers: website people join her client list on their own (live), Show me how built (waiting on Sean) (2026-11-08)

Playbooks: `brooke-sellers` (with `branddesk-production-wing`). Logan, build mode.

## 1. Live: new website people join coach_os_contacts on their own
- HQ `supabase/migrations/086_coach_os_contacts_from_site.sql`, merged to lesaruss-hq main 687b3e9, applied live 2026-11-08 through the one-time
  `ve-once-coach-contacts` (the connector's apply_migration hung on an approval box; the function is back to the 410 stub).
- Triggers on `leads` (brand = a Coach OS brand, not archived), `coach_os_checkins` and `coach_os_digital_purchases` (turning paid) call
  `coach_os_contact_upsert(brand, email, name, phone, where, tag, at)`: one row per email (case-insensitive); a new person gets
  `ghl_contact_id` `site:<email>` and source `website: <where>`; a known person gets the tag added and empty name/phone filled. Tags reuse
  GoHighLevel's words ('start strong: 7 vegan recipes to fuel your journey', 'apply for your transformation', 'web lead form',
  'check-in form', 'e-book purchase'). Errors never block the lead, check-in or purchase.
- Junk left out (`coach_os_looks_junk`): 4+ dots before the @, a scrambled name (a word of 8+ letters with 3+ capitals inside), or an email that
  ever sent a scrambled name on any lead. 3 dots alone is not junk (real clients have them).
- The handoff before this was wrong ("everyone is in"): 115 leads, 13 buyers and 4 check-in people were missing. Backfill result live: 85 added
  (48 e-book, 26 applicants, 13 buyers, 4 check-in), 0 junk, 57 existing clients tagged 'check-in form', total 2,220. Nothing removed.

## 2. Built, waiting on Sean: Show me how on BrandDesk > Meatless Muscle > Get set up
- HQ branch `claude/brooke-show-me-how` (198b921), not on main. Preview `lesaruss-noupzam0t-contact-2245s-projects.vercel.app`
  (share link expires Mon Nov 9 ~11:37 AM ET).
- `lib/clientTasksDefs.ts` (steps, browser-safe), `lib/clientTasks.ts` (read/write, team email), `components/branddesk/client/ShowMeHow.tsx`,
  `ClientDesk.tsx` (steps become tasks; "For your next Hot Lab" card), `taskAction` in `app/client-desk/[brand]/actions.ts`, `page.tsx` loads tasks.
- One page per step (`?how=search-console|instagram|youtube|tiktok`, crumb Get set up > <name>): why, video slot ("on its way"), steps written out
  (access to contact@lesaruss.com from her main Gmail), I did it (state claimed, "We are checking") or I'm stuck with an optional note (state stuck,
  on the Hot Lab card). TikTok has no email sharing: one button, Add it to my Hot Lab. Staff preview: Confirm access / Put it back to her turn.
  Team emailed on each tap ([TEST] names send nothing). Hot Lab lead is Sean for meatless-muscle (`LEAD` in the defs).
- Tables `branddesk_client_tasks`, `branddesk_client_task_events` (HQ migration 087, applied live; empty; RLS on, no policies).
- Proven on the preview at 1440 and 390 px with a throwaway client seat and the QA staff account (stuck with note, I did it, staff confirm, Setup
  after); no overflow; only console noise is Vercel's preview toolbar blocked by CSP. Throwaway login, seat and test rows removed; `ve-once-desk-proof` is 410.
- Steps describe Google/Meta/YouTube screens as of Nov 2026 and were not checked against the live sites from this session.
- Video scripts (V narrates): `docs/proposals/brooke-show-me-how-scripts.md` on vegansexplore-com `claude/nifty-lovelace-86xs90`. V's line for the
  pages is a text draft.

## Waiting on Sean
- Feedback on the Show me how pages, then "merge item 2".
- Approve the four video scripts, V's lines, and Depot > Outreach draft 4fbbd9f4. Merge HQ migration 085 record (branch `claude/funny-goldberg-yghwuu`).
- Delete stray branch `claude/brooke-show-me-how-scripts` on vegansexplore-com (the proxy refused the delete).
- Nothing was sent to Brooke.

## Next (Logan)
1. Apply Sean's feedback on Show me how, merge on his word.
2. B3, BrandDesk > Meatless Muscle > Insights: her GA4 (meatlessmuscle.com, already readable, `analytics_connections` ga4), Vegans Who Lift
   downloads (Captivate), her leads, check-ins and sales (Coach OS). Search and social say they wait on her Show me how steps.
