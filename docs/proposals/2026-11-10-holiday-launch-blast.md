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

Built 2026-11-10 from `/invite` (the page Keya received): words on the left, Sean's picture on the right with a play button for his voice
note under it (a still, not a video; nothing plays until pressed). Buttons: **Become a Founding Member, free** (the Explorer survey; members
get Go to your dashboard), **Open the free Holiday Guide**, **Take the Welcome tour**, Share; the Meetup page adds **Help us organize events**
(the Group leader path on `/paths`, `#path-group`: it is still Coming with Notify me, `guide-waitlist-group-leader`, so a sign-up there is a
waitlist, not a registration yet). `noindex`. Each bucket's link is `/go/<code>` to `/hello?b=<bucket>`.

**Voice notes, one per page** (Sean, 2026-11-10: "it may not be one size fits all"; Sean's Higgsfield voice; ThanksLiving, the brand):

General (email, members, business, nonprofit, creator, Foodie Fest, explore). **Approved and recorded** (`vegan-media/media/hello/sean-general-v2.mp3`, Sean's Higgsfield voice; checked word for word with stt, and ThanksLiving checked on its own since the full transcript autocorrects it; v1 said Thanksgiving and is not used):
> Hey, it's Sean. Vegans Explore is back, and I'm excited. On January 1 we launch, and I'd love for you to be one of our Founding Members.
> Membership is free: take a short survey and you're in. If you run a business, claiming your listing is free too. Before you go, take a
> minute with our Welcome Guide and see everything we're building. And as a thank-you, we made a free Holiday Guide. It's a mini website for
> our community this season, with events, restaurant holiday menus, gift ideas and recipes for ThanksLiving, Hanukkah and Christmas. Through 2027 we'll
> cover the other holidays too. Check it out, and if you like it, share it. See you inside.

Meetup (**draft, waiting for Sean**):
> Hey, it's Sean. Thanks for being part of our Meetup. Vegans Explore is back, and on January 1 we launch. I'd love for you to be one of our
> Founding Members, and it's free. Don't worry about events: we're bringing you a bunch of new ones, especially as we move into the new year,
> and we're looking for people to help organize them. If that's you, tap Help us organize events and let us know. And as a thank-you, we made
> a free Holiday Guide, with events, restaurant holiday menus, gift ideas and recipes for ThanksLiving, Hanukkah and Christmas. See you soon.

Facebook (**draft, waiting for Sean**):
> Hey, it's Sean. We're back! Vegans Explore launches on January 1, and I'd love for everyone in our group to be a Founding Member. It's
> free. To say thank you, we made a free Holiday Guide, a gift for everybody: events, restaurant holiday menus, gift ideas and recipes for ThanksLiving,
> Hanukkah and Christmas, with more holidays coming through 2027. Take a look, and if you like it, share it with a friend. See you inside.

WhatsApp (**draft, waiting for Sean**):
> Hey, it's Sean. We've moved our community onto our own platform. We'll still post notes on WhatsApp now and then, but if you want to stay
> locked in with all the events, see the Directory of Vegan businesses and connect with our growing community, now's your chance, in time for
> our January 1 launch. Membership is free. And as a thank-you, there's a free Holiday Guide for ThanksLiving, Hanukkah and Christmas waiting
> for you. See you inside.

Until a page's own note is recorded, that page plays the general note, and the words on the left are the general note's (they always match
the recording); the page's own line sits above them.

### 3. Meetup (v2, Sean's notes 2026-11-10 8:10 AM: gift ideas before recipes; no hosting ask in the post, it lives on the Meetup page)

> Hi everyone, it's Sean. Vegans Explore is back! We launch on January 1, and I'd love for every member of this group to be a Founding
> Member. It's free. And not to worry about events: we're bringing you a bunch of new ones, especially as we move into the new year.
> As a thank-you, we made a free Holiday Guide for the season, with events, restaurant holiday menus, gift ideas and recipes for ThanksLiving,
> Hanukkah and Christmas. Here's a quick note on how to get started and to open the Holiday Guide: {link}
> If you like it, share it with a friend. See you soon.

The Meetup page (`/hello?b=meetup`) asks "Do you want to lead events with us?" with its own button and its own voice note (recorded v1).

### 4. Facebook group (v2: "today", gift ideas before recipes, "a quick note on how to get started")

> We're back! 🎉 Vegans Explore launches on January 1, and we'd love for you to be one of our Founding Members today. Membership is free.
>
> To say thank you, we made a free Holiday Guide, a gift for everybody: Vegan events, restaurant holiday menus, gift ideas and recipes for
> ThanksLiving, Hanukkah and Christmas, with more holidays coming through 2027.
>
> Here's a quick note on how to get started and to open the Holiday Guide: {link}
>
> If you like it, share it. Tag a friend who needs it this season.

### 5. WhatsApp (v2: shorter, about the Holiday Guide)

> Vegans Explore is back, and we've moved into a brand new community on our own platform. 🌱 To celebrate, we made a free Holiday
> Guide: Vegan events, restaurant holiday menus, gift ideas and recipes for ThanksLiving, Hanukkah and Christmas.
> Tap below to claim it and learn more about this exciting new chapter: {link}

### 6. Instagram DM (cheat sheet, copy and paste; not salesy)

> Hey {first name}! Hope your week's going well. We just put together a free Holiday Guide for the Vegan community: events, places to
> eat, gift ideas and recipes for ThanksLiving, Hanukkah and Christmas. Thought of you. Want me to send you the link?

(When they say yes, send their personal tracked link.)

### 7. Instagram post line (comment-to-get-it; Sean answers by hand until ManyChat)

> Want our free Holiday Guide? Comment HOLIDAY (or DM us HOLIDAY) and we'll send you the link. 🎁

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
