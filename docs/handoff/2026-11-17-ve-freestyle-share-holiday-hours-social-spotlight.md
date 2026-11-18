# Handoff 2026-11-17: Share on phones, holiday hours, the Social tab is theirs, Spotlight (freestyle, closed)

Logan, one chat. Everything below is on `main` and live. No branch holds unmerged work.

## What shipped

1. **Share on phones** (Sean: "I can't even copy a link on the web app"). `public/nav.js`: the Share icon shows in the phone top bar (the
   new header had hidden it under 700 px). Sean confirmed it on his phone.
2. **Pull to refresh in the home-screen app** (Sean: "I find myself having to close out the whole website just to see new updates").
   `public/ve-app-shell.js` v8, standalone mode only. main 6e36e59.
3. **Inbox swept.** Replies from Earthy Picks, Next Level (Carrie), Sen Saigon handled live; Sean sent the replies. Tracked claim links:
   `/go/claim-rawchefcarla`, `/go/claim-earthypicks`, `/go/claim-sensaigon` (campaign `ve-claims-onboarding`). Earthy Picks' winter soup
   on their menu. An Nguyễn Hawks (Sen Saigon) got a warmer note: Sean wants her as an early New York partner in 2027, no call pushed.
4. **Ideas 111726** (Drive): The Green Table Wesley Chapel (new listing) and its Game Night, ART BASIL at Aguacate, My Hungry Vegan's
   Brunch @ Night, Seasoned Green (taken off hold; Sean: "a food truck serving Central Florida") and its ThanksLiving menu. Left out, nothing
   confirmable: the Austin Vegan Holiday Market (no date), the Healthful Living Ocean Retreat. Love Life Cafe's Thanksgiving package (Sean's
   PDF) is live in the Holiday Guide.
5. **Holiday hours** (Sean's idea, then "Let's build the holiday hours feature now", then "It's all mushed together... set it up just like the
   other one... one of those little toggle things"). `ve_holiday_hours` (days per answer), `ve_holidays.asks_hours`; the business dashboard
   asks each holiday in the next 21 days (food listings) under Needs you, Answer opens `?tab=home&pd=holiday-<slug>` (Staying the same, or
   day and hours rows); the listing page has one Hours section with Regular hours / Holiday hours. `ve-holiday` v15. Sen Saigon and Vegan
   International set by the team. Sean: "Okay, that looks good."
6. **The Social tab is theirs** (Sean on Love Life: "It's a lot of us on there... Maybe we should just be focusing on new campaigns"; "go").
   Their posts first; Featured on Vegans Explore at most three, last 12 months, no roundups (three other tags at most). About 42 listings keep
   a feature, from 253 tabs. Sean: "I feel good about that."
7. **Spotlight** (Sean: "as simple as them putting the URL in there... a 3 column on the page or a 2 column"). `listings.spotlight_posts`,
   `ve-listing-posts` v6 `owner_spotlight`; Edit your page > Social opens with the Spotlight box and good picks; the Social tab shows the
   posts themselves, three, two or one across.

## Not proven yet (waits on Sean)

- Holiday hours and Spotlight signed in as a real owner (both tested against mocked owners in a browser).
- Spotlight's Instagram and TikTok embeds drawing (this build session cannot reach Instagram).
- Sean's test: Edit your page > Social on a page he owns (the Vegans Explore Podcast), paste a post link, open its Social tab on his phone.

## Parked

- An email nudge to owners who have not answered holiday hours.
- Sen Saigon as an early New York partner (2027): wait for An's reply.

## Records

Migrations `20261117_*.sql` (holiday hours, days, Ideas 111726, Seasoned Green, Love Life, Earthy Picks soup, spotlight, the wrap).
History: `docs/history/interface.md`, `guides-holiday.md`, `social.md`. Depot > Ideas b00dc2ee done.
