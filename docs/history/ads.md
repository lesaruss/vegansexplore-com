# History: ads

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Ad rail (Sean, 2026-10-04)

Three-fourths content, one-fourth ads on the right, on: the Daily Pulse (`/pulse`, every tab and post, and so the
dashboard Daily Pulse tab), the dashboard Events tab, `/events`, the Directory (`/directory` and the
dashboard Directory tab) and Media (`/media` and the dashboard Media tab, the chapter's rail like the Directory's). Not on
Communities or Tools (a Directory listing page has its own billboard).

The Directory's rail is the **chapter's** (Sean, 2026-10-26: "those banners will appear throughout the entire chapter...
Central Florida will have its own... all that's real estate that people can purchase ads on"): two 300 x 250 banners stacked,
the same two landscape slots as that city hub's billboard (`<adPrefix>-landscape-1/-2`, page `/communities/<slug>`), so one
buy runs on every page of the chapter; All cities uses `/directory`'s pair (`ve-directory-landscape-1/-2`). The rail is
`data-ad-page="chapter"` and follows the city picker (`VEAdRail.chapter(rail, slug)`). Beside it the Directory is three cards
across (two under 1280 px, one on phones), and a card's name shows whole, up to four rows, never cut with an ellipsis. The card's right side is the count over **Votes** (the word is the button) and, for super admins, **More** (a dropdown with Edit and Review, room for more; `adminBtn` in `ve-region-directory.js`; Sean, 2026-10-27).

**One ad per page** (Sean, 2026-10-27: "it's either going to be the long one or two short ones, not both"): the Pulse
(and its post pages, `api/pulse-article.js`), Events and the city hubs show one tall 300 x 600; the Directory and Media show
the chapter's two 300 x 250s; a Directory listing keeps its one 300 x 250 in the info column (Sean, 2026-09-27). A city hub's
rail is its tall slot (`data-ad-page="hub"`, `data-ad-chapter` the hub slug; the rotating Billboard is gone), at the Pulse's
width (three-fourths and one-fourth, the slot a full 300 px). Under every ad, filled or not, **Your ad here / Advertise with
Vegans Explore** links to `/business#/found`, the business page's Get found (`CTA` in the script; Sean, 2026-10-27). The rail sticks 16px under
the site's menu (`--ve-nav-h`, set by `nav.js`).

**Every slot filled** (retired 2026-10-31 for our Guides, below; Sean, 2026-10-27: "imagine Humble Cabbage wasn't one of our brands... a test campaign pre-launch... and
we can slowly systematically update the real estate later on"; migration `20261027_humble_cabbage_test_campaign.sql`). Every
slot the site draws carries a Humble Cabbage ad under its one sponsor campaign (`ad_sponsor_campaigns` `humble-cabbage`), its
characters spread across pages (never the paused "$5 to the LESARUSS Foundation" art), each page with its own tracked link
(`/go/hc-ve-events`, `hc-ve-all-cities`, `hc-ve-<city>`, besides `hc-ve-pulse`, `hc-ve-sofl`, `hc-ve-directory`), so impressions
(`ad_impressions`) and clicks read by page. A real advertiser takes a slot by replacing that slot's Humble Cabbage campaign.

**House banners on listings** (Sean, 2026-10-31: "create that for other guides and sprinkle it throughout the website... that's the
only banner on the right-hand side... remove the humble cabbage... make sure we're tracking it in ads... which member clicked it, how
many times they clicked it... follow-up communications"; migration `20261031_house_banners.sql`). A Directory listing's right column
has no billboard or Humble Cabbage any more: a **People page** shows only "Is this you?" and the **Become a creator** banner, and **every
other listing** (not a brand page, which keeps its Guide house ad) shows one animated **Guide banner** (`guideBanner` in
`directory/listing.html`, `VEPromo.guideCard` and `GUIDE_ADS` in `public/ve-promo.js`): the Airport, Dairy or Stadium & Arena Guide at
random; four scenes from the Guide's own art, a headline each, a
line and Get the <Guide> · $11; never the Guide the listing's Guide tab shows (below), so a food place's is the Airport or Stadium &
Arena Guide. A demo page shows it without counting (`preview`). **Tracked as ads**: the sponsor campaign
`ve-house-banners` (Vegans Explore) holds a campaign per banner, linked to two placements, the listing's right column
(`ve-listing-house-banner`) and the People page's (`ve-people-house-banner`), with their own `page_slug` so `ad-resolve` never counts
them; the page counts a view (the banner on screen, bots left out) and a click into `ad_impressions` through `ve_house_ad_count`, which
takes only this sponsor's campaigns. **Members by name**: each banner leaves through its own tracked link (`/go/ve-guide-airport`,
`ve-guide-dairy`, `ve-guide-stadium`, `ve-creator-banner`; initiative `ve-house-banners`, tags `house-banner` and the Guide), so
`ve-links` logs every click, `nav.js` names the signed-in member on it, and `ve_initiative_interest` keeps each member's clicks and count
for `/dashboard/leads` (filter the campaign ve-house-banners and the Guide's tag, export for follow-ups). A new Guide banner is a
`GUIDE_ADS` entry, an `ad_campaigns` row under the sponsor, its `ad_campaign_placements` row and its `/go/` link.

**Our Guides fill the rails, Humble Cabbage the second of each pair** (Sean, 2026-10-31: "we should have the majority of our ads be the
guides instead of Humble Cabbage, because that is a better front door... just make them all our guides, but just create an assortment of
them around the different places"; migration `20261031_guide_ads_retire_humble_cabbage.sql`). Every Humble Cabbage campaign and its sponsor
campaign are `paused` (kept for their history; one set back to active returns that slot). Six rail campaigns under the house sponsor
(`ve-house-banners`, ids `...0c0de5a14001` to `14006`): the Dairy, Restaurant, Stadium & Arena, Airport, Nonprofit and Creator Guides,
each the HTML5 ad `/ads/guides/guide.html?g=<guide slug>` (the listing banner's animated card: four scenes, a headline each, the Guide's
line on a tall slot, Get the <Guide> · $11; it fits any slot, and drops the line on a short or wide one) and its own `/go/` link
(`ve-guide-dairy`, `-restaurant`, `-stadium`, `-airport`, `-nonprofit`, `-creator`). Each slot carries one Guide, spread so neighbouring
slots differ and the Stadium & Arena Guide shows only in chapters with mapped venues (the plan is in the migration). `ad-resolve` counts the
impression and `ad-click` the click by slot, and `ve-links` names the member who clicked (campaign ve-house-banners on `/dashboard/leads`).
**Then, the same day** (Sean: "on the ones that have the two smaller ads together, make one of them humble cabbage... it's a little
distracting seeing both of them move at the same time... The longer ones that are the guides can stay"; migration
`20261031_pairs_humble_cabbage_second.sql`): every pair of 300 x 250s (`ve-directory-landscape-2` and each `ve-<chapter>-hub-landscape-2`)
shows that slot's own Humble Cabbage campaign again, its still image, with the Guide in slot 1; the tall slots stay Guides. Humble
Cabbage's sponsor campaign is active again; its other campaigns stay paused. A new Guide ad is a `G` entry in `guide.html`, an `ad_campaigns` row under the sponsor, its `/go/` link and the slots it takes. A real
advertiser takes a slot by linking its campaign to the placement (`ad-resolve` serves the newest active campaign linked to a slot).
**On phones the rail runs the full width** (Sean, 2026-10-31: "not full width on mobile"): at 900 px and under the slots fill the row, two
side by side where there is room and one per row on a phone, and a tall slot becomes a wide box there (`ve-ad-rail.js`).

**One campaign per banner, measured in BrandDesk** (Sean, 2026-11-08: "running campaigns on specific types of banners so we can track their total impressions and clicks... in the ads section of the brand desk"). Every banner we run is its own `ad_campaigns` row (or rows) named `<Sponsor> - <Banner> (<format>)`, where format is ad rails, house banner or the page; BrandDesk > a brand > Insights > Ads has **By banner** (`branddesk-insights` `ads` returns `banners`: everything before the trailing parentheses is one banner, so a Guide's ad rails and its house banner add up), with seen, clicks and click rate against the period before, above By campaign and Every slot. A new banner needs only a campaign named that way. **The Holiday Guide took the Nonprofit Guide's three slots the same day** (the Pulse's tall slot, the D.C. hub's tall slot, Maryland's first 300 x 250; campaign `...0c0de5a14008`, `/go/ve-guide-holiday`, `ads/guides/guide.html?g=holiday-guide`, `free: true` reads Free on the button); the Nonprofit Guide campaign is paused (a door Guide, reached by direct outreach), and it stays the Resources tab on nonprofit, rescue and sanctuary listings and in the catalog.

Use `/public/ve-ad-rail.js`: wrap the content in `<div class="vear-layout"><div class="vear-main">`
and add `<aside class="vear-rail" data-ad-page="pulse|/events">`. Slots come from `ad_placements`
(page_slug + slot_id) through the `ad-resolve` function; a rail fills, and counts an impression,
only once it is on screen. A new page needs its slots added to `ad_placements` and to `PAGES` in
the script.

**Shared with seanarussell.com** (Sean, 2026-11-01, Watch: "follow that same structure, even how the audio plays"): Sean's site
loads `https://vegansexplore.com/public/ve-episodes.js` and `ve-ad-rail.js`. `VEEpisodes.mount(el, {listing, call})` takes
`call(body)` returning another site's episodes in ve-podcast's shape (sar-media `episodes`/`episode`); with it Save, Show notes
from the Pulse and Referenced books are left out. The rail takes `data-ad-brand`, `data-ad-slots` ("slot:tower:300 x 600") and
`data-ad-cta`/`data-ad-cta-label` for a page outside `PAGES`, and loads `ve-ad-creative.js` from its own origin. Keep both
scripts working when loaded from another origin.

### Ad creatives (Sean, 2026-10-04)

An ad's `creative_url` is an image or an HTML5 ad (a `.html` file in `ads/<brand>/`). Every slot
renders through `/public/ve-ad-creative.js` (`VEAdCreative.markup(ad)`), which frames an HTML5 ad
in a sandbox and passes the tracked link as `?clickTag=`; the ad opens that link itself and posts
`{veAd:'click'}` so the click counts. GeekFon artist pages do the same in
`components/AdCreative.tsx` (lesaruss/geekfon-society). Every ad link is a tracked `/go/` link.
Our guides (River, Maya, Nori and the rest) are always drawn in the GeekFon illustration style,
never photographs, in ads and everywhere else. Example: `/ads/humble-cabbage/ve-tee.html`, River
in the tee, then Shop now plays the tee, Maya and Nori in Black, the $5 donation, and Shop now.

**The brand-page billboard slot is the Guide's rail ad** (Sean, 2026-11-10: "I like that style where the button is just at the bottom
and you could see more of Theo... apply that as the updated look for that size"). `houseAd` in `directory/listing.html` fills
`bb-ad-landscape-1` (6:5) with `/ads/guides/guide.html?g=<guide>&clickTag=<tracked /go/ link>`: the Guide's scenes full bleed, the kicker,
headline and button on top. The old card (`.bb-house`, a picture over a text block) cut off the button with a longer line and is no longer
drawn there. Through Christmas the slot shows the Holiday Guide (`/go/ve-guide-holiday`; Sean, 2026-11-10: "wherever there's a dairy
guide, let's put the holiday guide"); from December 26 Eastern it returns by itself to the Guide the brand's products are in (the Dairy
Guide, `/go/ve-dairy-guide`). The same day the Dairy Guide's rail slots moved to the Holiday rail campaign `...14008` (Washington DC hub's
landscape slot kept, its skyscraper is already Holiday), the listing house banner got a Holiday campaign `...13005` with `...13002` paused
(migration `20261110_holiday_for_dairy_and_points_claimed_only.sql`), and the rail ad wraps its headline on a 160-wide skyscraper.
After Christmas: move the rail slots back to `...14001`, set `...14001` and `...13002` active, and point `FOOD_GUIDE` in
`public/ve-guide-tab.js` back to the Dairy Guide.
