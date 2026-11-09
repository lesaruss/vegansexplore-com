# ve-outreach-buckets: Founding cohort 1 approved, hold out and Do not email in BrandDesk

Date: 2026-11-08 to 09 (Eastern). Playbook: `ve-outreach-buckets`.

## Where it stands
- `founding-cohort-1-2026-11` is approved (2026-11-08 6:59 PM Eastern): 135 people waiting, 16 held out of this batch. It sends from Mon Nov 9, weekdays 9 to 5 Eastern, pace 60, from Sean, to the Welcome Guide. The email is the locked "hero" copy (migration `20261108_founding_cohort_hero_copy.sql`).
- The three Wednesday follow-ups (`founding-cohort-1-wed-clicked|opened|quiet`) are drafts with no people. A scheduled task fires Wed Nov 11 8:15 AM Eastern (trig_01Be6Fa5thJNBJdtPukCnuqH) into an earlier session: it checks cohort 1 sent, then fills them with `scripts/supabase-once/founding-wed-fill.ts` (ve-once-founding-wed, steps show and fill, then the 410 stub), sends tests and asks Sean to approve. If it does not fire, do it by hand.
- The six orientation campaigns are drafts, still waiting on Sean. Once `orientation-events` is approved, turn off `nurture.door_on`.

## Built this session (HQ main, last 78d1dfb3; VE main)
- **Personal emails**: Save and close, a green "Saved" line, an amber line while notes are unsaved, "Send the campaign email instead", and **Undo** (the cleared version is kept as `personal_emails.undo_<step>`; `personalUndo` in `lib/campaignPersonal.ts`). Personal versions made from older copy need Rewrite it again.
- **Select and Action**: tick people or Select all, then Action: Hold out of this batch, Put back in this batch, Do not email, Take off Do not email (`campaign_bulk` in `/api/branddesk/people`, `bulkAction`). Do not email for people is `people_suppression` (`ve_people_do_not_email`, migration `20261108_people_do_not_email.sql`); for businesses `ve_do_not_contact_set`.
- **Held out and Do not email people leave the list**; the heading counts the batch and a link "N held out or Do not email, show them" shows them to put back.
- Tested in SQL, and Sean used hold out live (16 held). Do not email has not been clicked live.

## Next
1. Watch cohort 1's first sends Monday (email_sends rows, opens, clicks in the campaign table).
2. Wednesday fill (above).
3. Sean approves the orientation campaigns; then `nurture.door_on` off.
