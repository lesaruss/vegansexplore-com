# History: search

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Universal search (Sean, 2026-11-02, BOSS run, playbook `ve-universal-search`)

"I should be able to search what I'm looking for, and then it just shows up, no matter what the category is... Who needs a filter when you
know what you're looking for?" Then: "We're not doing this for the vegan crowd. We're creating a prototype for something that we're going to
be reaching out to every single business on. Vegans Explore is just a proof of concept." So the engine holds nothing Vegan: the words it
knows, the places it knows and what people looked for are rows per brand, and a new brand adds rows, never code.

- **One search box on every page**: the Search button in `nav.js`'s bar (or `/`) opens a bar under the menu (`/public/ve-search.js`,
  `VESearch.panel`); typing shows a short list (what we read, then the best matches, nearest first), Enter opens `/search?q=` (`search.html`,
  `noindex`, the Vault page's family): what we read as chips, a notice when nothing is near ("We have nothing in Claremont yet. These are the
  closest, about 6 km away"), category chips and Best match / Nearest first, all in the address (`?q= &cat= &sort=`). Any text input can become
  the box with `VESearch.mount(input, opts)`. The mic from `ve-dictate.js` rides on it, so you can speak a search.
- **The engine** is the database function `ve_search(q, lat, lng, limit, brand)` (migrations `20261102_universal_search*.sql`), behind the
  public edge function `ve-search` (verify_jwt off). It reads the sentence: **a place** (`ve_search_places`: every city a listing is in, plus
  nicknames such as NYC and LA through `shows_as`, plus a few added by hand), **a kind of thing** (`ve_search_vocab`: a phrase maps to listing
  categories, product kinds and cuisines, all of which must match; plurals and misspellings are read, and a half-typed last word is completed),
  and the leftover words as a name. Then it ranks: name match, votes, Vegan status and distance (places you walk into only; a product you can
  buy anywhere ignores distance; a local place with no pin sinks). It leaves out what the Directory leaves out: closed, LESARUSS.ai-only and
  not-yet-vetted food places. `ve_search_core` is the engine and `ve_search` the wrapper that completes a half-typed word.
- **No floating mic on the search box** (Sean, 2026-11-02: it crowded the clear button and was easy to hit while deleting; phones dictate from their own
  keyboard): `VESearch.mount` marks every search field `data-dictate="off"`, so `ve-dictate.js` skips it. Every other form keeps its mic.
- **Distances show in miles** (Sean, 2026-11-02); the engine returns km and `VESearch.kmText` / `away` convert in the browser. The "nothing near" notice
  fires past 40 km (25 miles).
- **A phone is asked for its place only on a "near me" search**, kept for the visit (`sessionStorage` `ve_geo`).
- **The log** (`ve_search_log`: the words, the place read, whether anything came back, how far the nearest was, a random visitor id; RLS on, no
  policies) is written only for a search the visitor sent (Enter or a pick), never each keystroke. Zero-result searches are the list of where
  to grow next and the numbers for outreach to businesses ("people searched for what you sell in your city").
- **The benchmark comes before the interface and after every change**: `ve_search_benchmark` (53 searches scored, 2 known gaps listed, not
  hidden) and `select * from ve_search_benchmark_run()`. Pass rate 61 of 61 on 2026-11-02 after four rounds (round 1 was 42 of 50 once the
  scorer was fixed). It is a set Logan wrote, so it can flatter the engine: add real searches from members and from `ve_search_log`.
- **Known gaps, on purpose**: a venue by name (Hard Rock Stadium) and what a store carries (plant milk at Publix) are not in search yet; the
  results are listings only (Directory, People, Products); Events, Guides, recipes, the Pulse and a place's menu come next. Claremont had no listings on 2026-11-02; its nearest was Pomona, 6 km.
- **The gazetteer** (Sean, 2026-11-02: "cool with that"): `ve_search_places` holds **GeoNames cities500**, 236,874 places of 500 people or more
  worldwide, loaded by a one-time function from geonames.org (this build session cannot reach it; the edge function can), plus the chapter
  cities our listings sit in and nicknames (NYC, LA, DC, Philly) that show as their city (`shows_as`). `key` is the lower-case, no-accent name a
  person types; the engine tries every run of one to four words against it by index, a bigger town wins a tie (`population`), and a US state or
  nothing after the name is fine ("Asheville NC"). **A place word that is also a town needs in, near or around** (`ve_search_place_words`:
  reading, mobile, surprise, normal...; any phrase in the vocabulary; any GeoNames town under 20,000 people, so "vegan reading list" is not
  the town of List). Google geocoding stays a fallback only (its terms allow caching coordinates 30 days). **GeoNames is credited** on
  `/policies#terms` (Credits) and under the results, as its Creative Commons Attribution license asks. Refresh by running the load again (the
  geonameid is unique); GeoNames changes daily and ours is as of 2026-11-02. Not done: GeoNames alternate names (so "Munich" finds München) and
  proximity to the visitor when two towns share a name.
- **The content lane** (Sean, 2026-11-02: "how do I convince my family to go vegan... reference all of the podcasts... not just the directory
  listings"; migrations `20261102_universal_search_content*.sql`): the same box answers questions with content, in groups. `ve_search_content(q,
  limit, brand)` reads topic phrases (`ve_search_topics`, a row per phrase, so a new brand adds rows), then returns **moments** from our shows
  (`ve_content_moments_live`: quote, speaker, the second it starts; opens `/pulse/<slug>?t=<seconds>`, which `api/pulse-article.js` starts the
  video at), **our episodes** (`ve_pulse_content.search_vector`) and **other shows** (`ve_search_feed_episodes`, titles and descriptions only,
  refreshed by cron `ve-search-feed-refresh` every 6 hours, labeled as such). `ve-search` runs it beside `ve_search` (`content`, `content_limit`);
  the log's intent adds `topic: <label>`. **Ordering**: a topic question leads with our content and hides listing rows (a link goes to the Directory
  search); a place or thing question leads with the Directory and shows no content ("sushi near me", "vegan restaurants in Claremont"). Content
  benchmark: `ve_search_content_benchmark_run()` (24 cases, one known gap: documentaries on Netflix). Weak spots: an episode with no transcript
  matches on title and summary only, and other shows never match on what is said. Every SoFlo Vegans transcript Sean adds improves it.
- **A store and a thing** (LOCKED by Sean 2026-11-02, playbook `ve-store-scan-search`, canon `canon-ve-store-scan-search`; migration
  `20261102_store_scan_search.sql`; Sean, from a Walmart at 8:31 AM: "scan an item... see if it's vegan, organic, GMO free... see where all the vegan
  items are in the store... bounties so people can scan the stores... the last time it was checked... the scan part be the free thing in a Taste
  guide, and the full package is the supermarket guide"). **Search**: `ve_search_store(q)` reads a store (`ve_store_aliases`) and a thing
  (`ve_store_search_terms`, a row per phrase with its product types and an optional `made_from_like`, so "oat milk" is only oat products), and
  answers "does Walmart carry vegan ice cream", "oat milk at Target", "what is vegan at Whole Foods" from `ve_product_stores`. A store with nothing for
  that thing says **Not confirmed yet**, never a guess; each item shows **Checked in a store N days ago** (`ve_product_stores.confirmed_at`) or
  "From the Guides, not checked in a store yet". `ve-search` returns it as `data.store` (the Directory listings and content are left out then); the
  box shows an **In the store** group and `/search` an answer card (`VESearch.storeSay`). **Scan**: a result shows **Vegan, Organic, GMO free** as the
  package says (Open Food Facts labels; `flags` on ours, `off.organic` / `off.gmo`), else **Not stated**, never inferred. **Sightings**: on a scan
  result a signed-in Passport holder picks a store and taps **I see it here** or **Not here** (`ve-products` `sighting`, `ve_store_sighting_save`,
  30 a day, `ve_store_sightings`, RLS on); a yes on one of our products sets that store link's `confirmed_at`. The carried tiles show it. **Honest
  limits, 2026-11-02**: only the 86 dairy-free product lines are linked to stores (Walmart 15, none for ice cream or animal crackers), so most
  questions answer Not confirmed yet.
  **Location-checked sightings and the chain registry** (Sean, 2026-11-02: "I can lock it in for Publix and specifically that location... Publix is
  known to carry this product... people go in and they say, I don't see the product... if enough locations don't carry it, then maybe that raises a
  red flag... once we're able to get sponsored by a supermarket, maybe there's a way for us to get access to their inventory"; migration
  `20261102_store_location_sightings.sql`, `ve-products` version 7). On a scan result, **Standing in a store?** > **Find my store** reads the phone's
  position (`nearby_stores`: the mapped supermarkets, `ve_venues` kind supermarket, nearest first), the member picks the store and taps **I see it
  here** or **Not here** (a photo of the empty spot is optional and pays more), and `sighting_at` (`ve_store_sighting_at`) refuses unless the phone is
  inside that store (its `radius_m` plus up to 100 m of accuracy, nothing worse than 500 m, the venue reports' own rule). Only an item with a live
  barcode (one we know is Vegan) counts; one report per member, store and item a day (`ve_store_sightings.venue_id`, `local_day`). Small points,
  capped a day, paid at once for a location-checked report (`ve_site_settings` `store_sightings`: seen 2, not here 2, with a photo 5, 20 a day;
  `venue_report` in the ledger, ref `sighting:<id>`; no sponsor multiplier yet). A yes sets the chain's `ve_product_stores.confirmed_at`. **The
  registry rolls up per chain** (`ve_item_chain_counts`: the latest report from each location in 60 days): Seen at N locations, last seen, missing at N;
  the scan result's Carried at, the search answer and the Guide say so. **The red flag**: an item is flagged when at least 3 locations say Not here and
  at least 30% of the locations that reported say so (`flag_min_locations`, `flag_share`, `window_days`, all in that setting); nothing comes off a
  registry on its own. **Depot > Venues > Flags** (`ve_item_flags`, `ve-products` `flags`, `flag_decide`): Still carried (the flag returns only on newer
  reports) or Take it off the registry (`ve_item_flag_reviews`, `removed_at`; a member's yes brings it back). **Bounties**: a store's page has **Help check
  this store** (`store_gaps`, `ve_store_gaps`): items its chain carries that nobody has checked there lately, flagged ones first, each a scan away.
  **Inventory later** is another source of the same rows (a feed from a sponsoring supermarket), never promised before one agrees. Publix is the only
  chain with stores mapped, so only Publix areas (South, Central and North Florida) can report today. **Not built yet**: the scan as a Taste slide,
  business confirmation, a sponsor multiplier on sighting points, a sighting of a barcode we do not hold feeding search, other chains' stores.
- Not built yet: the same engine on LESARUSS.ai (it needs its own vocabulary rows and `VE_BRAND.searchBrand`), search inside the dashboard's
  frame, "recent searches", and a map. Checked in a browser against the live function at 1440 and 390 px beside the Vault page.

## When search has no answer: Liz, the queue and the editorial loop (LOCKED by Sean 2026-11-03, canon `canon-ve-search-questions`)

Sean typed "vegan suit" and got "nothing matches yet". "Every question that you ask helps us make this knowledge base better... our team
is going to work on getting the answers... we will send you a notification... Liz be the one who delivers that message... sleek, clean."
Then: "we can use this as an editorial tool... if somebody's asking for a suit... maybe we should write an article on vegan suits...
Our guides are these tools, these enrollment tools, but it's also where we're putting this content. And if people search, they can get
those same information." Locked: "Lock it in." (migrations `20261103_search_questions_queue.sql`, `20261103_search_questions_canon.sql`)

- **A search with nothing back is a question for our team.** `ve-search` queues it once (`ve_search_questions`, one row by its words,
  `ve_search_ask`; every asker kept in `ve_search_question_askers`, counted once per email or visitor), so a duplicate adds an asker,
  never a row. Statuses open, working, answered, set_aside; `guide_slug` is the Guide it belongs in; `answer_text`, `answer_url`.
- **Liz tells them** (`VESearch.askCard`, `askNote` in `public/ve-search.js`; the empty state of `search.html`): the first time a visitor
  hits a dead end she opens as a card (her picture, "We don't have that one yet", four short lines, an optional email to send the answer to,
  used for nothing else); after that a one-line note, "It's in our team's queue... How this works", which reopens the card
  (`localStorage` `ve_ask_seen`). Her lines are text drafts for Sean. No turnaround is promised, only that the team works the queue every
  day; the email is not a subscription.
- **Search is an editorial tool**: the queue, most asked first, says what to write; content made for a question goes into the Guide it
  fits as added value, and search finds it. The Guides are the site's blog, with no separate blog page.
- **Built 2026-11-03**: both tables, `ve_search_ask` (service role only), `ve-search` `ask` (and every zero-result logged search is queued),
  Liz's card at 1440 and 390 px. **Built 2026-11-03: **Depot > Search questions** (`/admin/depot/search-questions`, Content in the Go to menu; `ve-search` `q_list`, `q_get`, `q_set`, `q_notify`, `q_setting`, super admin token, in `ve-search` v6 from e816d07): chips Open / Working / Answered / Set aside / Quarantined / All, a Guide filter and search (`#list/<status>/<guide>`), one question per view (`#q/<id>`: who asked and how many left an email, the Guide it belongs in, the answer text and link, a note, status buttons, and the email as Liz sends it). **Emailing askers is off until Sean turns it on** (`ve_site_settings` `search_answers` `send_on`, the switch on the page); Send me a test works either way; each asker is told once (`notified_at`), through `email-send` brand `vegans-explore`, campaign `ve-search-answer-<id>`, suppressions respected. Liz's email is a text draft for Sean. **Not built yet**: an Inbox notice when answered, Guide
  articles found by search, and more vegan suit brands (Suits & formal has WILDA.ECO since 2026-11-03; Hangrr and Sartoro sell wool too, Brave GentleMan shows no sign of trading). Open: who works the queue
  daily; whether a signed-out email also joins the Daily Pulse list (default no until Pulse subscribe exists).
