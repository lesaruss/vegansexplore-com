# ve-outreach-buckets: founding cohort email (2026-11-08)

## What Sean asked
Email our strongest supporters: invite them in early as Founding Members (the free Explorer survey), walk the Welcome Guide, send feedback.
Then, by how they engage, a Wednesday follow-up with the Holiday Guide. Sean picked **Suggested for Vegans Explore** as the list and wants to
look it over first. He also asked that BrandDesk campaigns send to people who are not business owners, tracked like everything else.

## Done
- **The list**: `docs/proposals/founding-cohort-1-list.md`. 178 addresses in the Suggested pool of `ve_founding_candidates`, 167 people after
  one address each (the most recent), **151 in**, 16 flagged and left out (a personal note already queued: Susan Hargreaves, Korin Sutton,
  Sam Woods; Brooke Sellers and her client Tiffany Aly; Ed Winters in the media drafts; pro-team staff at the Dolphins and HEAT; work-only
  contacts at Channel 7, Miami New Times, Whole Foods, Stiles, Hopin, Paradox Museum).
- **People campaigns** (migration `20261108_people_campaigns.sql`): `ve_outreach_campaigns.audience` takes `people`, plus `footer_reason`;
  members get `person_name`, `person_id` (the email is `person_key`). `ve_outreach_campaign_due` and `ve_outreach_campaign_render` have a
  person branch. Each person gets an outreach contact (segment person) on the never-switched-on list `people-campaigns`, so the old
  people-list sender never touches them. `ve-outreach` (deployed from 3ec1db0, source sha256 bb430bd9 matched; still has `campaignTick`):
  `buildCampaign` and `campaignTick` send people with the same rules (approval, start day, pace, weekdays 9 to 5 Eastern, warm-up, one
  outreach email a day per address, suppressions, do-not-contact) and the same per-member tracked `/go/` link and `email_sends` rows;
  `campaign_preview` and `campaign_test` take `member_id`.
- **HQ** (lesaruss-hq branch `claude/focused-fermi-o89hgt`, 754a59c, **not on HQ main**): a People tile on Outreach > Campaigns, person rows
  (name and email), Read and Send me a test by member id, and **Opened / Clicked on every campaign row, businesses too** (from
  `email_sends.list_ref = ve-outreach-campaign:<slug>`). Type check clean; not seen in a browser.
- **Cohort 1 campaign** `founding-cohort-1-2026-11` (migration `20261108_founding_cohort_1_campaign.sql`): 151 people, from Sean (brand
  lesaruss), start Mon Nov 9, pace 160, link `/passport?from=founding-cohort` (the Welcome Guide), each person their own `/go/` link at send.
  **Draft: the email is not locked and the campaign is not approved.** Test sent to contact@lesaruss.com at 1:20 PM Eastern.
- **Wednesday follow-ups** (migration `20261108_founding_cohort_1_wednesday_followups.sql`): three draft campaigns, start Wed Nov 11, no
  people yet, each linking `/guides/holiday-guide?from=founding-cohort`: `founding-cohort-1-wed-clicked`, `-wed-opened`, `-wed-quiet`.

## Not today
The sender runs weekdays 9 to 5 Eastern, so nothing can go out on Sunday Nov 8. Earliest is Monday 9 AM once Sean locks the email and approves.

## Wednesday morning (Logan)
Add cohort 1 to the three follow-ups by engagement (clicked beats opened; anyone who unsubscribed or bounced is left out), then Sean reads
and approves each in BrandDesk:

```sql
with s as (
  select m.id, m.person_key, m.person_name, m.person_id,
         bool_or(e.clicked_at is not null) clicked, bool_or(e.opened_at is not null) opened
  from ve_outreach_campaign_members m
  left join email_sends e on e.list_ref = 've-outreach-campaign:founding-cohort-1-2026-11'
    and e.campaign_ref like '%-c' || left(replace(m.id::text, '-', ''), 8) || '-%'
  where m.campaign_slug = 'founding-cohort-1-2026-11' and m.removed_at is null and m.step >= 1
  group by 1, 2, 3, 4)
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status)
select case when clicked then 'founding-cohort-1-wed-clicked' when opened then 'founding-cohort-1-wed-opened' else 'founding-cohort-1-wed-quiet' end,
       person_key, person_name, person_id, 0, 'waiting'
from s;
```
Run it through a one-time function (the connector holds writes). Opens are a floor (blocked images).

## Next
1. Sean: read the list, say who else comes out, read the test, then in BrandDesk > Vegans Explore > Outreach > Campaigns > People, lock the
   email and approve.
2. Sean: merge HQ `claude/focused-fermi-o89hgt` (so the People tile and person rows show) and vegansexplore-com `claude/focused-fermi-o89hgt`.
3. Logan, Wednesday morning: fill the follow-ups, test each, Sean approves.
4. Not built: adding people to a people campaign from HQ (today it is SQL), a person's own page from a campaign row.
