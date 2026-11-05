# Liz's full script: The Vegan Restaurant Guide (playbook `ve-restaurant-guide`, standard `ve-audio-accessibility`)

Written by Logan 2026-11-04 for Sean to read and approve. Nothing here is recorded. Marked NEW or CHANGED where it differs from what is on the screen today
(the screen text in the Guide is NOT yet changed to match the CHANGED lines; approve first, then I match both).
Recorded with Vegan spelled "Veegan". Each line is about 20 seconds or less. Before the survey a visitor hears 1 to 4; after it, the rest.

## Before the survey (visitor, on their personal link)

**1. Overview** (CHANGED: your welcome and the why first)
"Hi, I'm Liz, and welcome to the Vegans Explore Restaurant Guide. Thank you for what you do. This Guide does three things. It gives you a crash course in how Vegans Explore works. It shows you something new about your business. And it puts you one step closer to growing with us as we launch on January 1st. Here's how to start. Step one: tap Run my free check, and see how your place looks online. Step two: take the short survey. That makes you a member, and the rest of this Guide opens: the top challenges owners face, your page, your dashboard, and what's coming. It's free, no card, and you can stop any time."

**2. Your business (the audit)** (CHANGED: it already ran for them)
"This is your restaurant, and we've already checked it. We looked at your Google listing, your website, how you show up in search, and your social. Here's what we found, and the first things to work on. It's free, and this check is just for you."

**3. What to expect** (NEW, longer than today's)
"Here's what opens when you're in. The top challenges: the things Vegan business owners run into, so you can tick the ones that sound like you. Your page: it already exists, and you can claim it. Your dashboard: how many people look at your page. Our interviews with other owners. And the campaigns and events that bring people to your door. Some of this is live now and some is coming, and each one tells you which. When you're ready, take the short survey."

**4. Get in** (unchanged text, already recorded)
"There is one way in, and it is free. Take the short survey. When you finish, you are a member."

## After the survey (member)

**5. Overview, member** (approved, with your edit)
> "Welcome in. Thank you for joining. Your business is the place to start. Then the top challenges, your page, your dashboard, and what's coming. Everything you save goes in My list, so you can pick up where you left off."

**6. Top challenges** (renamed from "The fixes"; your wording)
> "These are the top ten things Vegan businesses run into. This isn't a review of your restaurant. It's a checklist of the most common ones. Tick the ones you relate to, and you'll see which come up most for owners. Open any one to see what to do this week."

**7. Pulse** (unchanged text; the member line below is already recorded as a clip)
"Every business interview we've recorded is here, with the research. Play any of them right here. We keep adding more."

**7b. (NEW tab) Your dashboard**
> "This is your dashboard. It shows how many people look at your page, where they come from, and what they do next. It opens fully once you claim your page."

**8. Claim your page** (CHANGED: their own page is shown)
"This is your page, just as members see it. It's already in the Directory. Click around. When you claim it, it's yours: your hours, your photos and your menu link, changed whenever you like."

**9. Try the demo** (CHANGED: a how-to tour in a full-screen pop-out)
"This is Green Leaf Kitchen, a sample restaurant, so you can look around without touching anything real. Pick a step and it opens full screen: the page as visitors see it, your dashboard, your Insights, your page, your menu, your ads and opportunities, and your audit. Close it whenever you're done. Yours starts with your own page."

**10. Promotions** (unchanged)
"These are the promotions open to you, from events to features to campaigns. Pick what fits, or ask our team to plan it with you."

**11. My list** (unchanged)
"Everything you saved is right here: top challenges, interviews and promotions, so you can pick up where you left off."

**12. What's next** (unchanged)
"You are in. Thank you. Here is what you can do next. Claim your page, open your dashboard, and follow us so we can follow you back."

## What the screens say beside Liz (so you see all of it)
- **No personal link:** "This Guide is by invitation. We build it around one restaurant at a time, so your check is yours alone. If we sent you an email, open the link in it and your restaurant is already here." Button: Ask for an invitation.
- **The Top challenges screen:** "The top 10 things Vegan businesses run into. This is not a review of your business. It is a checklist of the most common challenges. Tick the ones you relate to. The ranking comes from everyone who uses this Guide."
- **Demo steps:** your page as visitors see it; your dashboard; Insights; your page; menu; ads and opportunities; your audit.

## Recorded 2026-11-04 (Sean approved the script; playbook `ve-restaurant-guide`)
Liz's roster-profile voice `IUMUPi350HfIhyzUBJB3`, `eleven_multilingual_v2`, Vegan spelled "Veegan", el-media `tts` called from the database (pg_net),
each checked word for word with el-media `stt` (differences: punctuation, "guide" lowercase, "stop anytime", "Greenleaf"). In `vegan-media/media/liz/restaurant-guide/`:
`door-overview-v2` (1), `door-audit-v2` (2), `door-expect-v1` (3), `door-overview-member-v1` (5), `door-fixes-v1` (6), `door-dashboard-v1` (7b),
`door-featured-v2` (8), `door-demo-v2` (9). A changed line is a new version, so the four that replace older clips are `-v2`; the old `-v1` files stay.
Wired in `AUDIO_V` (visitor: overview, audit, expect, join) and `AUDIO_M` (member: overview, fixes, dashboard, featured, demo, next) in the Guide script,
with each tab's `say` set to the script text. Later the same day: `door-pulse-v1` (7), `door-promos-v1` (10) and `door-mylist-v1` (11), checked the same way (My list: "Everything you saved is right here. Top challenges, interviews, and promotions..." is punctuation only). Every tab now has a recording.

---

# River's script, Guide 2: The Vegan Events Guide (playbook `ve-audio-accessibility`, Guide `ve-events-guide`)

**Voice corrected 2026-11-05 (Sean): River reads it.** The standard is a Guide on every page, voiced by that page's own Guide, not Liz everywhere. River leads the
Events Guide, so these are his lines, guiding the host through it. This version is his voice over a still picture of him, changing from tab to tab, his outfit
mixed up to fit the tab (a rain poncho on Day of, an apron on Vendors). Animation and B-roll come later.

**Approved by Sean 2026-11-05 as V1** ("this is good for a V1"), with three changes: Gear invites suggestions, Vendors (like Venue) invites adding one, and The word says flyer or link. Sean: "we want all of these guides to be intakes as well. Every time somebody suggests something, that builds our directory." Drafted by Logan 2026-11-04. Why this Guide next: it is the other door Guide (free with
its event survey, launched 2026-11-03), so it carries the same funnel as the Restaurant Guide and has the most silent tabs of any live Guide.
Each line is written from what the screen shows today (checked against `guide-scripts/vegan-events-guide.js`). Vegan is spelled "Veegan" only at recording time.
No counts of chapters, no promised survey length (the Restaurant Guide rule), no points amounts. Under 20 seconds each. A changed line is a new `-v2`.

## Visitor (not yet a member): what is open, what opens with the survey

**1. Overview** (CHANGED: was River's one line)
"Hey, I'm River. This is the Vegan Events Guide, for anyone hosting a Vegan event: a potluck, a market, a festival, a dinner. Some of it is open to everyone right now: the break-even worksheet, venues and vendors near you, the gear list, and what to do when it rains. The rest opens when you take the short event survey. It's free, it earns you points, and it makes you a member."

**2. Kinds** (CHANGED)
"A potluck, a market, a festival, a dinner. Each kind costs differently, grows differently, and goes wrong in its own way. You can see every kind here. What each one costs and what usually goes wrong opens with the survey."

**3. The plan** (CHANGED)
"The plan counts down from twelve weeks before your event to the day after, so nothing important gets left to the last minute. The full checklist, to tick off, copy and print, opens with the survey."

**4. Money** (CHANGED)
"Before you set a ticket price, work out where your event breaks even. The worksheet is open for you now, and your numbers stay on this device. If you sell tickets through a Group Partner, we take five percent on paid tickets and nothing on free events. The full budget and pricing guide opens with the survey."

**5. Venue** (CHANGED)
"Here are event venues from our Directory, and the places where Vegan events were held this year. Pick your chapter to see yours. Know a venue we're missing? Add it, and it helps every host after you. What to ask before you sign opens with the survey."

**6. Vendors** (CHANGED)
"Vegan vendors, food trucks and caterers in your chapter. Pick your chapter to see them. Know one we're missing? Add it, and it helps every host after you. How to choose them and what to put in writing opens with the survey."

**7. Gear** (CHANGED, same for members)
"Everything you'd pack for an event, from canopy weights to a card reader. Tap any item to shop for it. Pack something that isn't on the list? Suggest it, and it helps every host after you."

**8. The word** (CHANGED)
"Start by putting your event on our calendar. Drop in your flyer or a link, and we'll read it for you. You can also suggest it to your chapter's Daily Pulse. The timeline of when to post and what to say opens with the survey."

**9. Day of** (CHANGED)
"What to do when it rains is open to everyone, along with the other things that can turn your day. The hour-by-hour run of show, your helpers' jobs and the door open with the survey."

**10. After** (CHANGED)
"The day after is when your next event gets made: the thank yous, the recap, the numbers to write down, and a few questions for your guests. It opens with the survey."

**11. Elephants** (CHANGED)
"The things hosts worry about and rarely say out loud: no-shows, vendors losing money, a venue that isn't Vegan. Each one comes with what to do. They open when you take the survey."

**12. Hosts** (CHANGED)
"Hosts who've done it, on our shows. Play any episode right here. And if you've hosted an event, you can tell us your story by voice, and the best become Host Notes on the Vegans Explore Podcast. Recording opens once you're a member."

**13. Claim** (CHANGED)
"Claim what's yours: your event on our calendar, your group or venue in the Directory, and your own profile. The steps open when you take the survey."

**14. Work with us** (CHANGED)
"We can sponsor your event, in marketing, never cash. You give us a little space at your event, and we put our community and our channels behind it. Every application starts with the free event survey, and we review them against each other, so it's never automatic."

**15. Get access** (CHANGED: matches the screen, which offers both ways)
"There are two ways through, and both make you a Vegans Explore member. Take the free event survey, with points for every answer, or get the eleven dollar Passport. What to do when it rains stays open to everyone either way."

## Member (after the survey or the $11): walking through what they have

Mostly River's existing member lines, kept word for word where they are true; only the contractions are spoken.

**1. Overview** (CHANGED)
"Welcome in. The whole Guide is yours. Start with the plan, work through each tab as your date gets closer, and come back before every event. Everything you save goes in My list."

**2. Kinds** (existing)
"Pick the kind of event you're planning. Each one tells you what it costs, how big it gets, and what usually goes wrong."

**3. The plan** (existing)
"Tick things off as you go. It saves on this device, and you can copy it or print it for your team."

**4. Money** (existing)
"Your costs, your income, and how to set a price. Run the worksheet before you set a ticket price."

**5. Venue** (existing)
"Find a venue near you, then take the questions with you when you visit. Watch for the red flags. Know one we're missing? Add it."

**6. Vendors** (existing)
"Find vendors here, use the application questions, and put the agreement in writing. Know one we're missing? Add it."

**7. Gear:** same line as the visitor's.

**8. The word** (existing)
"Follow the timeline, use every channel on the list, and put your event on our calendar first."

**9. Day of** (existing)
"The run of show, who does what, the door and safety. And what to do when it rains."

**10. After** (existing)
"Thank everyone, post the recap, write down the numbers, and set the next date."

**11. Elephants** (existing)
"Every one of these has happened to someone. Read them before your next event, not after."

**12. Hosts** (existing)
"Hear from hosts who've done it, and tell us your own story. Approved stories earn you points."

**13. Claim** (existing)
"Claim what's yours: the event on our calendar, your group or venue in the Directory, and your own profile. Then apply for a sponsorship."

**14. Work with us** (CHANGED)
"Here's what a sponsorship from us looks like. If your event qualifies, apply right here. Every application is reviewed against the others, so apply early."

**15. My list** (existing)
"Everything you saved is here: sections, venues, vendors and episodes."

## Four things for Sean to decide (my defaults, used unless you say otherwise)

1. **Whose voice. DECIDED 2026-11-05 (Sean): River**, the Events Guide's own Guide, over a still picture of him that changes by tab, outfits mixed up.
2. **Money on the first visit.** Get access (visitor 15) says "eleven dollar Passport" because that screen does. The Restaurant Guide keeps money talk out of the first
   visit. Default: keep it on Get access only, since the screen says it and a line that left it out would not match.
3. **Gear.** Every item is a tracked Amazon link with our tag. Default: no disclosure line in the recording; a short on-screen "we may earn a small commission" is the
   place for it, which I would add to the page separately.
4. **Order.** After the Events Guide: Creator, Nonprofit, Nutrition, Stadium and Arena, Airport, Theme Park, Dairy (already has Maya's clips), Supermarket, then the main pages.

## Recording plan once approved
River's roster-profile voice `btaSeNTVh1pGx4pjFzub` (read it from his HQ roster profile before recording), `eleven_multilingual_v2`, Vegan spelled "Veegan", el-media `tts`
from the database (pg_net, token read inside SQL), two at a time, each checked word for word with `stt`; files `vegan-media/media/river/events-guide/door-<tab>-v1.mp3`
(visitor) and `door-<tab>-member-v1.mp3` where a member line differs;
wire as `AUDIO_V` and `AUDIO_M` like the Restaurant Guide, each tab's on-screen text set equal to its line (or a short `show` line). Nothing autoplays.

**Still pictures (this version):** one still of River per tab, in our illustration style from his current art (short twists with a fade), his outfit fitting the tab,
no other brand's logos, every finger in frame, his face never covered. Made in Higgsfield (`nano_banana_pro`, about 2 credits each, about 30 credits for 15 tabs),
shown to Sean before they go in, stored at 960 px in `vegan-media/media/river/events-guide/still-<tab>.jpg`.
