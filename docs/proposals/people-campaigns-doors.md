# People, campaigns and the three doors (LOCKED by Sean 2026-11-03)

Concept session with V, locked by Sean: "we can lock it" (canon `canon-ve-people-campaigns-doors`; migration
`20261103_people_campaigns_doors_canon.sql`; playbook rows on `ve-pathways` and `ve-pricing-points-passport`).
**Nothing here is built yet** except the member card (below). It extends Pathways (`canon-ve-pathways`, locked
2026-10-29), it does not replace it.

## 1. The three doors (no comps)

| Door | What they give | What they get |
|---|---|---|
| **Subscriber** | an email | the Daily Pulse for the cities they pick, free |
| **Time** | the comprehensive survey (Your profile) | membership, full access, **250 points** (the survey's own); more points only from bounties |
| **Money** | the $11 Passport | membership, full access, **1,100 points** |

- Both membership doors give access to every feature and the ability to earn points. The $11's advantage is the bonus points.
- No comps and no free memberships. If Sean has a good relationship with someone, he gives **bonus points by hand** from
  their profile (the member card's Give points, and Take back since 2026-11-03).
- Founding Member is unchanged: paying the $11 before midnight Eastern on 2027-01-01. **Open question (Sean's words were
  unclear): does the survey door also earn Founding Member?** Default until he says: no.
- The survey door is a rule change to "Earn your Passport" (the three challenges as the free path). Build it, then retire the
  challenges' role as the free path; do not delete them until Sean says.

## 2. The Welcome is the Passport is the Taste

Sean: "the welcome should just be the passport too... we're merging the passport, the welcome, and the taster all together."
- **One Welcome**, always free and public on the website, explaining **how to use Vegans Explore**, kept current with how the
  site looks (it is out of date today). Visitors choose what they want to know; at the end, "enter the room" by choosing a path:
  support us with your time (the survey) or with the $11. It is used in many places (the nav, banners, emails, the Pulse).
- The **Taster account type goes away** (the survey replaces it). Until the Welcome ships, `ve_tasters`, `/guides/taste` and the
  Taster emails keep working; **no Taster sequence for Pulse subscribers** (they only get the Pulse).
- This is the next build after the buttoned-up work below (Sean: "the next thing I want us to do... the updated welcome guide").
  Copy `passport.html`'s Guide shell (template gate); the Welcome Guide (`/passport?guide=welcome`) and the Taste (`/guides/taste`)
  and the Passport pages are the three things being merged.

## 3. The Daily Pulse subscription (the first door to build)

- A **Subscribe** box on every Pulse page and article (inline after the first story and at the end), plus an **exit pop-up on
  desktop only, once per visitor per 30 days, never on a first page view or on phones** (Google penalizes intrusive mobile
  interstitials; Pulse pages bring search traffic).
- **Cities**: one or more, nearest preselected. **Daily** by default, weekly as an option. A preferences page changes both.
- **Confirm the email** with one click before the first issue (double opt-in); London needs an unticked explicit tick; one-click
  unsubscribe on every issue.
- **The issue is short**: headline plus two lines for the top five stories, then **From Vegans Explore** (the house section; this
  is where a campaign is promoted, through `ve_pulse_features`), one ask. Every link is a tracked link naming the person.
  If a city has nothing, skip it that day.
- Every few issues, one gentle line offers the two membership doors. Not every issue.
- Reuse the Taster record (email, city, consent basis, confirm, unsubscribe) with source `pulse-subscribe` and the Taster
  sequence switched off. Sends go through `email-send` (brand `vegans-explore`), within the domain's warm-up allowance.
- Subscribers per city is a number to show sponsors.

## 4. People and campaigns (on the Pathways engine)

- **Profile**: one page per person: who they are, groups, every email, click and action, notes, and Give / Take back points.
- **Group**: a stakeholder bucket (Sponsor interested, Vendor, Volunteer, Pre-ticket...). A rule puts people in (for example,
  clicking the sponsor ad), or Sean does by hand.
- **Campaign**: a goal with tracks. Each track has an audience, an email sequence and a **guide page** the email's link opens,
  explaining the opportunity.
- **Entry**: a person enters a campaign's sorting only on a real action (click, form, reply, registration). Before that they are
  on a send list only. Keep two facts: the **source** (banner, Pulse, email, form) and the **stage** (Noticed: clicked or viewed;
  Interested: opened the guide or left an email; Committed: form, vendor registration or purchase). No numeric scores.
- **Banners**: a signed-out click is anonymous, so the banner opens the campaign's landing page with a one-line "tell me more"
  email; that makes the person ("banner, then email"). A signed-in member is named from the click at once.
- A person can be in several campaigns, each with its own stage.
- **Follow-up sequence** (default): Day 0, Day 3, Day 7, last note Day 14; stops the moment they act or unsubscribe. Editable
  per track; a change applies to anyone who has not reached that step.
- **Two-week calendar**: each track's sends laid out by day; Sean approves the plan once and can pull anyone any day.
  Nothing leaves without his approval of that day's list.
- **Cold audience**: published emails only, from the Directory, city by city, never guessed; in London business addresses only.
- **Where a campaign lives**: in BrandDesk under Vegans Explore (no new brand per event). Tabs: Overview, People, Assets (media,
  videos, wording, art per stakeholder), Messages (compose, test, schedule, follow-ups, live results), Playbook (the dated plan),
  Results. **BrandDesk's Plan tab is renamed Playbook** (HQ already calls its planning documents playbooks; same meaning).
- Sending works from the main lobby (everyone) and from inside a campaign with the same tool.
- **First pilot, when Sean picks a campaign**: the Plant-Based Showcase at the Miami Dolphins game (Nov 29, 2026). Not the World
  Vegan Expo (city and date not set).

## 5. The people sender (BCPS Marcom's way of working, rebuilt on our engine)

Read 2026-11-03 from `lesaruss/bcpsmarcomm` (read only, nothing there changed). BCPS: a named campaign; a live list in groups
with checkboxes; Preview anyone; Send me a test (only to a District or LESARUSS address); confirm, then send; skips anyone already
emailed in the campaign; per-person Sent / Opened / Clicked badges; a campaign table with open and click rates; separate weekly
recurring streams approved by Friday 5 PM and sent at 8 AM Eastern. Opens are a 1x1 image, clicks a tracked link.

Depot > Outreach (`ve-people-outreach`) already has: a day view, one message at a time, Send me a test, approve and schedule at a
time (pull back until then), buckets, tracked links, opens from the email system. **Missing**, in build order:
1. **Pick people and make drafts**: choose a source and a bucket, tick people, one draft each onto a day Sean picks.
   First sources (Logan's default): unpaid accounts and the HQ People pool, Tasters left out (they get automated emails).
2. **Status on every row** (Sent, Opened, Clicked) and a **campaign table** (people, sent, opened, open rate, clicked, click rate).
3. **Week view**: Monday to Friday, buckets as colors, move a message between days, approve the day or the week.
Keep the safety rules: nothing sends until Sean approves each message; every list or city switch stays off until he turns it on.

## Build order (Sean: get this buttoned up, then the Welcome)

1. Pulse subscribe (box, confirm email, daily send, preferences page).
2. The people sender (pick and draft, status and campaign table, week view).
3. The survey door (membership and 250 points for the survey; the `/passport` and `/claim` wording; canon update).
4. **The updated Welcome** (the Welcome, the Passport and the Taste merged; the two paths at its end).
5. Profiles with groups and a timeline.
6. Campaign homes in BrandDesk (when the first campaign is chosen).

## Built 2026-11-03 (this session)

- **Member card** (dashboard, super admins): a Recent Members, Recent Votes, Recent Leads, Leaderboard or Inbox picture or name opens
  who they are; **Take back** points beside Give (`ve_points_take`, `ve-dashboard` `take_points`: spendable only, never lifetime,
  never below zero, a reason required, once per ref). Proven in a rolled-back transaction; **the button has not been clicked in a
  browser yet** (first thing to check next chat).
- **Recent Members shows only Vegans Explore members** (`identity_source` `members`); the roster also holds LESARUSS and BCPS
  sign-ins with no member record here (55 of 68 on 2026-11-03), which cannot open a card.
- Hover rings are no longer clipped on the left of any scrolling dashboard box.
- Not found: a member named Zelda (searched members, Tasters, invitations and listings in this database on 2026-11-03); the only
  account created that day was an internal QA test. Ask Sean for her email.
