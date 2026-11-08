# ve-demo-showroom: Green Leaf Kitchen tour script (V, recorded as a video)

2026-11-08. Liz narrates. Built as the guided view (`/public/ve-guided.js`, white stage, the `/partners` format), one slide per stop,
Back / N of M / Next, each slide showing that part of the real sample site (`/business/sample/site`) in a phone or browser frame,
stamped **Sample**. Nothing plays until Play. Lines are text until you approve them; then each is recorded in Liz's roster-profile
voice and checked word for word with stt. No prices on the tour (the product still shows the old BrandDesk prices; pricing_v9 is not
built yet). Green Leaf Kitchen, its owner and its farms are made up; the brands on dish pages are real Directory listings.

Running time: about 1 minute 57 seconds of Liz, plus the time on each slide.

---

**1. Start** (on screen: the home page, Sample stamp)
> Hi, I'm Liz. This is Green Leaf Kitchen. It's not a real restaurant. It's our sample, built to show you what a Vegan restaurant's
> website can look like when we build it with you. Tap around as we go. Nothing you do here is saved.

**2. The home page** (the hero with Open now, the today strip, What people come back for)
> The first screen answers what people want to know: are you open, what's good, and how do I order. The favorites row is ranked by
> what members vote for, so it stays current on its own.

**3. Your story and your space** (Our story video, The space toggles)
> People choose a restaurant for the people behind it. Your story plays right on the page, and your space shows by day, at night,
> inside, and with your team.

**4. The menu** (a menu section, then one dish page)
> Every dish has its own page. Allergens, a nutrition estimate, and what's in it, with where each ingredient comes from. When it's a
> brand in our Directory, it links to that brand's page.

**5. Members** (signed in as the sample member: a heart vote, Save, the Favorite pill)
> Members of Vegans Explore can sign in here with the account they already have. They vote for their favorite dishes once a day and
> save the ones they want to come back for.

**6. The owner's view** (the sample bar on As the owner, the yellow bar, editing ingredients on a dish)
> Switch to the owner, and the same page becomes yours to update. Change an ingredient, add a brand from our Directory, and the dish
> page shows it.

**7. Ordering** (the Order page, the stepper, Pickup, Delivery coming soon)
> Ordering is short. Add what you want, choose pickup, and pay. When your point of sale is connected, orders go straight to your
> kitchen. Vegans Explore Delivery is coming.

**8. Make it yours** (the look switch: Their brand, Island bright, Night lounge)
> This is one site in three looks. Same menu, same story, different colors and type. Yours is built from your own brand kit.

**9. Part of something bigger** (Sign in with Vegans Explore, the footer circle to the listing)
> Your site connects to your Vegans Explore page, where members find you, vote for you, and check in when they visit.

**10. Your community** (the Community page: Rewards with a points balance, one unlocked with its code; then the Green Leaf Club)
> Your regulars become your community. Members unlock rewards you choose, like a free drink or a seat at your chef's table, with
> the points they earn on Vegans Explore. There are only so many, first come, first served. And your club is a Guide on Vegans
> Explore, so it brings people in and sends them out to the rest of the community.

**11. Next step** (buttons: See how BrandDesk works, `/business#/managed`; Talk to our team, opens `VEManaged`)
> Want one like this for your restaurant? Tap Talk to our team, and a real person will walk you through it.

---

## Notes for Sean
- Slide 7 says "when your point of sale is connected": true for how it is built, but no real client has a connected point of sale yet.
- Slide 9 says members check in: true today (Check in on every listing with a map pin).
- Slide 10 follows your 2026-11-08 answers (canon-ve-front-of-house v10): rewards the owner sets, never cash; the club is a Guide.
  Check-ins every two weeks is not in it (you have not answered that one).
- Slide 11 links to Managed by us, which still shows the old prices until the pricing_v9 build.

## Recorded (2026-11-08, Sean: "record Liz")
Liz's roster-profile voice `IUMUPi350HfIhyzUBJB3`, el-media tts from the database, Vegan sent as Veegan, each checked word for word with stt.
Files: `vegan-media/media/liz/green-leaf-tour/tour-<n>-v1.mp3` for 1 to 4 and 6 to 11, and `tour-5-v3.mp3` for slide 5.
Lengths: 12.5, 11.1, 9.6, 11.8, 10.1, 9.2, 10.9, 8.3, 6.1, 21.8, 5.9 s (about 1 minute 57 seconds in all).
Slide 5 was reworded to "Members of Vegans Explore can sign in here..." because the voice stopped for about a second after "Vegans" when a line
opened with "Vegans Explore" (v1 0.86 s, v2 1.3 s; both kept in storage, not used). Every other pause falls at a sentence or comma break.

## Rebuilt as V's video on a Guide Overview (2026-11-08, Sean: "the overview page of the holiday guide... what's going to be said from V... in the video section")
The slideshow was replaced. `/business/sample/tour` (`business/tour.html`) is now copied from `guides/holiday-guide.html` with only its Overview,
and V narrates BrandDesk (canon-ve-guide-tour-standard v2), so the same 11 lines were recorded in V's voice (`Nhs7eitvQWFTQBsf0yiT`) and checked with stt:
`vegan-media/media/v/green-leaf-tour/tour-<n>-v1.mp3` (line 7 is `tour-7-v2.mp3`). Changed for V: line 1 reads "Hi, I'm V..." and "Watch the tour, then tap
around." (a video cannot be tapped mid-play); line 7 ends "Delivery is coming soon." (v1 said "Veegance"). The video: `media/business/sample/v-tour-v1.mp4`,
4:5, 2:12, V's scene picture opening and closing (`business/sample/img/v-tour.jpg`, Higgsfield), phone captures of the sample site panning on her words, a
Sample stamp on every capture, the podcast bed story-dining-v2 at -19 dB, -15.7 LUFS; captions `business/sample/v-tour-v1.vtt` (split by sentence, timed by
length). Liz's recordings stay in storage, unused.
