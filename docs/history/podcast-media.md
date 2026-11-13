# History: podcast-media

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Content index (Sean, 2026-10-10: "go ahead and start on the content index")

Ten years of our episodes and interviews searchable by topic with timestamps, so a Guide can play the exact moment: "dairy"
returns every moment across every show, who said it, a quote, and a play button that starts at that second. Three steps:
1. timestamped transcripts, 2. moments tagged by topic (the Background writer, like the Daily Pulse), 3. search and clips.

- The episodes are `ve_pulse_content` rows with `podcast_show`: 278 on 2026-10-10 (Vegans Explore Podcast 169, SoFlo Vegans
  59, Vegans Who Lift 31, Pre-Vegans 19); 223 have a `youtube_id`. 30 SoFlo episodes have an untimed `transcript`.
- Step 1 (built 2026-10-10): `ve_content_transcripts` (one per episode: `segments` `[{s, e, t}]` in seconds, `text`, `source`
  youtube | youtube_auto | turboscribe | manual; migration `20261010_ve_content_index.sql`) and the edge function
  `ve-content-index` (admin token): `youtube` / `youtube_batch` read an episode's YouTube captions, `srt` saves an SRT file
  (TurboScribe's timestamped export), `status` counts by show (`ve_content_index_status()`), `probe` shows what YouTube
  returns to the server.
- YouTube refuses our server: the watch page answers with Google's "unusual traffic" page (429) and the player API with
  "Precondition check failed" (probed 2026-10-10). So server-side caption reading does not work; the transcripts come from
  TurboScribe (Sean's account, $20 a month, takes YouTube links) as SRT files, or from YouTube's own API once the channel
  owner authorizes it (needs the YouTube Data API on the Google Cloud project and a sign-in per channel; nothing is set up).
- **Depot > Content index** (`/admin/depot/content-index`, built 2026-10-10 when Sean subscribed to TurboScribe): each show's
  progress (timestamped of all, hours) with **Copy the YouTube links** still waiting (for TurboScribe), a drop box for SRT files
  or a ZIP of them (JSZip, `__MACOSX` skipped), and the episode list (search, show, Waiting or Timestamped). Dropped files are
  matched to an episode by `ve-content-index` `match` (Sean, 2026-10-10: "look at the transcript to figure out the title"): the
  show initials and episode number in the file name (SFV 012, VWL S5E7, PV E16, VEP 45; `codeOf`), then the title's words heard
  in the opening (a guest's name counts far more than common words), line-for-line overlap with an untimed transcript we already
  hold, and "episode 12" said early (Good match, Check this, Skip). The review view (`#review`) lists the ones to check first,
  each with its opening lines, the top three suggestions and a search box (a guest, a topic, "SFV 12"), and Save sends each through
  `ve-content-index` `srt` (source `turboscribe`, and the file's name in `ve_content_transcripts.file_name`). Nothing is dropped
  silently (Sean, 2026-10-10: 50 files dropped, 34 saved): a file whose transcript is already saved says so (`match`
  `saved_as`, from the transcript's opening, `head`) and stays out, two files set to one episode block Save, and files left on
  Skip stay on the screen after Save with a note. Drop the whole folder again any time; only the missing ones need a look. The episode list runs in each show's number order (Sean,
  2026-10-22: "sort the podcast episodes for the shows by number. This way I know what didn't upload"), each row with its code
  (VEP 41, SFV 12, PV 5, VWL S5E7) from `ve_pulse_content.episode_number`. Vegans Explore episodes are numbered by release from
  2025-11-01, leaving out the two "South Florida Vegans" cross-posts; Sean's TurboScribe files VEP 0041 to 0070 matched those
  numbers one for one. Two exceptions found 2026-10-23 when VEP 0078 to 0090 landed one episode off: "Moving Medicine Forward:
  Why Nutrition Belongs at the Center" (2026-01-16) is the same YouTube video as #77 and has no number, and Sean's 93 (2026-02-01)
  is not in our list, so 78 to 92 run by release and 94 onward line up again (#100 is "100 Episodes"). On the review screen,
  picking an episode another file holds takes it and sends that file back to Skip with a note, and episode search takes a
  number (VEP 88). Same day, after two files were both named VEP 0095 (Juicy Marbles and Jason Kartalian) and two Klaper files were
  named "03": a number in a file's name counts in full (0.75) only when the opening agrees with that episode's title or
  summary, else 0.4, so the opening wins a disagreement; a bare number with no show code counts for nothing. When two files
  still land on one episode, the stronger match keeps it and the other moves to its next best free episode (0.35 or more),
  marked Check this with why, and a file whose name says another code than its episode says so. Replacing a saved
  transcript is never a guess ("Dr. Klaper Podcast 02" had replaced #27's transcript): below 0.75, a file whose best match
  already has one goes to its next best free episode, or waits on Skip, with a note; picking it by hand still replaces. The 26 Brooke & John episodes from May 2024 to January 2025 are Vegans Who Lift, not Vegans Explore
  (relabeled 2026-10-22). The function takes a signed-in super admin for `status`, `episodes` and
  `srt`, and the admin token for everything.
- Step 2, moments by topic (started 2026-10-23, Sean: "you can start step two now, and I'll continue uploading"; migration
  `20261023_ve_content_moments.sql`, playbook `ve-content-index` in HQ). The Background writer (dispatcher source
  `content_moments_tag`, Station 2, batch 3, on the subscription) reads each transcript (`ve_content_transcript_lines`) and saves
  its moments through `ve_content_moments_save(content_id, moments)`: start and end second, speaker, the quote word for word,
  a one-line summary, one to three topics from `ve_content_topics` (42 slugs; add a row to add a topic). The save checks every
  moment (topics on the list, times inside the episode, 15 seconds to 10 minutes long so a clip plays as a whole thought, Sean
  2026-10-23; the quote really said within 30 seconds of the start) and returns the
  rejected ones with why. A transcript is queued (`tag_status`) whenever it is saved, replaced or set ready, so Sean's drops are
  tagged on the next run. Nothing is deleted: each save is a run (`run_id`), the transcript points at its latest (`moments_run`),
  and `ve_content_moments_live` is what counts (ready transcripts, latest run, with the episode's title, show, number and
  YouTube id). Proven 2026-10-23 on Vegans Explore episode 1 (7 moments; a made-up quote and an off-list topic were refused).
- **Step 1 now lives in its own playbook** (Sean, 2026-11-03: "podcast network transcript upload... once that's done, that playbook is closed out"): `podcast-network-transcript-upload`, open while Sean transcribes, closed when all four shows have a transcript on every episode with audio (132 of 278 on 2026-11-03). Steps 2 and 3 stay in `ve-content-index`.
- Step 3, search and clips (started 2026-10-23, Sean: "start step 3"; migration `20261023_ve_content_search.sql`). In
  **Depot > Content index** first, so Sean can judge it before members get it: **Search** (`#search?q=&topic=&show=`, a card
  on the home view with the moment count) finds moments by words and topic, best match first (`ve_content_moments_search`,
  Postgres text search over the summary and topics, then the quote, then the speaker and title; `websearch` syntax), each
  card with its episode code, summary, speaker, quote, topics and Play; a **moment** (`#moment/<id>`, `ve_content_moment_get`)
  plays that stretch in the YouTube player (`youtube-nocookie` embed with `start` and `end`) with Keep watching on YouTube and
  the rest of the episode's moments beside it. Topic counts and tagging progress: `ve_content_topic_counts()`. `ve-content-index`
  actions `topics`, `search`, `moment` (super admin or the admin token). Not yet: members' search and the Guides' Pulse tabs
  playing moments; episodes not on YouTube cannot play.

## Media (Sean, 2026-10-27)

"Let's do media instead of shows... what we're showing on media is our featured media plus the top 12 listings voted by you
guys. So they get a little bit more prominence." `/media` (`media/index.html`; `/podcast`, `/podcasts`, `/shows` and
`/podcast-network` forward to it) and the dashboard's **Media** tab (`/dashboard/media`, which was Shows; `/dashboard/shows`
forwards) are one component, `/public/ve-media.js` (`VEMedia.mount`, after `ve-region-directory.js`). It is what we put
there, never something members add or follow (the Follow Shows tiles and modal are gone).

- **Filters on the voted list** (Sean, 2026-11-01: "do the same pills on the media filters"): above the top 12, a name search, the live
  filters as pills (tap one to turn it off and on, its x to take it away) and **Filters**: Podcasts by Status (Active, On hiatus, Ended),
  Documentaries by Status (Available...), Books by Type of book, any number picked, choices shown only when a listing has them; Sort is
  Most votes and A to Z, plus Newest and Oldest first for books and films. The 12 are the top 12 of what matches (`FACETS`, `SORTS`,
  `drawTop` in `ve-media.js`); they reset when the kind changes. Our featured shows are never filtered.
- **Not about a city** (Sean, same day: "no one's trying to make media just for one location"). The banner is the shared one
  (`VECityBanner` with `VEMedia.bannerOptions`: `choices` instead of cities, one picture) and reads **Vegan Media** over the kind
  of media; its picker is the kind (`TYPES`: Podcasts, Documentaries (`Documentaries & Films`), Books; `?type=` on `/media`), and
  its button is **See in the Directory**, that kind's section (`/directory?tab=media&sub=<sub-section>`; the Directory opens the
  pill named in `&sub=`). The ad rail is the All cities pair.
- **One kind fills the page**: picking Documentaries shows only documentaries. Its **Featured** first, in its own section,
  when we have put something there (`SHOWS`, each with its `type`: our four shows and the episode search are Podcasts'; Books
  and Documentaries have none yet, so their 12 lead; a featured book, such as the Pre-Vegans one Sean mentioned, is a `SHOWS`
  row with `type: 'books'`). Then its **top 12** as voted in the Directory, read fresh on every visit: most votes, then most
  voters, then a logo over a letter, then A to Z. Our own shows are Directory listings too and never count in the 12. The
  cards are the Directory's card, with + Vote.
- **Featured shows are their listings** (Sean, 2026-10-27: "the same as the page... include YouTube and Amazon Music on there as
  options for our featured ones... the episodes pulled from the RSS feed... go off the RSS feed"). A Featured card opens
  `/directory/<slug>` (in the dashboard, under the Directory tab), wears the feed's Active or On hiatus and has **Listen
  here** plus Spotify, Apple Podcasts, Amazon Music and YouTube (`LISTEN` in `ve-media.js`, read from the listing's
  `details.platforms`; on the listing's Listen on, `details.platforms.youtube` is the show's playlist, the `youtube` column stays
  the channel for socials). Since 2026-10-27 (Sean: "show the featured podcasts in the same format as the other, just in their own
  section") the Featured section shows them with the Directory's own card, like the 12 (votes and all), in `SHOWS` order; the
  listing holds Listen here and the platforms. The old `/podcast/<slug>/` pages are gone and forward to the listings (`vercel.json`). Pre-Vegans got
  its listing the same day (`20261027_featured_podcasts.sql`); its feed's last episode is February 2025, so it reads On hiatus.

**The Directory's Media picker lists the kinds of media** (Sean, 2026-10-29) was replaced on 2026-10-30 by Directory navigation
(below): the banner lists the sections everywhere, and Media's kinds are the tab row under it.

**YouTube channels** (Sean, 2026-10-29: "find some popular YouTube vegan channels... any new video that pops up will show on their page...
the video on the left, and then a summary, like a 250 character summary... all their Instagrams... below it, you will see thumbnails of
their latest videos... watch everything on this page"; migration `20261029_ve_youtube_feeds.sql`, edge function `ve-youtube`). A YouTube
listing names its channel in `details.youtube_channel_id`; its Overview (`renderYouTubeOverview`, `loadYouTube` in `directory/listing.html`)
plays the latest video on the left (`youtube-nocookie`), About (the listing's description, up to 250 characters), subscribers and videos,
and **Find them on** (YouTube, Instagram, TikTok, Facebook, website; marks in `/public/icons/platforms/`) on the right, then **Latest videos**,
thumbnails 12 at a time (Show more), each playing in that player. `ve-youtube` `videos` serves the latest 50 uploads from
`ve_youtube_feeds`, read again after 6 hours (cron `ve-youtube-refresh`, hourly, 20 a run), which sets Active / On hiatus like a podcast;
`resolve` (ops) looks a channel up by handle or id. **Playlists for a client's site** (Sean, 2026-10-30, Brooke Sellers'
meatlessmuscle.com series pages, hand-typed and behind: "will it stay up to date?"; migration `20261030_ve_youtube_playlists.sql`):
`ve-youtube` `playlist` (anyone, `{id}`) serves a playlist listed in `ve_youtube_playlists` whole, newest first, with each video's
length, read again after 6 hours on a visit or by the same hourly `refresh` (10 playlists a run). Only listed playlists are served. Her
five series are listed (`site` meatlessmuscle.com); her pages read it and keep their typed list as the fallback. YouTube refuses our server its channel pages (a blank page) and its RSS feeds (404
for every channel, Google's own included; checked 2026-10-29), so it reads YouTube's Data API v3 with `YOUTUBE_API_KEY`, else
`GOOGLE_PLACES_API_KEY` (Sean turned the YouTube Data API on for it the same day). A News Outlet with a channel gets the same page
(`isYouTubeL`; Plant Based News was one until 2026-10-30, now split into a News Outlet and a YouTube listing, below). **The first 12** (migration `20261029_youtube_channels.sql`, each found
through `resolve`, its About written from the channel's own description, links only the ones the channel publishes, its own picture as the
logo): Pick Up Limes, Rainbow Plant Life, Mic the Vegan, NutritionFacts.org, Earthling Ed (YouTube) (one listing a name: his People profile is
Earthling Ed), Sweet Simple Vegan, Cheap Lazy Vegan, Simnett Nutrition, BOSH!, Sarah's Vegan Kitchen, The Happy Pear (from the May import)
and Plant Based News. Left out: Avant-Garde Vegan (Gaz Oakley is no longer Vegan), Sauce Stache (now Mark Stache, a general health
channel), We Cook Vegan (uploads not public); then BadAssVegan (John Lewis) and Torre Washington (YouTube) with the linked pages.

**News outlets' stories** (Sean, 2026-10-30: "have their RSS feed underneath the About Us... when they click on it, it goes to
their website"; migration `20261030_ve_outlet_stories.sql`, edge function `ve-outlet-stories`). A News Outlets listing shows **Latest
stories** under About (under the video and About for an outlet with a channel, Plant Based News): headline, date, picture and a summary
clamped to two rows, 10 at a time with Show more, each opening the outlet's own page in a new tab, counted as a `website` action with ref
`story` (`newsStoriesHtml`, `loadNewsStories` in `directory/listing.html`). The feed is `listings.rss_url` (RSS or Atom); empty, it is found
once from their home page (`<link rel="alternate">`, then /feed/, /rss, /index.rss...) and saved, and an empty string turns it off
(`admin_feed`). The latest 100 are kept in `ve_outlet_feeds`, read again after 3 hours. **A general outlet shows only its Vegan and animal
stories** (`details.news_filter` `vegan`, `VEGAN_RE` in the function, English and Spanish), and with none the section stays hidden: WLRN,
WPTV, CBS 12, Diario Las Américas, Miami's Community Newspapers, Westside Gazette and Las Olas Insider. Vegan outlets show every story.
On 2026-10-30: VegNews, Plant Based News, Sentient Media, UnchainedTV (its feed is on unchainedtv.com, `latest-news/feed/`, which
the listing's unchained.tv does not name), WPTV, CBS 12 (its local feed, `cbs12.com/news/local.rss`, which its home page does not name),
Las Olas Insider and Miami's Community Newspapers showed stories; Diario Las Américas (`rss/pages/lo-ultimo.xml`) and Westside Gazette had
none that matched; WLRN's feed is published empty. **The cleanup the same day** (Sean, 2026-10-30; migration
`20261030_news_outlets_cleanup.sql`, run through the one-time `ve-once-news-outlets`, now the 410 stub): the seven local outlets had been
hidden from Vegans Explore by the LESARUSS.ai tag `lesaruss-ai-directory-candidate` (which the Directory and Media leave out); it came off,
so they showed here, and their How Vegan was cleared (they are not Vegan outlets). **Then six went back to LESARUSS.ai only** (Sean,
the same day: "I'm not sure exactly why they're there... for Lasaris AI"; they were made 2026-10-29 by a Google Places search for
LESARUSS.ai; migration `20261030_local_outlets_back_to_lesaruss_ai.sql`, run through `ve-once-outlets-lr`, now the 410 stub): Diario Las
Américas, Las Olas Insider, Miami's Community Newspapers, Westside Gazette, CBS 12 and WPTV carry the candidate tag again. **WLRN stays
on both** (it has had Susan Hargreaves on). **A news outlet leads its family's tabs** under its own name (`familyKind` -1 in
`directory/listing.html`; Sean: "Let's put the plant-based news tab first, because that's their main thing"): Plant Based News, Podcast,
YouTube, then the page's own tabs and Partner Dashboard. VegOut ("not that active anymore") and VegWorld (latest story February 23, 2026) were Removed (Directory review's Removed list
puts them back). **Plant Based News is two listings** (Sean: "that should be the default when you look on news outlets and not their
YouTube channel. When you're on YouTube, you should see their YouTube channel"): the News Outlet (`plant-based-news`, its stories, the
votes) and **Plant Based News (YouTube)** (`plant-based-news-youtube`, the channel and its `ve_youtube_feeds` row), linked as the family
`plant-based-news` with its podcast.

**Linked pages** (Sean, 2026-10-29: "his overview page and then have a tab for his podcast and then have a tab for his other thing... it
just goes to those pages... you see the URL change as well. All that is cross discovery, and it doesn't bog down his page"; migration
`20261029_listing_families.sql`). Listings that belong together share `listings.details.family`; every page in it shows the others in its
tab row as links to their own pages (`loadFamily` in `directory/listing.html`): **Overview** (the person), **Podcast**, **YouTube**, **Book**,
in that order, the page you are on active in its place. A show two people host names each person (Muscles by Brussels Radio: Dani Taylor,
Giacomo Marchese, Podcast); with no person it is Podcast and YouTube (Nutrition Facts, Plant Based News). Families set 2026-10-29: Earthling
Ed (profile, The Disclosure Podcast, his channel), John Lewis (profile, BadAssVegan, the book Badass Vegan), Torre Washington (profile,
Torre Washington (YouTube)), and each host and their show (Neal Barnard, Dotsie Bausch, Jason Kartalian, Brighde Reed, Maxime Sigouin,
Muscles by Brussels). Neither John Lewis nor Torre Washington hosts a podcast of his own (checked, Sean asked); their channels were added
(`badassvegan-youtube`, `torre-washington-youtube`). A new family is the same `details.family` value on each listing; two of the same
kind run A to Z unless `details.family_order` puts one first (lower first; the Vegans Explore Podcast is 1 in Sean's family).
**Shared shows** (Sean, 2026-10-30: "the podcast and YouTube channels, they should be able to be shared by multiple people because
sometimes there's multiple people on the podcast"): a listing can also belong to other families, `details.families` (a list). Each
person keeps their own family (their books and channel stay theirs); a shared show is its own family plus each host's, so it shows on
every host's page, and its own page lists only its people and itself. First: the Vegans Who Lift Podcast (`vegans-who-lift`, with
`brooke-sellers` and `john-thomas`; migration `20261030_brooke_john_shared_podcast.sql`). Neither bio names the other (Sean, same day).
**More than one show is one tab** (Sean, 2026-11-01: "I don't like having all three of the podcasts brought out on the tabs... all
under a title called Podcasts with a drop-down... when you go to Vegans Explore, you see that same drop down"): when a family holds two
or more Podcasts (or two or more YouTube channels), they are one **Podcasts** (**YouTube**) tab with an arrow, which opens the shows by
name with their logos, the one you are on marked (`famMenu` and `.fam-menu` in `directory/listing.html`, the list drawn outside the
tab row so it is not cut off); on a show's page that tab is the active one. One show of a kind keeps its single Podcast or YouTube tab.
On phones the tab dropdown lists each show by name (`mobileTabMenu` reads the tab's `_fam`). First on Sean's page: Vegans Explore,
Pre-Vegans and SoFlo Vegans Podcasts.
**The tab row folds into a dropdown when it does not fit** (Sean, 2026-11-01: "Keep the tab buttons on desktop, dropdown only on
mobile", then agreed with Logan: buttons keep the Guide tab in sight, so fold only when a long row runs off the edge): on every listing
with two tabs or more, `mobileTabMenu` in `directory/listing.html` sets `lt-fold` (one dropdown, `.lt-sel`; 360 px on desktop, full width
on phones) at 768 px and under, or on a wider screen when the buttons overflow the row (measured again on resize and as tabs appear).
Each option clicks its tab or family link (a family's shows by name). Otherwise the tab buttons stay.
**Linked pages are card sections, not tabs, since 2026-11-02** (Sean: "instead of having it in the tabs... just have about as the tab...
the affiliations, and then under the affiliations, that's where we would have the podcasts... You don't have 1,000 tabs and some exceptions
with a drop down arrow"). `loadFamily` in `directory/listing.html` no longer adds tabs: a family's other listings are the Directory's own cards
(votes, opening their page) on the first tab, drawn by `cardSections` (which also draws `details.linked`). A People page's first tab reads
**About**: the bio, Their work, Affiliations (`details.linked`), Their shows (`ppShowTiles`, its hosted shows plus the family's podcasts and
channels, `PP_HOSTED`, `PP_FAMSHOWS`), People, Their books, Related, then With Vegans Explore. A show, book or outlet keeps Overview: Hosts
after About, and More shows, Books and Related after its own content (Episodes, Latest stories; tag `famend`). A listing already under
`details.linked` is not drawn twice. An old `?tab=books` link scrolls to the books; the in-page book view and the Podcasts dropdown are gone
(`drawBooks` and `famMenu` remain, unused). What follows below about tabs is history.
**The tab order and Books** (Sean, 2026-10-29: "The order should be overview, podcast, YouTube, and then the dashboard... I also want to add
in books... after YouTube and before partner dashboard"). The family's tabs go right after the page's own tab, so the row is always
Overview (the person's profile), Podcast, YouTube, Books, then the page's other tabs and Partner Dashboard last (shown only to the owner and
super admins, `loadPartnerHome`). With a person in the family, all its books are one **Books** tab on the person's page (`?tab=books`; from
the podcast, YouTube or a book's own page it links there): the covers, newest first, then **About the author** (their description cut to 150
characters, Read their profile); a cover opens that book in the same space (`?book=<slug>`, pushed so back works): a breadcrumb in the page
(Books > title), the cover, by, year, type and publisher, the synopsis (`details.summary`, else the description), **Buy on Amazon** (the
book's tracked link, `details.buy_link`, `/go/book-<ISBN-10>`) and The book's page (`drawBooks` in `directory/listing.html`). On 2026-10-29
(migration `20261029_author_books.sql`): Earthling Ed's three books, eight of Dr. Barnard's (The Cheese Trap joined his family) and Badass
Vegan, each cover copied from Amazon's image for its ISBN into `vegan-media/media/logos/books/` and checked by eye (Badass Vegan's stored
ISBN was wrong; Reversing Diabetes uses the revised edition in print). Open Library and Google Books refuse our server after a few calls, so
book facts came from Open Library's search before it closed. **Amazon Associates**: every `/go/` link to an Amazon store leaves with our
tracking ID (`withAffiliate` in `ve-links`, `ve_site_settings` `amazon_associates` `{tag, tags: {'amazon.co.uk': ...}}`, read with a 5-minute
cache). Our US tag is `vegansexplore-20` (Sean, 2026-10-29); other Amazon stores (amazon.co.uk for London) go untagged until a tag for
that store is added under `tags`.
**Referenced books and the book crawl** (Sean, 2026-10-29: "any books that are mentioned in the podcast, we put on... a background list to be
built out and put into the page. And any books from any of the people... we do a crawl"; migrations `20261029_ve_books_crawl.sql`,
`20261029_book_covers_buy_links.sql`; edge function `ve-books`). `ve_books` is the list: every book we know of (source `listing`, the 33
already listed; `transcript`; `author_crawl`), one row per title and author's last name (`ve_book_key`, `ve_book_author_key`,
`ve_book_upsert`, so a caption's "Bolshevitz" still finds Bulsiewicz's book). Three crons call `ve-books`: **scan** (`ve-books-scan`, two
transcripts every 5 minutes, `ve_content_transcripts.books_status`, requeued when a transcript is replaced) has Claude name the books said
in a transcript, keeps a mention only when its quote is really in the transcript within two minutes of its second, and saves it in
`ve_book_mentions` with the show's feed guid (`ve_content_feed_episode`); **crawl** (`ve-books-crawl`, two People every 10 minutes, again
after 180 days, `ve_book_author_checks`) looks a person up by name and keeps the books Claude confirms are theirs (`author_listing_id`);
**build** (`ve-books-build`, three every 5 minutes, three tries) matches a found book, takes an English edition whose cover Amazon has,
copies the cover into `media/logos/books/`, has Claude write the card line and synopsis only from the publisher's description, and makes its
tracked Amazon link. A book about Vegan or plant-based living, food, health or animals becomes a Books listing (one of our People's books too,
but only when it is about Vegan living: Sean, 2026-10-29, "Only the books relevant to Veganism"; six were taken off that day, migration
`20261029_books_vegan_only.sql`, among them Jane Velez-Mitchell's true crime books and the What the Health book), unless we talked about it with its author on our podcast
(Sean, the same day: "We spoke to that author about the book"; `talkedAbout` in `ve-books`: named in a transcript, or the author's
episode is titled with it; The Penis Book and iWant stay, migration `20261029_books_kept_talked_about.sql`)
(`built`, in its author's family, so it is on their Books tab; a person with no family gets their slug as one); any other book is
`referenced`, shown only on the episodes that name it. An existing listing of the same title is linked, never copied. A podcast episode's
view (`?ep=<guid>`) shows **Referenced books** under it (`books` in `public/ve-episodes.js`, `ve-books` `episode`, public): the cover,
title, author and Recommended / Their book / Talked about / Mentioned, opening the book's page, or Amazon for a referenced one. `ve-books`
`status` counts the list, `probe` says whether the sources answer. **Sources**: Google Books first, read with our Google key (`GOOGLE_PLACES_API_KEY`; Sean added the Books API to the key 2026-10-29),
English results only (`langRestrict=en`, an edition counted only when Google says its language is English, and the match itself judged English or not; a book found only in another language is Not found, since a Spanish La Promesa Del Meñique got through on 2026-10-29), retried when it answers 503, and searched looser until something comes back (its operators miss
some books a plain search finds); then Open Library, which refused our server's connections that day. A crawl that finds nothing under the
listing's name asks Claude what name they publish under (Earthling Ed writes as Ed Winters) and saves the book under the name on its cover.
A source that does not answer does not use up a book's tries. A book whose English editions have no cover on Amazon is `not_found` (Klaper's
1987 Pregnancy, Children, and the Vegan Diet). Proven 2026-10-29 on two episodes: the cookbook
countdown named its ten books, all matched to their listings, and John Lewis's named Badass Vegan, A New Earth and The Art of War (the last
two queued; once Google answered, A New Earth and The Art of War became referenced books and Dr. Klaper's Moving Medicine Forward, named in
his episode, a listing on his new Books tab). **Building each other** (Sean, 2026-10-29: "we're mining for content to put into our
directory and then cross-referencing that content with what we have in our directory"): every book's page and the Books tab's book view
show **Talked about on our podcasts** (`loadBookTalks` in `directory/listing.html`, `ve-books` `book`, public): the episodes that named it,
with who and how (Their own book, Recommended, Talked about, Mentioned), each opening the episode on its show's page. Books not about Vegan
living stay out of the Directory (Logan's default, Sean's to change) and show only as Referenced books; **Depot > Content > Books**
(`/admin/depot/books`, after Content index in the Go to menu; `ve-books` `admin_list`, `admin_get`, `admin_set`) lists the book list by
status (Waiting, In the Directory, Referenced only, Not found, Set aside) with the scan and crawl progress, and one book (`#b/<id>`) with
why it stands where it does, the episodes that named it, and **Make it a listing** (a referenced book becomes a listing at once from what
the builder found; any other is built as Vegan related on its next run, `vegan_related` true), **Try again** and **Set aside**. When Amazon
has no cover for any English edition, the builder takes Google's own cover picture of one (`googleCover`, `books.google.com/books/content`,
800 px wide); a book with no ISBN-10 gets an Amazon search as its tracked link (`buyLink`). The same day five older books got their Amazon covers and every book with an ISBN its Amazon link; Sweet Potato Soul's picture
(its author's logo) was set aside for the letter. **Pre-Vegans** (Sean's book, 2026-10-29; migration `20261029_pre_vegans_book_spitz_fix.sql`) has a
979 ISBN, so no ISBN-10 and no Amazon cover by ISBN, and the builder could not find it: it was added by hand from its Amazon page
(`pre-vegans-by-sean-russell`, `/go/book-b0b1cd57rw`), in the family `pre-vegans` with the Pre-Vegans Podcast, Featured in Media > Books
(`SHOWS` in `ve-media.js`), and its eight People in it show as its **Featured people** (`details.film_people` on a book too, `bookPeople` in
`directory/listing.html`). A book with a 979 ISBN goes the same way. Google Books had Dr. Aaron Spitz as "Splitz"; his book's listing was
corrected the same day. The China Study was built twice the same day (two author lines; the key took "II"): the author key is now the
first author's last name without II, Jr, MD and the like, `buildOne` links to a Books listing with the same ISBN instead of making
another, and the copy was merged (migration `20261029_books_dedupe_author_key.sql`). Sean got his own People profile the same day (`sean-russell`, Founders, migration
`20261029_people_sean_russell.sql`): the May import's quarantined @seanarussell82 row promoted, Host of every Vegans Explore, SoFlo
Vegans and Pre-Vegans episode (221 credits), in the family `sean-russell` with the Vegans Explore, SoFlo Vegans and Pre-Vegans podcasts and the book (migration
`20261029_sean_russell_family.sql`; no YouTube page joins it until Sean has video he wants to promote); his website is seanarussell.com,
first in Their work.

**Film pages** (Sean, 2026-10-29: "a trailer from like YouTube of the documentaries on the page, add a little bit more of a summary...
where it can be viewed, like if it's Netflix, if it's YouTube, almost like how you have it with the podcast... the video on the left and the
text on the right"; migration `20261029_film_pages.sql`). A Documentaries & Films listing's Overview (`renderFilmOverview` in
`directory/listing.html`) is **Where to watch** (square icons like a podcast's Listen on, each with Free, Rent or buy or Stream under it;
`details.watch` `[{kind: website|youtube|netflix|apple_tv, url, note}]`, `WATCH` in the page; marks in `/public/icons/platforms/`), then the
video on the left (`details.video` `{id, kind: trailer|film, channel}`, a `youtube-nocookie` embed that goes full screen, captioned Official
trailer or The full film, shared free by its makers) and **About** on the right (`details.summary`, longer than the card's description, then
Directed by, Released, Runtime); stacked on phones. Every video is a YouTube upload from the filmmakers, their distributor or Netflix,
checked with `ve-off-lookup` `yt` (YouTube oEmbed: title and channel), and every link opened with `ve-off-lookup` `page`, never taken from
the import's `details.streaming_platforms` (names only, never checked, not shown). Netflix is listed only for its originals (Seaspiracy):
its pages do not say what streams in the US. On 2026-10-29: 13 of 18 have a video (Earthlings, Forks Over Knives, Dominion, Meet Your Meat and
PlantPure Nation the full film, free from their makers), 15 have where-to-watch links; They're Trying to Kill Us, Vegucated, Christspiracy,
Live and Let Live and The End of Meat have no upload from their makers yet. The same check found four film websites gone (letlivefilm.com
and theendofmeat.com now serve gambling sites; gamechangersmovie.com and aprayerforcompassion.com no longer exist), cleared with a
`ve_listing_edits` row each. Not yet: Amazon (Prime Video links not checked) and fields for these in the listing editor.
**On our podcast** (Sean, 2026-10-29: "include the podcasts that I did with the directors on the films... a few doctors that appeared in
these films as well... anyone else that's been in a documentary"; migration `20261029_film_podcasts.sql`): under About, a film lists our
episodes with the people who made it or are in it (`details.film_podcasts` `[{show, guid, with, person?}]`: the show's Directory slug, the
feed guid, "Keegan Kuhn, co-director" or "Dr. Michael Klaper, in the film", and their People slug), read through `ve-podcast` `episode`
(`loadFilmPods` in `directory/listing.html`), two across on desktop, the directors first, Play in a player docked above, with their People tiles above it. The directors panel (Vegans Explore Podcast 57: Shaun Monson, Louie Psihoyos, Marc Pierschel,
Keegan Kuhn) is on Earthlings, The Game Changers, Live and Let Live, The End of Meat, Cowspiracy, What the Health and They're Trying to Kill
Us; John Lewis on They're Trying to Kill Us; Klaper on Cowspiracy and What the Health; Barnard on What the Health, Forks Over Knives, Eating
You Alive and They're Trying to Kill Us; Dotsie Bausch on The Game Changers. Who is in which film is checked against its cast before a row
goes in (Klaper is not in Forks Over Knives or Eating You Alive). The four directors got People profiles the same day (Sean: "Can you
create people profiles for those directors?"; migration `20261029_people_directors.sql`): Shaun Monson, Louie Psihoyos and Marc Pierschel
were quarantined rows from the May Instagram import and became the profiles (handles kept), Keegan Kuhn is new; Content Creators, credited
as Panelist on episode 57, their films as Their work (our own pages open in place), bios from the panel's transcript (recorded in spring
2020, so read for dated lines), moments by the content index's speaker labels. Photos: Shaun and Louie from their Instagram; Marc's
account is his studio's rabbit logo (removed) and Keegan's was not found, so both show their letter.
**Featured people** (named People in this film until Sean's "people featured people" the same day; Sean, 2026-10-29: "their same tile that we have in their directory featured on their page. So they could even vote
for them"; migration `20261029_film_people.sql`): above On our podcast, the People listings who made the film or are in it
(`details.film_people` `[{person, role}]`) as the Directory's own card with Votes (`loadFilmPeople`, which loads
`/public/ve-region-directory.js` on first need), two columns (Sean, 2026-10-29: three squished the words), one on phones. What the Health: Joel Kahn, Klaper, Barnard;
Cowspiracy: Klaper; Forks Over Knives and Eating You Alive: Barnard; They're Trying to Kill Us: John Lewis, Barnard; The Game Changers: Dotsie
Bausch; and since the same day the four directors as Director or Co-director, sorted first. IMDb and Wikipedia do not resolve from the build session, so casts were checked through published cast listings; Torre Washington
was not found in The Game Changers' cast and is left out until it is confirmed.

## Podcast episodes on a listing (Sean, 2026-10-27)

"Is it possible to add an RSS of the podcast so that way it actually populates on their listing? ... people can actually just
listen to the episodes on our platform... they can save the episodes. But it's all pulling from their RSS feed." Then, the same
day: "put the episodes on the overview page... their website, Apple Podcasts... Spotify, all the usual suspects... little square
icons... and then below it... the podcasts listed... with some pagination." A podcast's listing (category Podcasts) opens on its
Overview: About, **Listen on** (square icons: Website, Spotify, Apple Podcasts, YouTube, Amazon Music, the RSS feed, whichever it
has; `renderPodcastOverview` and `platformList` in `directory/listing.html`), then **Episodes**, shown only once its feed has
some: search, 20 a page with page numbers (first, last and two either side, `?epage=`), and an episode on its own view
(`?ep=<guid>`, Episodes / title back; an old `?tab=episodes` link lands here too). **Play** plays it in the player bar at the
foot of the window (one at a time, it keeps playing across tabs; inside the dashboard's frame the bar sits above the list);
**Save** is for members (anyone else gets the Passport window). The audio streams from the show's own host; nothing is copied.

**My Saves** (Sean, same day: "my favorites, or my saves... a section on the navigation just for members") is a dashboard tab
(`/dashboard/saves`, after Guides; `renderSavesTab` in center-console, read each time it opens): Podcast episodes (the little
picture, the title, the show, Play and remove, played in the same player bar; the show opens under the Directory tab) and Places
and brands (saved listings). The nav's account menu and Your tools' My Saves open it; it replaced My List
(`/account/my-list` still works and has Listings and Episodes).

**The page speaks to what it is** (Sean, same day: "it still has coding for restaurants... is this your podcast?"). `listingKind`
and `listingNoun` in `directory/listing.html` (place, show, work, brand; podcast, channel, book, film, brand, organization,
business) word the claim lines, the vote line and the locked Partner Dashboard; a podcast's Liz tour is three slides (her general
clips 1, 2 and 5) with podcast words and what is coming for podcasts. Her recorded line still says "your business" (new clips
would need recording). The owner's dashboard (`ve-partner-dashboard.js`, `kindOf`, the same lists) shows **Saves** in place of
Check-ins for anything but a place (who saved it; for a podcast, its saved episodes too, `ve-podcast` `owner_saves`, after the
claim is approved), counts what fits (a podcast: Episodes played, Listen on clicks, website, social), asks only for the logo and
the story, and a podcast's **Opportunities** are `PODCAST_OPPS`, all Coming: the Vegans Explore Podcast Network, promos on our
shows, production, network sponsorships, ad spots, clips and social promotion (interest through `ve-claims` `partner_interest`).
Plays (`play`, the episode's guid) and Listen on clicks (`listen`) are `ve_listing_events` kinds (migration
`20261027_ve_listing_events_actions.sql`, which also fixed the table refusing every visitor action from 2026-10-24 to 2026-10-27).

**Status from the feed** (Sean, same day: "if an episode has been posted within the last 6 months, we can consider it active.
Anything longer than 6 months... we'll say on hiatus... if a new episode gets posted... that can update the tag automatically").
**Never Ended** (Sean, same day: "We can't confirm it's ended because it could come back 3 years later... I would take offense if
somebody typed my podcast ended"): a show is Active or On hiatus, however old its last episode (migration
`20261027_shows_never_ended.sql` moved the five the feed had marked Ended). **Ended only when Sean confirms it** (Sean, 2026-10-30:
"you can use the ended on the Vegans Who Lift podcast because I can confirm they've ended. But Vegans Explore podcast will be coming
back"): `business_status` CLOSED_PERMANENTLY reads **Ended** on a show (`STATUS_WORDS` in `ve-region-directory.js`, `statusWords` in
`directory/listing.html`, `STATUS` in `ve-listing-admin.js`; a Status filter option), set by hand with `details.ended_at`, and
`ve-podcast` `syncStatus` keeps it until an episode newer than `ended_at` comes out (then Active). Vegans Who Lift is the first. `ve-podcast` sets a podcast's `business_status` from its latest
episode each time it reads the feed, and cron `ve-podcast-refresh` (hourly, `refresh`, x-cron-secret) re-reads feeds older than 20
hours, eight a run, and re-checks every status from what we hold. A save in the listing editor holds only until then. Media (show
and work) wears its status where other listings say how Vegan they are: the listing header's tag (Active, On hiatus;
Available for books and films) and the Directory card's tag (`mediaTag` in `ve-region-directory.js`), and media on hiatus stays in its
section and in Media's top 12 instead of moving to Closed. **Media is not a place** (Sean, 2026-10-27: VegNews showed San Francisco; "I don't think we need to have online there...
Available doesn't tell me anything"): a media card's line under the name says what it is, never a city or Online: Podcast or
YouTube channel or News outlet with its Active / On hiatus, Documentary film and its year, a book's type and its year
(`mediaMeta` in `ve-region-directory.js`; a book or film shows a status only when it is no longer available). The listing page
does the same (the header badge, no address chip, no address in Contact, the Directory breadcrumb, never a chapter's). The Media
section has no Area, How Vegan or Online / Closed filters, and every media listing counts in every chapter. **Books sort by type**
(`details.book_type`: Cookbook, Biography & memoir, Educational, Health & nutrition, Lifestyle, Children's; `BOOK_TYPES` in
`ve-region-directory.js`, `ve-listing-admin.js` and `ve-listing-media`, change all three), the year is `details.release_year`, both
read by the Directory as `release_year:details->>release_year` and set in the listing editor's **About the work** (books and films),
saved by the edge function `ve-listing-media` (super admin, a `ve_listing_edits` row each; `admin_listing` does not hold details).
**Sorting and status** (Sean, 2026-10-27): no sort by the day a listing was added anywhere ("I don't think people care
when I added the listing"; the old Most Recent and First Added only flipped the vote order); Sort by is Most Votes and A to Z, and
books and films add **Newest first** and **Oldest first** by the year they came out (no year goes last). A show's Active / On hiatus
is a **Status** filter on Podcasts, YouTube and News Outlets, not a sort (best practice: people want only the shows still going).
The 22 books were filed from their own descriptions (migration `20261027_media_book_types.sql`; Badass Vegan and Breaking Up with
Dairy as Lifestyle, The Cheese Trap as Health & nutrition, the rest Cookbooks); every documentary already had its year. **Other
media** (category `Media`) is hidden for now (Sean: "I don't know what media is"): not a pill, not in the editor's picker unless a
listing is still filed there, and its one listing, Zara Osei Media, was re-filed under Services > Content Creation & Media the same day, and Viva! (a UK Vegan
charity) moved from News Outlets to Community > Nonprofits, serving the London chapter (Sean: "move Zara and Viva"). On 2026-10-27: 47 Active and the rest On hiatus (among them SoFlo Vegans, Vegans Explore
Podcast, Vegans Who Lift, Pre-Vegans, Moby Pod, Keep On Cookin', The Ordinary Vegan and The Keto
Vegan). Listen on uses the platforms' own marks (`/public/icons/platforms/`, Simple Icons, CC0 shapes).

**The Vegans Explore Podcast Network** (Sean, same day: "I want people to want to join the network so that way they can be part
of our sponsorship conversations... They don't got to post anything on their podcast unless they're involved in a campaign...
they're going to be promoted on our platform regardless... you just got to become a member"). Media's banner has **Join our
network** (green, between See in the Directory and Expand), opening `/media/network` (`media/network.html`): four steps, one per
view (`?step=`): Your podcast (name, RSS or Apple link, website, hosts), Your audience (downloads a month, where that number comes
from, how often, where listeners are), Your social, What you want (sponsorships, promotion, promos, clips, production) and who to
reply to; sign-in at the button. Saved by `ve-podcast` `network_apply` into `ve_podcast_network_applications` (migration
`20261027_ve_podcast_network.sql`, matched to its Directory listing by feed, Apple id or name, `member_active` recorded) and emailed
to Sean. A non-member is asked to become a Founding Member ($11) on the thank-you screen. The offer itself (what a network show
commits to, its share of a sponsorship) is not set yet; the review of applications is Sean's for now.

- The feed is `listings.rss_url`. Left empty, `ve-podcast` finds it once from the listing's Apple Podcasts id (iTunes lookup,
  `feedUrl`) and saves it; an empty string means the team turned it off. Set it in the listing editor's **Episodes** field (shown
  for Podcasts), which reads the feed at once and says if it fails. On 2026-10-27, 54 of the 56 podcasts were found this way;
  The Ellen Fisher Podcast and Vegetarian Zen have no Apple feed.
- Edge function `ve-podcast` (`episodes`, `episode`, `save`, `saves`, `admin_feed`; verify_jwt off, the member token checked
  inside): the latest 300 episodes are kept in `ve_podcast_feeds` and read again after 6 hours (a failing feed keeps what we
  have); saves are `ve_episode_saves` (migration `20261027_ve_podcast_feeds.sql`). The page side is `/public/ve-episodes.js`
  (`VEEpisodes.mount`, `play`, `save`, `row`).

## Podcast analytics in BrandDesk Insights (Sean, 2026-11-04, playbook `podcast-network-transcript-upload`, titled VE Podcast Network)

"We don't have podcast analytics in the BrandDesk, in that Insights section... let's make that the first thing that we do." **BrandDesk >
Vegans Explore > Insights > Podcast** (HQ `components/branddesk/InsightsRoom.tsx`, `Podcast`; shown for brands in `PODCAST_BRANDS`) reads
`branddesk-insights` action `podcast` (`podcast()`, cached 3 hours in `ve_analytics_cache`, key `ins:podcast:<brand>:<from>:<to>`), from
Captivate (`analytics_connections` `captivate`, `VE_CAPTIVATE_API_KEY`; show in `PODCAST_SHOWS`). **What Captivate's API gives**, probed
2026-11-04 from the server (this build session cannot reach it): `GET /insights/<show>/overview?start&end` (`{hits}` = downloads; start
included, end excluded, so a day is start=d end=d+1; no dates is all time), `GET /insights/<show>/overview/<episode>?start&end` (one episode),
`GET /insights/<show>/monthly` (the last 12 months, this month, the total). **The first probe said no listeners, apps, devices or places endpoint exists; that was wrong** (guessed paths
were 404). The dashboard's own paths are in its public scripts (`my.captivate.fm`, an Angular app; read them, never guess) and the same API key reads them: see **Any period, the
audience and the first days** below. The view: downloads for the period against the one before, per day (every N days past
30 days), this month, last 12 months, all time, a line by month, and every episode's downloads in the period (up to 100 s of reading, then
`partial`). Proven 2026-11-04 on real numbers (30 days to Nov 3: 258 downloads, 389 the 30 days before; the daily and per-episode numbers each
sum to 258; 144 episodes read). A new brand's show is a `PODCAST_SHOWS` row and a `PODCAST_BRANDS` entry.
**Pages from Captivate's own dashboard, uploaded by hand** (Sean, 2026-11-04: "whatever can't be pulled by API, we can upload manually with a screenshot... the
ability to upload multiple... where people are listening from, what devices... the quarterly and monthly reports"): the Podcast view ends with **From Captivate's
own dashboard** (`PodcastUploads` in `InsightsRoom.tsx`): a kind (Where people listen, Devices, Apps and players, Report or overview, Something else), the dates
it covers (the page's period by default), an optional note, and a drop box for as many PNG, JPEG, WebP or PDF files as you like (25 MB each; a screenshot can be
pasted). Each file goes straight from the browser to the private bucket `podcast-reports` on a signed link, then a row in `ve_podcast_uploads` (migration
`20261104_podcast_report_uploads.sql`, RLS on, no policies) says what it is and when. They show below, by period, with Everything / kind chips, a lightbox for
pictures, Open and Remove (Remove only hides it; nothing is deleted). `branddesk-insights` actions `podcast_files`, `podcast_upload_start`, `podcast_upload_done`,
`podcast_file_remove` (super admins only; `podcast_upload_done` checks the file really is in the bucket). Proven live 2026-11-04 as Sean: a real upload to a signed link
registered, listed with a signed URL and removed; a wrong type, over 25 MB, another brand's path, a file never uploaded, bad dates and a call with no token were all
refused; the section checked at 1440 and 390 px against mocked answers (four files chosen, the wrong type flagged, three uploaded together). A 70-byte test image is
left in the bucket (Storage will not let SQL delete objects), with no row. Not yet: reading the numbers out of a screenshot into a chart, the podcast in the Analysis
write-up, first 7 and 30 day downloads per episode.

**Any period, the audience and the first days** (Sean, 2026-11-04: "if we do all time, every time you pull information... we could do a custom... use our sorters... for all of
the podcasts"; "the places are really important... both the country and the cities and provinces", to set beside Google's places and choose the next community;
`branddesk-insights` from vegansexplore-com d2fa4cb, HQ `bed59b7`, production READY, seen signed in as `vegan@lesaruss.com`; migration
`20261104_podcast_episode_firsts.sql`). **Four shows** in `PODCAST_SHOWS` (Vegans Explore, SoFlo Vegans, Vegans Who Lift, Pre-Vegans; Captivate ids from
`GET /users/<user>/shows`; its "Vegans Explore Network Exclusives" show is left out); HQ's Podcast view has a **Show** dropdown, its own **Period** (Last 7, 30, 90 days, This year,
All time, Custom dates; the Insights period box is hidden on this tab) and **Overview / Episodes / Audience / Uploads**, all in the address (`?show=&sub=&prange=&pfrom=&pto=`). **What
Captivate gives** (all probed 2026-11-04): `POST /insights/<show>/over-time` {gteUnix, lteUnix, interval} (interval must be one of 1h, 1d, 7d, 14d, 28d, 1M, 1y, null; `1d` gives
days at Eastern midnight, ms timestamps); `POST /insights/<show>/overview/range` {startTimestamp, endTimestamp} in unix seconds (a number; ms is refused) gives `byEpisode`
[{episodeId, total}] for every episode in one call; `POST /insights/<show>/range/` {start, end ISO, timezone, interval null, countryCode, types} with types `byLocation`,
`byUserAgentBrowser` (the app or player), `byUserAgentOs`, `byUserAgentDevice`; **countryCode must be sent: null gives every country (no provinces or cities), an uppercase ISO
code ("US") gives that country's provinces and cities with their parents; "us", "United States", "all" return nothing**; `POST /insights/<show>/basic` {gteUnix, lteUnix, isUnique};
`GET /insights/<show>/from-episode-publish` (each episode's first 28 days). **How it is built**: one all-time daily series per show (`over-time` 1d from the day before its
first episode, cached 3 hours, `ins:podseries:`) and every period, comparison, this month, last 12 months and the by-month line are cut from it with no new calls, so a custom range costs
nothing and "All time" starts on the first day Captivate has a download (Vegans Explore 2025-11-01, SoFlo 2020-03-03). **Audience** (`podAudience`): one range call for every
country, apps, systems and devices, then one call per country (ISO code from `Intl.DisplayNames`, `ccMap`) for its provinces and cities; places cannot be cut from daily totals, so each
period is its own cached call (3 hours). Proven: Vegans Explore all time 93 countries, 5,756 downloads, US 40 provinces and 230 cities, four countries without a code map keep only
their total; **All podcasts together** (Audience tab only) adds the four shows by name; **Download every place (CSV)** gives every country, province and city for the period.
Captivate's range total can differ a little from the daily downloads (230 against 258 on one 30-day window), and a province or city is only known where the listener's network
gives one. **First 7 and first 30 days** per episode: `ve_podcast_episode_firsts` (brand, show, episode, d7, d30, RLS on), counted once those days are over (calendar days from the
release day, Eastern), 40 episodes an Episodes visit while the page re-asks until none are left; the Episodes table sorts by any column. **View only for agent accounts**: `branddesk-insights`
refuses `podcast_upload_start`, `podcast_upload_done` and `podcast_file_remove` for `member_class` `agent` (403 `view_only`), so the standing QA login `vegan@lesaruss.com`
(already a super admin row) can read Insights and never change it; uploads are per show (`ve_podcast_uploads.show_key`, older ones stay on Vegans Explore). Captivate holds more
episodes than our table for SoFlo (111 against 59) and Vegans Who Lift (90 against 57), which may move the "all 278 transcribed" finish line. Not yet: reading numbers out of uploaded
screenshots (Sean's answer was not given; the API now covers places, apps and devices, so the uploads are for reports and anything else), a saved snapshot of the places for the community
decision (the CSV is the first step), and the one bad Vegans Who Lift failed-transcript row, which stays until Sean says delete.

**The run sheet mirrors Episode 144, and Captivate is one button** (Sean, 2026-11-06, playbook `ve-podcast-studio`; handoff `docs/handoff/2026-11-06-ve-podcast-studio-ep144-format-captivate.md`): every episode is opening sound, Sean's intro, Kai top stories, Liz what's new in the Directory (our own new listings), Dani from the community, Nori around the world, one commercial, Sean's outro, Kai's tag, closing sound; Propose news fills those four Guide slots and each script hands off to the next Guide. **Send to Captivate** at the bottom of an episode takes the finished MP3, show notes and an Eastern date and time, and **Approve and schedule on Captivate** uploads it and schedules it (HQ migration 080). Episode 145's rows are fixed live; the code is on HQ branch `claude/affectionate-keller-gfobbo`, not on HQ main until Sean says merge. Not proven: a real upload and schedule.
**Episode 145 and the studio fixes** (2026-11-06, playbook `ve-podcast-studio`; handoff `docs/handoff/2026-11-06-ve-podcast-studio-ep145-scripts.md`). HQ main has the 144 format, Propose news and Send to Captivate (5057bdd). Fixes: Propose news filters to Vegans Explore inside the query, skips social-post leads and ranks real outlets first (bdec7d4); the script writer gets max_tokens 16000 and saves nothing unless stop_reason is end_turn, since Opus 5.5's thinking counts against max_tokens (25168e1). **Every Claude call on the 5.x models needs room for thinking**: a small max_tokens returns a cut-off or empty answer (audit filed in Blueprint > Ideas). Ep 145 has Jane Velez-Mitchell's own words from VEP 43 as a drop-in after Liz's Directory spotlight and a Maya spot on the Guides before the commercial. Our own episodes' audio is read through the database (`net.http_get` on the enclosure gives the real `podcasts.captivate.fm/media/...` link), and podcast audio can run seconds off TurboScribe's YouTube timing, so stt a window before cutting a clip.
**Music under Sean's intro, every episode** (Sean, 2026-11-07, playbook `ve-podcast-studio`): the opening sound starts at full as always, then ducks under Sean's intro to the Guides' bed level (about 19 dB under the voice), runs the whole time he talks and fades out into the next segment; the intro segment's `bed_path` is the opening sound. Ask Sean before skipping it on a very long intro (Ep 144 ran about 10 minutes). Ep 145 is `episode-final-v3.mp3` (only the first 44 s differ from v2), set as `final_path`, so Approve sends that file.
**Episode 145, Sean's voice and the Captivate time fix** (2026-11-06, playbook `ve-podcast-studio`; handoff `docs/handoff/2026-11-06-ve-podcast-studio-ep145-voice-and-schedule-fix.md`). **Captivate reads an episode's `date` as wall time in the show's zone (America/New_York)**: Ep 144 (7:00 AM Eastern) is stored 07:00; the button had sent UTC and would have aired 145 at noon. Fixed on HQ main 60573ed. Sean's intro and outro are voiced in his own Higgsfield voice (`seed_audio`, element "Sean A. Russell"), stt-checked, long pauses trimmed; if he does not like a take he records his own. Ep 145 runs: intro, Kai's Coming up today, a commercial, Kai, Liz, a commercial, Jane's clip, Dani, Nori, Maya, a commercial, outro; the outro and Maya point to the Explorer Guide.
**Episode 145 final, and the studio's rules** (Sean, 2026-11-06 to 07; handoff `docs/handoff/2026-11-07-ve-podcast-studio-ep145-final-ready-to-schedule.md`): one story per segment, each with its own 100-second bed (`STORY_BEDS`), stories 60 to 90 seconds with background, music under every segment but commercials, no prices in spots or scripts, pronunciations Sean picked from samples (foie gras normal, Vellez Mitchell, Veegan(s), Vegans Explore dot com, dates as ordinals) in HQ `spoken()`; make short samples before re-recording. Ep 145 is `episode-final-v2.mp3`, all segments approved and locked, show notes saved; Sean schedules it. The Nonprofit Guide spot is parked until the nonprofit outreach is ready.
**Kai's tag is the Founding Membership reminder** (Sean approved 2026-11-07, playbook `ve-podcast-studio`; handoff `docs/handoff/2026-11-07-ve-podcast-studio-kai-founding-tag.md`): the old tag (`media/podcast/tags/kai-get-involved-v2.mp3`) said "Get your Passport... $11 one time... 1,100 points", against the no-prices and survey-only rules. Every episode now closes with `media/podcast/tags/kai-founding-v1.mp3` (31 s): Founding Membership closes at midnight January first, big things in 2027, a front-row seat, join at Vegans Explore dot com. **Ep 145 airs `episode-final-v4.mp3`** (v3, which added music under Sean's intro, plus the new tag; supersedes the v2 above). HQ's `TEMPLATE` in `lib/podcastStudio.ts` points new episodes at the new tag on HQ branch `claude/vibrant-franklin-mibljs` (d1ea7f8), not on HQ main until Sean says merge. Saving an MP3 again drops about 0.2 dB, so match levels to the file before. Captivate can be read from the database without printing the key: `net.http_post` to `/authenticate/token` with JSON (username, token from `lesaruss_secrets`), then `net.http_get` with the token read inside SQL.
**Two playbooks, one owner each** (Sean, 2026-11-05: "agreed"): `ve-podcast-studio` owns making the weekly episode in BrandDesk > Vegans Explore > **Podcast** (HQ `PodcastRoom.tsx`, `/api/branddesk/podcast`, migration 079: run sheet, news, scripts, voicing, commercials, Kai's tag, the network tag pre-roll, sending to Captivate by hand); it reads no Captivate numbers and its line "Listening numbers are in Insights" links to Insights > Podcast for the open show. `podcast-network-transcript-upload` (Watching) owns transcripts, Insights > Podcast, the Analysis write-up, the parked production service and the relaunch reels until they close (future reels: `ve-social-studio`). The top-level Podcast tab and the Insights > Podcast toggle are different levels with their own addresses.
**Insights holds every analytic, Podcast included** (Sean, 2026-11-04: "I wanted to be able to look at all of the analytics in one go... podcasts will become its own tab later", a Podcast
tab for making the podcast; when it comes it links into Insights > Podcast and never copies the numbers). **The Analysis write-up reads the podcast** (`branddesk-insights` v14 from 9c246f3,
source sha256 9fb6f2dd matched): `podcastFacts` gathers, per show, downloads against the period before, top episodes, first 7 and 30 days of the latest episodes (read from
`ve_podcast_episode_firsts`, no new Captivate calls) and, from one light range call (`podAudienceTop`, no province or city calls), top countries, apps, systems and devices as shares; `Podcast`
is a section in the schema (`area` enum); a brand with no `PODCAST_SHOWS` row gets `podcast: null` and the writer leaves the section out. The prompt says downloads are never listeners, that the
country `AA` is not a real country (say not placed, do not guess), and never to call a country bots or a data center. The analysis cache key is `ins:analysis2:` (bumped so the old six-hour copy
did not hide the section) and `max_tokens` is 8000: six sections at 3000 were cut off and returned `model_output`, which now names its `stop_reason`. Proven 2026-11-04 on vegans-explore,
2026-10-05 to 2026-11-03: a Podcast section, verdict mixed (Vegans Explore 230 against 413, SoFlo 539 against 106, Vegans Who Lift 247 against 195, Pre-Vegans 42 against 8). Not yet seen in a browser.
**The Audience layout** (HQ main 7063d6e, seen signed in on the branch preview first): the Insights page is white (`.bh-root:has(.in-root)`), the active toggle has white text, and Countries and
State or province / City are two boxes fixed at 10 rows (`.in-aud-box`, `Table scroll`) that scroll inside; the right box shows a turning globe until a country is picked, then states, with a Show cities /
Show states toggle, a click on a state shows its cities (`United States › Florida`), and a new country resets to its states; phones tighten the table. **Then, 2026-11-04 evening** (Sean: "go on AA and the
scrolling boxes"; HQ main 64e879e, production READY, seen on the branch preview at 1440 and 390 px): Captivate's country `AA` (309 downloads on Vegans Who Lift all
time, none in the last 30 days) reads **Not placed** in the Countries list, the right-hand box (with its own note) and the CSV (`cname` in `PodcastAudience`), and
Apps and players, Systems and Devices are fixed 442 px scrolling boxes like the places (a title and N in all, a sticky header; a list of 8 or fewer shrinks to fit,
`.in-aud-box.fit`). The Analysis write-up was read against the Podcast tab the same evening and matched (1,058 against 722, every percentage, Portugal 17.0%, Overcast 37.4%).
Not done: a possible-bots caution on Portugal (17.0% of Vegans Explore) and Chrome (71.4% of Pre-Vegans), a guess Sean has not asked for; a saved snapshot of the places. **The headless login worked again** (canon
`agent-headless-page-verification`, replacement 2026-10-27): a one-time function mints the vegan@ magiclink session and builds the `sb-fwbhwfxpncrsfhttimna-auth-token` cookie into a file; a Vercel
branch preview needs `get_access_to_vercel_url` first (its `_vercel_share` link); Playwright in this session reached both. Sign the session out and stub the function afterwards (`ve-once-qa-session`, 410).

## Episode pages as a discovery engine (Sean, 2026-11-08, playbook `ve-podcast-studio`)

"Anybody mentioned, any organizations... any city that's brought up here, we put them in a holding pattern... when people go on these pages,
it's a discovery engine for other things." Mocked four rounds and approved. An episode with structured notes (`ve_episode_notes`, listing + guid,
read through `ve_episode_notes_get`; migration `20261108_episode_notes.sql`) draws `rich()` in `public/ve-episodes.js`: art beside a short title,
summary, Play / Save / Share and section links (on phones the art is 180 px with the three buttons stacked to its height); each segment with its
Guide and its stories, every story with the Directory's own cards (`VERegionDirectory.card`), chapter cards (`VEChapters.mount({only})`) and one
See more in the Directory line; In this episode (pills by kind); Places on this episode; Keep listening (this file's `row()`, with Save). Use the
existing components, never new tiles. Mentions not in the Directory yet are held (quarantined, tag `ve-held-place`, named in `notes.held_listings`),
and places that are not chapters are logged to `ve_place_mentions`, the first rows of the chapter rankings (a playbook to open). Episodes with no
notes keep the plain view. Episode 145's notes were written by hand. **Merged to `main` 2026-11-08 (91eb394, Sean: "merge")** and checked live at
1440 and 390 px (no errors, no sideways scroll; signed out, Save, a Directory card's Vote and the chapter card's Vote and Save open the members
prompts; Play builds the player on the right Captivate file, which this build session cannot reach). **The studio builds them from the run sheet**
(merged to HQ main 2026-11-09, dc8f0fb, Sean: "merge"): BrandDesk > Podcast > an episode > **Episode page**: Build the
page (draft; Claude Opus 5.5 from the run sheet only, `notesPrompt` in HQ `lib/episodeNotes.ts`; names matched to approved listings or ones already
held, outlets by name, places through `ve_chapter_of`; `preview: true` returns it unsaved), then **Publish** (live, non-chapter places to
`ve_place_mentions`, each new name made a held listing). A live page is never overwritten (take it down first). Proven on Episode 145's run sheet in
76 s. Episodes 144 and 145 are numbered on Captivate (season 1) since 2026-11-08, and scheduling now sends the number. Rich Roll's People profile and vegconomist (News Outlets) were added the
same day. Podcast subscriptions (one tile per show in My Saves, New since your last visit, an opt-in daily-at-most email) are approved and queued.
Handoff `docs/handoff/2026-11-08-ve-podcast-studio-episode-discovery-page.md`.

## City shows: SoFlo Vegans relaunches as South Florida's weekly show (Sean, 2026-11-09, playbook `ve-city-shows`)

"We'll start with SoFlo Vegans. We'll do that for a while and we'll see where we go from there... Yes to Wednesdays at 7." A city show is
a weekly episode built from one chapter's Pulse, Directory and events, voiced by the Guides, with Sean opening and closing and a Local voice
(always asking their Vegan origin story, which feeds `ve-pre-vegan-guide`). SoFlo Vegans is the pilot on its own Captivate feed, Wednesdays
7 AM Eastern, season 10, from episode 112 (112 airs Wed Nov 11 as the relaunch, never called a preview). No second city until Sean decides.
HQ `lib/podcastStudio.ts` (`SHOWS` day/season/first/chapter, `CITY_TEMPLATE`, `slotsOf`, `templateOf`); Propose news reads only the chapter.
**The tip line** is on the show's page: `details.show_line` {message, nominate} on a podcast listing draws **Be part of the show** (Leave a
message, Nominate someone), each a multi comment request (`/comment/soflo-line`, `/comment/soflo-nominate`). **Sean's voice** (Higgsfield
seed_audio, element Sean A. Russell) glitches: two takes, reword a tripped line, rebuild from stt word timings with capped pauses, check word
for word before sending. Handoff `docs/handoff/2026-11-09-ve-city-shows-soflo-vegans-relaunch.md`.


**Local Voices and People > Intake** (2026-11-12 to 13, Sean: "Approved, keep the names, start building it"). Every lead lands in People > Intake (ve_intake); Local Voices draws its good fits into a pipeline in HQ Outreach (Queued, the picture check, drafts, Sean's OK, Sent). Comment pages carry Sean's personal note and recording. Full record: `docs/handoff/2026-11-13-local-voices-and-branddesk-sweep.md`, mock `/mocks/local-voices`.
