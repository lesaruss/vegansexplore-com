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

**Narrator: Liz hosts**, since she is already the first Guide every new member meets. The other Guides each appear on the page about their area, in the video and as pictures. This changes the locked "whole cast, one Guide a tab" setup from 2026-11-01, so it needs your OK. If you don't say otherwise, Liz is the default.

## Structure

The Overview is the video tour, then Start here, then five groups:

1. **Why you're here.** The story: ten years of listening, the community steers it from here, and what founders get on January 1.
2. **Find your way.** Search, the Directory, your city and the Daily Pulse, Events, Guides.
3. **Take part.** Vote, save, check in, bounties, points and levels, bring a friend.
4. **Make it better.** This is the through-line page:
   - the Feedback button on every page
   - Talk to your Guide
   - Ask a person
   - search for something we don't have and it goes to our team
   - tell us a place to add
   - tell a story for the podcast
5. **For the animals.** Nonprofits, rescues, sanctuaries and the campaigns we are building toward.

The last page is **Become a Founder**:
- the Explorer survey, started right there, with the countdown to midnight Eastern, January 1, 2027
- then **Your first steps**: the paths page (step 4, which I'd build alongside this), the three things to do this week, and where to ask

## The survey

I'd keep it as it is: nine questions, 250 points, three required. "What would make it worth it for you?" and "What's one of the toughest things?" already fit "tell us what's working". One change: rename "How do you want to hear from us?" to **"How should we reach you with founder news?"** That makes it the founder list.

## Draft script

This is the video tour, one chapter per page. Liz speaks, in your voice. It is a text draft and nothing gets recorded until you approve it.

1. **Welcome.** "Hi, I'm Liz. Welcome to Vegans Explore. In the next few minutes I'll show you around, and by the end you'll know exactly where everything is, what to do first, and how to reach us."
2. **Why you're here.** "Vegans Explore comes from more than ten years inside this community: activism, events, content, running a business, and hundreds of long conversations with business owners about what they needed. Now we can finally build it. But we can't get it right without you."
3. **Find your way.** "Search for anything and it shows up. The Directory has places to eat and shop, people, groups and nonprofits, city by city. Your city has its own Daily Pulse, its boards and its events. And our Guides each walk you through one topic."
4. **Take part.** "Vote for the places you love. Your votes tell us who to spotlight next. Check in when you visit, take on bounties, earn points and give them to the places and causes you care about."
5. **Make it better.** "This is the part that matters most. Use it in your day to day, and tell us what's working, what isn't, and what you wish you could do. Every page has a Feedback button. Ask your Guide, or ask a person on our team. Search for something we don't have yet, and it goes to our team. We read all of it, and we build from it every day."
6. **For the animals.** "Here's where it's all going. With a network of businesses, people and nonprofits that actually show up, we can run campaigns that move the needle for the animals, the reason we're all here."
7. **Become a Founder.** "Right now you're early, and that's rare. Answer a few quick questions, about two minutes, and you're in, free, with 250 points. Join before midnight on January first and you're a Founding Member for good. Founders unlock some really cool things in 2027, and you'll hear about them first."

## The Explorer bridge as a shared piece

Today the survey only runs on its own page. I'd make it one shared component (`public/ve-guide-survey.js` already draws it), so any Guide can end on the same card: **Become a member, free: Take Explorer (about 2 minutes, 250 points)**. Someone who is already an Explorer sees "You're an Explorer" and that Guide's next step instead. The Welcome Guide uses it first and the path Guides use it next (step 5).

## Build order (after you approve)

0. Point the footer's ABOUT, `/about` and `/welcome` at the Welcome Guide.
1. Rebuild `/passport` on the Holiday Guide shell with these pages and Liz's lines as text. Screenshot it beside the Holiday Guide at 1440 and 390 px before it ships.
2. Build the paths page (step 4, already approved) as the survey's landing.
3. Record Liz's seven chapters in her profile voice and check each one word for word with stt.
4. Make the tour video (the v3 pipeline: script, recordings, lookbook in Depot > Guides and tours, then the edit).
5. Rename the "hear from us" question, and set up the founder list.
