# Outreach wording audit, 2026-11-13

Sean, 2026-11-13: "Can you do a scan of all of the messaging in our outreach across all campaigns and flag anything that may need to be
updated, that might be out of context or obsolete or outdated?" (He held the weekly business email for the same reason.)

**Scanned:** 49 HQ Outreach campaigns (53 emails, 3 personal emails), 7 programs (33 steps: email, DMs, Meetup, Facebook, WhatsApp, pages),
9 older templates (`ve_outreach_templates`), 2 HQ > Email campaigns, and the automatic emails in 15 edge functions (`ve-nurture`, `ve-claims`,
`ve-holiday`, `ve-badges`, `ve-event-headsup`, `ve-mission-survey`, `ve-pulse-subscribe`, `ve-stripe-webhook`, `ve-outreach`,
`ve-people-outreach`, `ve-branddesk`, `ve-podcast`, `ve-feedback`, `ve-search`, `ve-business-weekly`).
**Checked against:** CLAUDE.md standing rules (writing, membership, email, third person, Pre-Vegan wording), canon `canon-ve-door-guides` v12,
the Guide roster, the business dashboard (live 2026-11-13), the brand kit email template, dates in `ve_holidays`.

## Live and sending now
| Campaign | Verdict |
|---|---|
| `claims-approved-liz` (Liz to Chaska and Next Level Veggie Grill, from 2026-11-13) | Current. Matches the dashboard, Getting started and the Find us post. |
| `welcome-community` (everyone who joins) | Current. |
| `nominee-invitations`, `nominator-notes`, `nominator-featured` (Kai) | Current. |
| `featured-people` (Kai) | Promises the drawn portrait and graphics of the Featured kit, which waits on Sean's approval (`docs/proposals/nominate-someone.md`). Nobody is on it yet, so nothing sends until someone is marked featured. |

## Paused (since 2026-11-11): fix before resuming
1. **Holiday Launch, 5 groups (about 2,100 people, 12 sent)** and its Meetup, Facebook and WhatsApp steps: built around ThanksLiving on
   November 26. Resumed late, the lead should move to Hanukkah, Christmas and the Gift Guide. The video on `/hello` was recorded before the
   brand lock: check it still matches the site.
2. **Founding Cohort 1 follow-ups, 3 drafts (97 people):** "ThanksLiving two weeks out", "Thursday, November 26": the timing goes stale.
3. **ThanksLiving menus, plant-based version (1 left to send):** says "plant-based" without "(Pre-Vegan)" (Writing rule).

## Drafts
4. **Gift Guide 2026 and Featured: Kosher Places / Holiday Menus (4 emails, about 30 businesses):** promise a December "giveaway vault"
   (something given away every day, claim by Friday, November 20) and "first pick of a few things we are planning for December". Nothing
   behind it is built. Build it, or take it out.
5. **Creator invitation (master copy):** "Your membership is on us" and "Accept your membership" are from the paid era. Membership is free
   for everyone (canon v12) and there are no comps.
6. **Orientation, 6 paths (18 emails):** signed "The Vegans Explore team". Since the roster locked, newer emails come from their Guide (Liz for
   businesses and Explorers, Kai creators, River events, Dani nonprofits, Maya Pre-Vegan businesses). Restaurant step 1 should point to the
   business dashboard (Getting started with Liz). Nonprofit step 3 leans on the Holiday Guide's Give back, stale in January.
7. **Welcome paths, 6 drafts:** "Graphics and short videos... coming soon" (creators): the creator kit exists now. "A path for group leaders is
   coming soon": the business dashboard serves groups now. Business and restaurant welcomes could point to the business dashboard.

## Automatic emails (code)
8. **The email shell in six functions** (`ve-nurture`, `ve-holiday`, `ve-badges`, `ve-event-headsup`, `ve-mission-survey`, `ve-pulse-subscribe`)
   is the old look: dark green button, the logo as SVG (Gmail does not show SVG images), no stripe. Move them to the kit email template
   (`supabase/functions/ve-business-weekly/email.ts` is the first one built on it).
9. **`ve-claims`, the Brand Partner approval email:** "Partner Dashboard is open on your page" linking `?tab=brand`, and "Maya walks you through
   Getting Started". Owners now go to `/dashboard/business`, and Liz is the bridge to businesses.
10. **`ve-nurture`, the Restaurant Guide door emails and the dish-slot reminder:** link owners to `?tab=brand`; should be `/dashboard/business`
    (dishes: `?tab=page&pd=dishes`).
11. **`ve-stripe-webhook`, the $11 receipt:** "Your Passport is active" / "Thank you for joining Vegans Explore. Your membership is active." With
    free membership the $11 is a give, so the receipt should thank them for it, not tell them it made them a member.
12. Other brands in the same function (ADA Unlocked, Blur to Blueprint) use em-dashes in their receipt subjects.

## Checked and current
The business outreach templates (`ve_outreach_templates` business-outreach), the event heads-up, the Daily Pulse confirm, the Restaurant Guide
and topic Guide prices ($11 or 1,100 points), the Founding Member deadline everywhere (midnight Eastern, January 1, 2027), the weekly business
email (`ve-business-weekly`), Liz's claims emails.
