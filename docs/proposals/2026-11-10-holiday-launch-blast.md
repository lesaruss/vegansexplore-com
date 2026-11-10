# The Holiday Guide launch blast (playbook `ve-outreach-buckets`, task `holiday-launch-blast`)

Sean, 2026-11-10, 6:30 AM Eastern: "all I want to focus on is pushing this out finally... to all of our stakeholders. If we can sort them,
we can sort them. If not, they go into an explore bucket and they get a generalized message." The Holiday Guide is the door: it is a sampler
of everything we do (events, Directory listings, gift ideas, what a Guide is). Once people are in and give us their information, we follow up
with everything else in the days to come.

**Goal**: every stakeholder we have hears from us this week that Vegans Explore is back, launching January 1, and is invited to be a Founding
Member (free), to take the Welcome Guide, and to open the free Holiday Guide. **Done** when every email wave is approved and sending, every
group post is up, every link is a tracked `/go/` link, and the results (opens, clicks, sign-ups by bucket) show on one place we check daily.

## What we have (checked live 2026-11-10, 6:45 AM Eastern)

| Source | People | Notes |
|---|---|---|
| Founding cohort 1 (sent Mon Nov 9) | 126 sent, 9 waiting, 16 held out | **Left out of the blast.** They already get the three Wednesday Holiday Guide follow-ups (by opened, clicked, quiet). |
| Old GoHighLevel export (`ve_ghl_contacts_export`) | 2,009 emails | Tagged: club prospect 1,295; Vegan Foodie Fest Miami 310; partner prospect 280; newsletter opt-in and footer newsletter 117; nonprofit 7; media 2; ambassador prospects 3. 99 marked do not disturb, 10 hard bounced, 30 already in cohort 1, 9 already members. |
| Outreach contacts (`ve_outreach_contacts`) | 207 businesses, 5 brands, 132 people | The businesses are Directory listings with a vetted email. |
| Members (`members`) | 68 | Already in. They get the "you're in, now share it" version. |
| Meetup | 3 groups (Miami, Broward, Palm Beach) | Posted by Sean in the Meetup app. |
| Facebook group | 1 | Posted by Sean. |
| WhatsApp group | 1 (announcement) | Posted by Sean. |

**Not used**: `people_emails` (4,977 rows, almost all a LESARUSS-wide backfill, not Vegans Explore people), anyone on `email_suppressions`,
`ve_do_not_contact`, GoHighLevel do-not-disturb or hard bounced, and Florida Animal Rescue Alliance (unsubscribed).

## The risk to handle first: bounces

Yesterday's cohort send bounced **18 of 128 (14%)**. Mail providers start suspending a sender around 4 to 5%. The GoHighLevel list is older
than the cohort list, so sending all 2,000 at 9 AM could get our sending account paused in the middle of the launch. Logan's plan (default
unless Sean overrides):

1. Before anything goes, check every address's domain can take mail (MX lookup) and drop the dead ones, plus every past bounce.
2. Send in waves, warmest first, with a stop: if a wave bounces over 5%, the next wave holds until Logan cleans the list.
3. Wave 1 (today, 9 AM): members, businesses, newsletter opt-ins, Foodie Fest Miami, partner prospects (about 900). Waves 2 and 3 (Wed and Thu,
   9 AM): the club prospects, about 650 a day. Group posts all go today.

## The buckets (one email, one landing page, one line that changes)

Everyone gets the same short email and the same landing page. The bucket only changes one sentence on each, and every bucket has its own
tracked link so we can see who acts.

| Bucket | Who | The line that changes |
|---|---|---|
| `members` | Already members | "You're already in. Thank you. Now help us spread the word: share the Holiday Guide." |
| `business` | Outreach businesses, partner prospects | "If you run a Vegan business, claiming your listing is free for members." |
| `nonprofit` | Nonprofit tag | "If you lead a nonprofit, there is a free Guide made just for you." |
| `creator` | Media, ambassador prospects, creators | "If you create content, we're registering official Vegans Explore creators." |
| `foodie-fest` | Vegan Foodie Fest Miami | "We met at Vegan Foodie Fest Miami, and we kept building." |
| `explore` | Everyone else (club prospects, newsletter, untagged) | The general message, no extra line. |
| `meetup-miami`, `meetup-broward`, `meetup-palm-beach`, `facebook`, `whatsapp` | Group posts | "Thanks for being part of our {group}." |

## Drafts for Sean's approval

### 1. The email (from Sean, short, one button)

**Subject**: We're back, and I'd love you to be a Founding Member
**Preview**: Plus a free Holiday Guide we made for you.

> Hi {first_name},
>
> Vegans Explore is back. We launch on January 1, and I'd love for you to be one of our Founding Members. It's free.
>
> {bucket line}
>
> As a thank-you, we made a free Holiday Guide for the season. I recorded a short note to tell you about it.
>
> [ Hear it and open the Holiday Guide ]
>
> Sean

Footer reason: "you've been part of the Vegans Explore community" (plus the required unsubscribe and postal address).

### 2. The landing page (`/hello`, Sean's still with a play button, his words on the left)

Parent: the invitation page (`/invite`, the page Keya received). Same split: words on the left, Sean's picture on the right with a play button
for his voice note under it (locked 2026-11-10: a still, not a video). Three buttons: **Become a Founding Member, free** (the Explorer survey),
**Take the Welcome tour** (the Welcome Guide), **Open the free Holiday Guide**. A Share button. `noindex`. Each bucket's link is
`/go/<code>` to `/hello?b=<bucket>`.

**Sean's voice note** (about 50 seconds; Sean records it on his phone, since we have no clone of his voice; Logan checks it word for word):

> Hey, it's Sean. Vegans Explore is back, and I'm excited. On January 1 we launch, and I'd love for you to be one of our Founding Members.
> Membership is free: take a short survey and you're in. If you run a business, claiming your listing is free too.
> Before you go, take a minute with our Welcome Guide and see everything we're building.
> And as a thank-you, we made a free Holiday Guide. It's a mini website for our community this season, with events, places to eat, recipes
> and gift ideas for Thanksgiving, Hanukkah and Christmas. Through 2027 we'll cover the other holidays too.
> Check it out, and if you like it, share it. See you inside.

The page shows the same words as text, with the bucket line in place of the business sentence.

### 3. Meetup (one message per group, sent to members from the Meetup app)

> Hi everyone, it's Sean. Vegans Explore is back! We launch on January 1, and I'd love for every member of this group to be a Founding
> Member. It's free. As a thank-you, we made a free Holiday Guide for the season: events, places to eat, recipes and gift ideas for
> Thanksgiving, Hanukkah and Christmas. I recorded a short note about it here: {link}
> If you like it, share it with a friend. See you soon.

### 4. Facebook group (a post, pinned for the week)

> We're back! 🎉 Vegans Explore launches on January 1, and we'd love for you to be one of our Founding Members. Membership is free.
>
> To say thank you, we made a free Holiday Guide: Vegan events, places to eat, recipes and gift ideas for Thanksgiving, Hanukkah and
> Christmas, with more holidays coming through 2027.
>
> Hear a quick note from Sean and open the guide: {link}
>
> If you like it, share it. Tag a friend who needs it this season.

### 5. WhatsApp (an announcement, short)

> Vegans Explore is back! 🌱 We launch January 1 and we'd love you as a Founding Member (it's free).
> Our thank-you: a free Holiday Guide with events, places to eat, recipes and gift ideas for the season.
> A quick note from Sean and the guide: {link}
> Share it with anyone who'd love it.

## The work, in order

| # | Task | Owner | Status |
|---|---|---|---|
| 1 | This plan, logged to the playbook | Logan | Done |
| 2 | Sean approves or edits the email, the voice note script and the three group posts | Sean | **Waiting on Sean** |
| 3 | Build `/hello` from `/invite`: words, still and play button, three buttons, Share, the bucket line, `noindex` | Logan | Next |
| 4 | Sean records the voice note (under a minute, phone is fine) and sends it | Sean | Waiting on 2 |
| 5 | Check the recording word for word (stt), put it on `/hello` | Logan | Waiting on 4 |
| 6 | Tracked links: one `/go/` per bucket and per group (campaign `holiday-launch-2026`) | Logan | Next |
| 7 | Clean the list: dedupe across sources, drop suppressions, do not disturb, hard bounced, cohort 1, dead domains (MX) | Logan | Next |
| 8 | Load the BrandDesk people campaigns, one per wave, members by bucket, drafts with the stopped sample person | Logan | Waiting on 2 and 7 |
| 9 | Send Sean a test of each bucket's email; proof `/hello` live at 1440 and 390 px beside `/invite` | Logan | Waiting on 3, 8 |
| 10 | Sean approves wave 1 in HQ (Outreach > Campaigns); it sends at 9 AM Eastern | Sean | Waiting on 9 |
| 11 | Sean posts Meetup (3), Facebook and WhatsApp with their tracked links (Depot > Outreach day view holds each, Copy and I sent it) | Sean | Waiting on 6 |
| 12 | Watch wave 1 bounces; release waves 2 and 3 (Wed, Thu) if under 5% | Logan | After 10 |
| 13 | Results view: opens, clicks, `/hello` visits, Founding Member sign-ups, Holiday Guide visits, by bucket (`/dashboard/leads`, campaign `holiday-launch-2026`) | Logan | After 10 |
| 14 | Follow-ups to those who join or engage (the welcome and orientation notes already run on joining) | Logan, Sean approves | Next week |

## Timing (Eastern)

- **By 7:45**: Sean answers task 2 (approve or edit the words).
- **By 8:30**: `/hello` live, links made, list cleaned, wave 1 loaded, tests in Sean's inbox; Sean records the note.
- **9:00**: Sean approves wave 1; group posts go up.
- **Wed and Thu 9:00**: waves 2 and 3 if wave 1's bounces are under 5%.
