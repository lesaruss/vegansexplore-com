# ve-explorer-path: one Explorer Guide (the Welcome and the Explorer survey together)

Draft for Sean, 2026-11-08. Logan. Nothing built yet. Playbook `ve-explorer-path`.

## What is live today (the audit)

There are two separate pieces with nothing tying them together:

1. **The Welcome** (`/passport`). Nine tabs, a different Guide on each one (Pascal, River, Maya, Theo, Dani, Kai, Liz, Nori). It is a feature list: the Directory, your city, Guides, points, what it supports, bring people in, for businesses, then Enter the room. It is the old Passport Guide shell, not the Holiday Guide shell.
2. **The Explorer survey** (`/survey?s=explorer`). Nine questions and 250 points. Three are required (journey, chapter, "Do you run any of these?"). Finishing makes you a member right away.

What is missing or wrong:

- **There is no through-line.** Nothing says why this exists (ten years of listening), that members shape it, or that founders unlock something on January 1. It reads like a brochure.
- **"How do I ask a question?" is never answered.** Feedback, Talk to <Guide>, Ask a person and the search queue all exist, and the Welcome never mentions them.
- **It does not end anywhere.** You finish the survey and get a done screen. The paths page (step 4, approved) is not built, so a new member is not told what to do first.
- **It is the old shell.** It has no video tour, no Start here, no groups with picture pills and no single narrator. Eight Guides taking turns makes it feel scattered.
- **None of the Guides' lines are recorded.** They are text only, so the "A Guide speaks on every page" standard is not met.
- **Founders have no channel yet.** "We'll announce it to founders" needs a list. Today we only have the survey's "How do you want to hear from us?" answer. Pulse subscribe is built but switched off.

## Recommendation (revised after Sean, 2026-11-08)

Sean: "the Explorer survey could live on its own on other guides as that bridge between them getting the information and becoming a member... the welcome guide also serves as our about us page... all these guides serve as a doorway, either a paid or free doorway into our community."

- **The Explorer survey stands on its own.** It is the bridge at the end of any Guide: you get the information, then you take Explorer and you're a member. The Welcome Guide is the first Guide to end on it. Each path Guide offers it inline (step 5), and so can any other Guide as its free doorway. One survey, one component, no copies.
- **The Welcome Guide is our About us.** It is the "about" section of a normal website, packaged as a mini website. It keeps the name Welcome Guide and stays at `/passport`.
  - Today there is a third piece: the footer's ABOUT, `/about` and Start Your Journey's sibling `/welcome` open the old guided tour (`welcome.html`). They should all open the Welcome Guide, and `welcome.html` becomes a redirect (kept in git history).
- **Guides are the doorway system.** A Guide is a section of a website packaged as a mini website. There can be any number of them, and every one is a doorway into the community: free (through a survey) or paid ($11 or points). The Welcome Guide is the front door, and it is the free one.
- It is built on the **Holiday Guide template**:
  - an Overview video tour, chaptered, where each chapter is also that page's "Summarize this page"
  - Start here
  - groups as headings with picture pills
  - one narrator
  - Play and Talk on one row

**Narrator: Liz hosts (approved by Sean 2026-11-08).** The other Guides each appear on the page about their area, in the video and as pictures. This replaces the "whole cast, one Guide a tab" setup from 2026-11-01.

## The survey

I'd keep it as it is: nine questions, 250 points, three required. "What would make it worth it for you?" and "What's one of the toughest things?" already fit "tell us what's working". One change: rename "How do you want to hear from us?" to **"How should we reach you with founder news?"** That makes it the founder list.


## Structure (v3, Sean 2026-11-08)

Sean: "they can learn everything they need to know off of the overview page... this video... each of these sections... dives a little bit deeper... they don't have to review those. So each of those pages should have their own video."

- **The Overview is complete on its own.** Its video is enough to start, and it ends on a choice: take the survey now, or keep exploring.
- **Every section goes deeper, and every section is optional.** Each is one of the site's main areas. Each page has its own video (Liz, plus the Guide for that area, about 60 to 90 seconds), then **What it is**, **How to use it today**, and **What members get**.
- **Every page ends on the same Explorer card**, so they can join from any section.

The sections below are checked against what is live today:

1. **Search and the Directory.**
   - What it is: one box finds anything, and the Directory holds places to eat and shop, people, groups, media and nonprofits, city by city.
   - How to use it: search, pick your chapter, filter, open a listing, and Share any view.
   - What members get: vote once a day, save, check in (10 points a visit), and see the places still being vetted.
2. **Your city.**
   - What it is: your chapter's hub, its Daily Pulse, and the boards (Jobs, Classifieds, Fosters, Rescues).
   - What members get: comment, post, and join any chapter.
3. **Events.**
   - What it is: Vegan events everywhere, filtered by place and kind.
   - What members get: RSVP, members-only tickets, and submitting an event.
4. **Media.**
   - What it is: our shows, plus the top 12 podcasts, documentaries and books as voted by members. You listen right on the page.
   - What members get: vote and save episodes.
5. **Guides.**
   - What it is: every Guide, sorted by interest. This page is the Guides catalog itself.
   - Guides for your work are free with a short survey. Topic Guides are $11 or 1,100 points.
6. **Points and levels.**
   - How you earn: the survey (250), check-ins (10), bounties, a friend joining with your link (111), and answering your profile.
   - What points do: open a topic Guide (1,100), ask your Guide directly (4 a message), give a boost to a place or cause, and bid in the Vault where it is open (South Florida pilot).
   - Levels 1 to 4 come from lifetime points (2,500, 10,000, 25,000). Spending never lowers your level.
7. **Your path and badges.**
   - Explorer is everyone's first badge.
   - Each path (restaurant, event host, creator, nonprofit, business) has its own Guide, short survey and badge.
   - Ambassador is by invitation. This section leads to the paths page.
8. **Make it better.** This is the through-line:
   - the Feedback button on every page
   - Talk to your Guide (its saved answers are free)
   - Ask a person
   - a search with no answer goes to our team
   - suggest a place
   - tell a story for the podcast
9. **For the animals.** Nonprofits, rescues and sanctuaries, the Fosters and Rescues boards, and the campaigns we are building toward.
10. **Become a Founder.** The Explorer survey with the countdown, then your first steps: your paths, three things to do this week, and where to ask.

The section videos come after the Overview video is approved. I'll write each one from these outlines and send them in one batch.

## Overview video script (v3, Sean's notes 2026-11-08)

1. **Welcome.** "Hi, I'm Liz. Maybe you want to eat out without guessing, find your people, or do more for the animals than you are right now. Wherever you're starting from, this Guide is how you get there. You'll start out just looking around, and you'll finish knowing your city, your community, and exactly where you fit in. Let's go."
2. **Why listen to us.** "Why listen to us? We've spent more than ten years inside this community: activism, events, content, running businesses, and hundreds of long conversations about what people needed. Now we can finally build it, and we can't get it right without you."
3. **Find your way.** "Search for anything and it shows up. The Directory has places to eat and shop, people, groups and nonprofits, city by city. Your city has its own Daily Pulse, its boards and its events. And our Guides each walk you through one topic."
4. **Take part.** "Vote for the places you love. Your favorites tell us who to spotlight next. Check in when you visit and take on bounties to earn points. Spend them to open Guides and ask your Guide anything, or give them to the places and causes you care about. And points keep getting more valuable: giveaways, special opportunities and discounts are on the way, and the local businesses and nonprofits you give them to will be able to use them for promotion through us."
5. **Your path.** "Everyone starts as an Explorer. Run a restaurant, host events, make content or work with a nonprofit? Each one has its own path, its own Guide and its own badge."
6. **Make it better.** "This is the part that matters most. Use it in your day to day, and tell us what's working, what isn't, and what you wish you could do. Every page has a Feedback button. Ask your Guide, or ask a person on our team. Search for something we don't have yet, and it goes to our team. We read all of it, and we build from it every day. We're real people, supported by technology that finally lets us carry out a vision we've been working on since 2016."
7. **For the animals.** "Here's where it's all going. With a network of businesses, people and nonprofits that actually show up, we can run campaigns that move the needle for the animals, the reason we're all here."
8. **Become a Founder.** "Right now you're early, and that's rare. If you feel you know enough, take the survey and get started right away. It's a few quick questions, about two minutes, and you're in, free, with 250 points to use across the platform. Want to take your time? Each section of this Guide breaks down exactly how to use it today. Either way, join before midnight on January first and you're a Founding Member for good. Founders unlock some really cool things in 2027, and the only way to hear about them, and lock them in for yourself, is to join today."

## The Explorer bridge as a shared piece

There should be one shared card that any Guide can end on: **Become a member, free: take Explorer (about 2 minutes, 250 points)**. Someone who is already an Explorer sees that Guide's next step instead.

## Build order (after you approve)

0. Point the footer's ABOUT, `/about` and `/welcome` at the Welcome Guide.
1. Rebuild `/passport` on the Holiday Guide shell: the Overview, the ten section pages with their text and Liz's lines as text, and the Explorer card on every page. Screenshot it beside the Holiday Guide at 1440 and 390 px.
2. Build the paths page (step 4, approved) as the survey's landing.
3. Record the Overview's eight chapters and make its video (script, recordings, lookbook, edit).
4. Write, record and make the section videos.
5. Rename the "hear from us" question and set up the founder list.
