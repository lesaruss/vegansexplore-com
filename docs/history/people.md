# History: people

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## People (Sean, 2026-10-28)

"A people directory... people that we've actually interacted with... the incentive for organizations to want to work with us... we're
not just going to randomly add people to it... an IMDb of all the stuff that they've done with Vegans Explore... that will be our
doorway into making them an ambassador." **Launched to everyone 2026-10-28** (Sean: "launch the people directory"; the `people` entry of
`CAT_CONFIG` in `ve-region-directory.js` lost its `adminOnly`), on `/directory` and the dashboard's Directory tab.

- **A person is a listing** in the Directory's **People** section, so votes, saves, the card and the page are everyone's: sub-sections
  **Activists, Content Creators, Athletes, Physicians, Health Experts, Chefs, Founders** (All first), a second one in `extra_categories`.
  No place: every chapter (`communities` `['all']`), no address, phone, hours, How Vegan, claim box, check-in or Partner Dashboard. The card's
  line is what they do (`details.person.title`); Physicians filter by **Specialty** (`details.person.specialty`, `SPECIALTIES`). Change the
  section list together: `CAT_MAP`/`CAT_CONFIG`/`PEOPLE_CATS` in `ve-region-directory.js`, `PEOPLE` in `directory/listing.html`, `SECTIONS` in
  `ve-listing-admin.js`, `PEOPLE_CATS` in `ve-people` and `ve-discover`, `CATEGORIES` in `ve-claims`.
- **The profile** (`isPersonL`, `renderPersonOverview`, `loadPerson` in `directory/listing.html`): their photo square with rounded corners
  (`logo_url`), the roles, the one line, **About** (the bio, "Written from their conversations with Vegans Explore" when it was), **Their work**
  (`details.person.links`: a sign-up page, a program, a product, a book), **With Vegans Explore** (IMDb style: Podcast episodes, Events,
  Articles, newest first), **In their words** (moments of theirs from the content index,
  `ve_person_moments(listing)`: their credited episodes where the speaker is them, `details.person.speaker_names`, three an episode, Play from
  the second), Photos (`gallery_urls`), and the sidebar's Website and Follow (Instagram,
  Facebook, TikTok, YouTube).
- **Credits** are `ve_person_credits` (migration `20261028_people_directory.sql`, public read): kind episode (`content_id`, a
  `ve_pulse_content` row), event (`event_id`, or a title and date), article or video (title and link), with their role (Guest, Host,
  Speaker...).
- **`ve-people`** (super admin, or ops through `LESARUSS_ADMIN_TOKEN`): `save` (what they do, specialty, links, bio, website and socials;
  each change a `ve_listing_edits` row), `credits`, `credit_add`, `credit_remove`, `episodes` (search ours to credit), `bio_draft` (Claude Opus
  5.5 writes the bio from their credited episodes' transcripts and summaries, only what they say; `save` and `recategorize` apply it, its
  section and a physician's specialty), `photo_instagram` (their Instagram picture copied into `vegan-media/media/people/<slug>/`, refused as
  `not_them` unless a word of their name is on the account) and `photo_url`. The listing editor's **About them** (shown for People) does all of
  it: Write it from their interviews, the links, the socials, add an episode or an event, remove a credit; the logo control reads Photo.
  The logo sweep and chain logos leave people out (`notPerson` in `ve-discover`).
- **The first 79** (migrations `20261028_people_seed.sql`, `_seed_2.sql`, `_fixes.sql`): every guest named on our four shows, each credited
  with those episodes; John Thomas and Brooke Sellers as Host of every Vegans Who Lift episode; John (co-producer and host) and Ella Magers
  (meet and greet) at Vegan Foodie Fest Miami. 14 the May Instagram import already held became their profiles (their handle kept, the backlog
  row closed). Every bio was written from the transcripts the same day, 28 moved to the section their interview puts them in (the seed's
  section kept as their second), 29 have their Instagram photo, checked by eye (Sailesh Rao's, Feldi's, James Wildman's and Tim James's
  were not them and were removed). Not added: people only talked about (Tabitha Brown) and businesses (Love Life Cafe, Maizly...).
- **"Is this you?" and the creator ad** (Sean, 2026-10-30: "there isn't anything about claiming it... an ad for content creators to
  register using the animated style... see who's clicking on it... follow their journey... which channels are showing up the most... see
  that somebody signed up because they went through Brooke's page and became a creator on her page"; migration `20261030_promo_funnel.sql`).
  Every People page's sidebar opens with **Is this you, <first name>?** (while no account holds the profile: no `owner_member_id`, no
  `details.person.member_id`), going to the creator application with `?claim=<slug>` (`/gigs/sample?claim=<slug>#join/1`, which says
  "You are claiming <name>' profile", Not me), and an **animated creator ad**: Kai in our illustration style, four scenes crossfading with
  a headline each (Cook for the camera, Host our events, Tell local stories, Work with Vegan brands), Become a creator, opening the
  walkthrough (`/gigs/sample#overview`). Both are `/public/ve-promo.js` (`VEPromo.creatorCards`, `ppPromo` in `directory/listing.html`;
  not in a demo or on another brand's site, not for the person themselves). **Every step is tracked from the page it started on**
  (`ve_promo_events`, promo `creator-register`): view (the card on screen), click, landed (the walkthrough), started (the application's
  first step) through `ve_promo_track` from the browser (bots left out, once a visitor, step and page every 30 minutes); sent
  (`ve-ambassador` `creator_apply`) and accepted (`creator_status`) by the server. The click is kept in the browser 30 days
  (`localStorage` `ve_promo_creator-register`, the last click wins), and `ve-gigs.js` sends it with the application:
  `ve_creator_applications.source_page`, `source_listing_id`, `source_cta` (ad | claim), `source_channel`, `source_visitor` and
  `claim_listing_id`. **The channel** is how the visit came in, kept by `nav.js` on its first page (`sessionStorage` `ve_landing`):
  utm_source, a tracked /go/ link named by its code (Link: brooke-profile), the referring site (Instagram, Google...), or **Direct or an
  app** (WhatsApp and texts send no referrer). **Depot > Ambassadors > Where they came from** (`#funnel`, `ve-ambassador`
  `creator_funnel`, `ve_promo_funnel`): Saw it, Clicked, Walkthrough, Started, Sent, Accepted, by page and by channel, people counted once
  each, with the click rate; each creator application shows Where they came from, the profile it claims, and **Their steps**
  (`creator_journey`), and Sean's new-application email says the page and channel. A claim is never automatic: confirm it is them, then
  link the account in the listing editor's Their Vegans Explore account. Proven 2026-10-30 end to end on the live database with a test
  visitor (claim card on Brooke's page, every step, the application, Accepted, the funnel and the journey). A new promotion is a new
  `promo` slug on the same table and functions.
- **"Is this you?" for People who are not creators** (Sean, 2026-10-31: "can open a short claim request for people who aren't
  creators"; migration `20261031_people_profile_claims.sql`). On an Activists, Athletes, Physicians, Health Experts, Chefs or Founders
  page (not one also under Content Creators) the card's Claim your profile opens a short form in the card (`form: true` in
  `VEPromo.creatorCards`, `claimForm` in `public/ve-promo.js`; `ppPromo` in `directory/listing.html` picks it): name, email, a link that
  shows it is them (an Instagram handle becomes its link), a note; a signed-in member's name and email are filled in and their token
  sent. `ve-ambassador` `person_claim` (anyone, three a day per email) saves a `ve_profile_claims` row with `source` `page`,
  `contact_name`, `contact_email`, `proof_url` and `member_id` when signed in (the column is nullable now), emails Sean (reply-to them)
  and confirms to them, and counts it as `sent` (promo `profile-claim`; the card's view and click count under the same promo). It shows
  in the Inbox as Is this you? (profile claim) with their name and email, and in Depot > Ambassadors > Paid work's Profile requests with
  How to check: **Link it** (signed in: `owner_member_id` and `details.person.member_id`, a `ve_listing_edits` row, an email saying we
  update the profile for them on request) or **Checked** (no account: closes it here; the team writes to them from the Inbox and invites
  them), and **Decline** (emails them with the note). A linked person who is not an Ambassador edits through the team for now.
- **Founder, Communities and Affiliations** (Sean, 2026-11-02): any listing's `details.linked` `[{title, sub?, items: [{slug, role?}]}]`
  adds a section under About (and Their work) per title, the Directory's own card two across, one on phones (`linkedSections` in
  `directory/listing.html`). First: Vegans in Clermont (Central Florida group) names Elle Jimenez under Founder, her page lists the group
  under Communities, and Paige Parsons Roache's lists UnchainedTV, Plantbased in the Burbs and Plant Based Treaty (added as a Nonprofit,
  every chapter) under Affiliations (migrations `20261102_outreach_people_pages.sql`, `20261102_linked_sections.sql`).
- Not built yet: people from events and articles beyond the Foodie Fest, and the Ambassador path from a profile.

## People pages: podcasts played in place (Sean, 2026-10-28)

"Use the squared with the rounded corners logo thumbnails for the podcast... I don't want it to be like a long scroll... 10 episodes and
then you can scroll within... if they click listen, it's going to open up a player. And if they click watch, it could open up a light
box... I want to keep people in this environment." On a person's page (People section, `renderPersonOverview` and `loadPerson` in
`directory/listing.html`), every podcast episode is the podcast listing's own row (`VEEpisodes.row` through `ppEpRow`: the show's square
artwork, **Play** and **Save**; no search, the lists are short). **Audio only** (Sean, 2026-10-28: "let's just keep it simple and only
have the audio... All our videos is just still images with music playing over it... I'll let you know which videos I feel are worth
sharing"): no Watch, no Videos tab, no video lightbox, and video credits are not listed. Play opens the player **docked above the
podcast sections** (`.vep-dock[data-vep-always]`, before Their podcast and With Vegans Explore; Sean, 2026-10-28: "it puts it at the very
bottom and you don't see it right away"), each Play changes it, and it scrolls into view when off screen (`inView` in `ve-episodes.js`,
which a podcast listing in the dashboard's frame gets too). An In their words moment plays its episode's audio from its second
(`VEEpisodes.play(ep, show, {start})`), only when the moment's episode is matched to the feed and the audio runs within 15 s of the
YouTube transcript it was timed on (`ve_person_moments` returns `transcript_end`, migration `20261028_person_moments_transcript_end.sql`);
otherwise the quote shows with no Play (Dr. Klaper's "Moving Medicine Forward" audio is 47 s shorter than its video). **Save** saves the
episode like a show page's, and every list shows about ten rows and
scrolls inside its box (`.pp-scroll`). Nothing on it links away to listen. The sections: **Their podcasts** (the shows they host, each
the Directory's own card with votes, opening the show's page where every episode is; `ppShowTiles`: `details.person.shows` and our shows
they hold Host credits on, most episodes first; Sean, 2026-10-29: "we should just have their podcast listing little tile... it's just going
to be this long, long page"), **With Vegans Explore** (their guest episodes on our four shows, never the ones they host, then events,
articles, videos; hidden when empty), **On other podcasts** (other Directory shows that had them on), In their words.
The data is `ve_person_episodes(listing)` (migration `20261028_person_podcasts.sql`): our episodes matched to each show's feed
(`ve_podcast_feeds`: the feed episode names them and came out within 60 days, or the titles are close), other shows' episodes with their
name in the title or named as the guest in the description ("with", "joined by", "<name> joins us"; a passing mention does not count),
and their shows. Built ahead (`ve_person_episodes_build`, about 3.5 s, past a visitor's 3 s limit) into `ve_person_episodes_cache`,
rebuilt every 6 hours by cron `ve-person-episodes`. Hosts set 2026-10-28 from each show's own description: Maxime Sigouin, Giacomo
Marchese and Dani Taylor (Muscles by Brussels Radio), Dotsie Bausch (Switch4Good), Jason Kartalian (Vegan Hacks), Brighde Reed (World
Vegan Travel), Neal Barnard (The Exam Room); John Thomas and Brooke Sellers host Vegans Who Lift, one of ours, so theirs are under With
Vegans Explore. A person with another name on other shows gets it in `details.person.aka`.
