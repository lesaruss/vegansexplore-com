# The creator kit (Sean, 2026-11-10)

"This will be the kit for everybody moving forward that becomes a content creator." First built for Keya (VeganKween, Philadelphia).
It lives in the creator's dashboard (mock: `/mocks/creator-dashboard`, slide 7, the asset folder) once the dashboard is built.

## What every official creator gets

| # | Piece | What it is | Keya (first one) |
|---|---|---|---|
| 1 | GeekFon avatar | Square head-and-shoulders portrait in the GeekFon style (canon `canon-geekfon-character-sheets`), from a real photo of them, no lanyards or text; becomes their profile picture | `vegan-media/media/people/keya-vegankween/avatar-geekfon-v1.jpg`, live on her profile |
| 2 | Full-body avatar | The same character head to shoes on white, for 9:16 spots | Higgsfield job bd6c2f8d (crop tighter before use) |
| 3 | The creator badge | Registered creator stamp on their profile picture, Directory cards and their city's team section | Live |
| 4 | Their link | `vegansexplore.com/go/<code>`: counts every click and credits every sign-up to them (it carries `?ref=<their referral code>`); 111 points per friend who joins | `/go/keya` (ref VE-NJVJ1P) |
| 5 | Story template (9:16) | Them in their city, waving, open sky on top for "I'm an official Vegans Explore content creator" | Philly rowhouses and City Hall tower |
| 6 | Reel cover (9:16) | Them filming in their city, a calm bottom third for the reel title | Philly market street |
| 7 | Square post (1:1) | Them in their city at golden hour, room on the left for a line | Philly stoop |
| 8 | Scripts | Ready-to-paste captions and a bio line (below) | Below |
| 9 | A voice note from Sean | About 20 seconds in Sean's voice, their name in it, on their invitation or sent by DM; still picture and a play button, never a video | `vegan-media/media/sean/notes/keya-welcome-v2.mp3` |
| 10 | Their dashboard | Profile, stats, traffic, fans, bounties and earnings, the asset folder, and their link: clicks and who joined through it | Mock only |

City scenes never name or show a real restaurant or business, so no place reads as their favorite. Words are added on top in our fonts,
never drawn by the image model, so every picture is a template.

## Scripts (drafts for Sean)

**Bio line**
> Official @VegansExplore content creator. Find Vegan food, people and events in your city: <their link>

**Announcement post**
> Big news: I'm now an official Vegans Explore content creator! Vegans Explore is bringing every Vegan business, organization and person
> onto one platform, city by city, and membership is free. Join through my link in bio and come explore with me.

**Story (with the story template)**
> I'm an official Vegans Explore content creator. Membership is free. Tap my link to join.

**Your city post**
> Who should be on the Vegans Explore page for <city>? Drop the Vegan spots, groups and nonprofits we need to add in the comments.

**Reel caption**
> Exploring Vegan <city> with @VegansExplore. Free to join, link in bio.

## What the dashboard shows about the link

Clicks on their `/go/` link (bots left out), where the clicks came from, and the people who joined through it (`members.referred_by`)
with the points it earned them. Today the clicks are counted and the sign-up credit works through `?ref=`; the dashboard view is not built yet.

## The 10-slide carousel (draft for Sean, 2026-11-10; KJ is the prototype)

Square or 4:5 slides that sell joining the community, ending on urgency and the creator's link. Only slides 1 and 10 change per creator
(their GeekFon character in their city, their name and their link); slides 2 to 9 are the same for everyone, with their city's name dropped
in, using Guide scenes we already have and demo screenshots stamped Sample. So a new creator costs one or two images, not ten.

| # | Picture | Words |
|---|---|---|
| 1 | The creator in their city, in the burgundy (or their color) Vegans Explore long-sleeve | "Hi, I'm KJ. I'm an official Vegans Explore content creator in Philadelphia." |
| 2 | The Guides together (Welcome Guide group scene) | "Vegans Explore is where Vegan Philadelphia comes together: places, people and events, all in one place." |
| 3 | Directory cards (Sample) | "Find Vegan restaurants, bakeries, food trucks and more near you, and vote for your favorites." |
| 4 | A community scene (potluck or market walk) | "Meet your people: groups, nonprofits, rescues and sanctuaries in your city." |
| 5 | The Events page (Sample) | "See what is happening this week: meetups, pop-ups, festivals and dinners." |
| 6 | A Guide with a member (Liz) | "Free Guides walk you through it, from your first week to running a Vegan business." |
| 7 | The Daily Pulse (Sample) | "Your city's Vegan news, every day, in the Daily Pulse." |
| 8 | Points and the dashboard (Sample) | "Earn points for checking in, voting and sharing. You start with 250." |
| 9 | The countdown (Welcome Guide countdown scene) | "Founding Membership closes at midnight Eastern on January 1. Join before then and it stays on your profile for good." |
| 10 | The creator waving, the portrait logo | "Join Vegans Explore. Tap the link in my bio." |

Open: whether slide 10 says "free" (membership is free; Sean is not sold on putting it in the headline). Default: "free" stays off the
headline and in slide 9's line only if Sean wants it.
