# Vouch: lines to record and videos to re-make (2026-11-18)

Canon `canon-ve-vouch-everything` (Sean, 2026-11-18): every member ranking is one vouch per member with Undo, and the word is Vouch
everywhere. The site text was swept on 2026-11-18. A line with a recording must match it word for word, so these lines were **not**
changed: each still says "vote" until Sean records the new line, then the text and the file version change together.

## Part 1. Guide lines with a recording (8)

| # | Guide, part | Current text (recorded) | Recording | New line to record | New file |
|---|---|---|---|---|---|
| 1 | Welcome Guide (Liz), Overview tour, chapter 4 "Take part" (`guide-scripts/welcome-guide.js` CHAPTERS) | Vote for the places you love. Your favorites tell us who to spotlight next. (rest unchanged) | `vegan-media/media/liz/welcome-guide/tour-video-v2.mp4` (chapter 4, take v2a) | Vouch for the places you love, once each. Your favorites tell us who to spotlight next. (rest unchanged) | tour-video-v3 |
| 2 | Vegan Dairy Guide (Maya), Pulse, member (`sayMember`) | Start with the Pulse: every fact links to its source. Flip to Podcasts and interviews to watch, vote and save your favorites. | `vegan-media/media/maya/dairy-guide/dg-m-pulse.mp4?v=1` | Start with the Pulse: every fact links to its source. Flip to Podcasts and interviews to watch, vouch for and save your favorites. | dg-m-pulse ?v=2 |
| 3 | Vegan Dairy Guide (Maya), Brands, visitor (`say`) | Stop guessing in the dairy aisle. Here are the brands to buy, sorted by what you're replacing, and voted on by members. | `vegan-media/media/maya/dairy-guide/dg-brands.mp4?v=2` | Stop guessing in the dairy aisle. Here are the brands to buy, sorted by what you're replacing, and vouched for by members. | dg-brands ?v=3 |
| 4 | Vegan Dairy Guide (Maya), Brands, member | Pick what you're replacing and find the brands to buy, and where to buy them. Vote for the ones you love, and save them. | `vegan-media/media/maya/dairy-guide/dg-m-brands.mp4?v=1` | Pick what you're replacing and find the brands to buy, and where to buy them. Vouch for the ones you love, and save them. | dg-m-brands ?v=2 |
| 5 | Vegan Dairy Guide (Maya), Swaps, member | Every swap gives you a shelf option and a pantry option. Vote for the ones that work for you, and save them to My list. | `vegan-media/media/maya/dairy-guide/dg-m-swaps.mp4?v=1` | Every swap gives you a shelf option and a pantry option. Vouch for the ones that work for you, and save them to My list. | dg-m-swaps ?v=2 |
| 6 | Creator Guide (Kai), People doing it (`guide-scripts/creator-guide.js`) | These are creators and channels in our Directory. See how they show up, and vote for the ones you watch. | `vegan-media/voices/creator-guide/kai-tab-people-v1.mp3` | These are creators and channels in our Directory. See how they show up, and vouch for the ones you watch. | kai-tab-people-v2.mp3 |
| 7 | Nutrition Guide (Theo), Supplements, member (`guide-scripts/nutrition-guide.js`) | Here's what to look for before you buy, and the brands in our Directory. Members vote for the ones they trust. | `vegan-media/media/voices/nutrition-guide/theo-supplements-member-v1.mp3` | Here's what to look for before you buy, and the brands in our Directory. Members vouch for the ones they trust. | theo-supplements-member-v2.mp3 |
| 8 | Pre-Vegan Business Guide (Maya), Get found, member (`guide-scripts/pre-vegan-business-guide.js`) | Here's how people find you in our Directory. Places with plant-based options are vetted by member votes, and nobody can pay to move up. | `vegan-media/media/maya/pre-vegan-business-guide/found-v2.mp3` | Here's how people find you in our Directory. Places with plant-based options are vetted by member vouches, and nobody can pay to move up. | found-v3.mp3 |

The Dairy clips are Maya on camera (el-media voice, Wan 2.7), so lines 2 to 5 are new clips, not audio alone.

## Part 2. Narrated videos whose words say "vote" (8)

Each one's narration must be re-recorded with the new sentence, re-cut and its captions replaced (new `-vN`).

| Video | Where it plays | Sentence now | New sentence |
|---|---|---|---|
| `sec-directory-v2` (Liz) | Welcome Guide, Search and the Directory | ...and vote for your favorites every day. That is how places rise. | ...and vouch for your favorites, once each. That is how places rise. |
| `sec-city-v2` (Liz) | Welcome Guide, Your City | ...and the places members vote to the top. / ...and vote for your chapter. Do not see your city yet? Vote for where we should go next. | ...and the places members vouch for most. / ...and vouch for your chapter. Do not see your city yet? Vouch for where we should go next. |
| `sec-media-v2` (Liz) | Welcome Guide, Media | ...the podcasts, documentaries and books the community votes to the top. / ...vote for the shows, films and books you love... | ...the podcasts, documentaries and books the community vouches for most. / ...vouch for the shows, films and books you love... |
| `sec-founder-v1` (Liz) | Welcome Guide, Become a Founder | ...start simple: vote for three places you love, check in when you visit... | ...start simple: vouch for three places you love, check in when you visit... |
| `tour-video-v2` (Liz) | Welcome Guide Overview (/passport) | chapter 4, see Part 1 line 1 | see Part 1 line 1 |
| `home/launch-v4` | Homepage | ...all ranked by member votes. | ...all ranked by member vouches. |
| `home/next-v3` | /business (business-guide.html) | ...ranked by member votes. / As a member, you take part: vote for the places you love, check in... | ...ranked by member vouches. / As a member, you take part: vouch for the places you love, check in... |
| `home/next-taste-v1` | /guides/taste | ...ranked by member votes. / With a Passport, you take part: vote for the places you love... | ...ranked by member vouches. / vouch for the places you love... (this video also says "Get the rest with your Passport, $11", which no longer matches membership canon v12, free with a survey: rewrite that part in the same take) |
| `business/sample/v-tour-v3` | /business/tour (Green Leaf Kitchen demo) | The favorites row is ranked by what members vote for... / They vote for their favorite dishes once a day... / ...where members find you, vote for you, and check in... | ...ranked by what members vouch for... / They vouch for their favorite dishes, once each, and save the ones they want to come back for. / ...where members find you, vouch for you, and check in... |

## Part 3. Videos whose pictures show "Vote" (re-capture after the sweep is live)

The stills were captured before the rename, so the frames show Vote buttons and "Most voted" headings. Re-capture with the same
scripts once the site is live, then re-render:

- `sec-directory`: shots `vote`, `listing_vote` (`scripts/tour-video/sections/cap-directory.js`).
- `sec-city`: shots `most_voted` ("Most voted in", now "Most vouched for in") and `vote_chapter` (`cap-city.js`; the chapter cards belong to the `ve-chapters.js` sweep).
- `sec-media`: shots `saves_vote`, `media_top12` (`cap-media.js`).
- `tour-video-v2`: any of its 48 frames showing a Directory card or the listing hero (they read Vote).
- `business/sample/v-tour-v3`: shots with Vote on the demo site (`scripts/tour-video/v3/shots.json` lines 44, 98, 170; wait for the `business/site.html` sweep).
- `scripts/tour-video/build.py` (`m_vote` shots) if that older tour is still in use.
