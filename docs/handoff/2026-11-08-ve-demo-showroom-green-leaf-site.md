# ve-demo-showroom: Green Leaf Kitchen sample site (and ve-front-of-house: BrandDesk Site pricing locked)

2026-11-08. Live on `main`: https://vegansexplore.com/business/sample/site (the frame `business/site.html`, data `business/sample/cartridge.js`).

## Done (each checked in a browser on the live site at 1440 and 390 px, no script errors)
- **Home**: the leaf mark alone in the header (`img/mark.png`, `mark-reverse.png`, cut from the logo); Order online is a wide pill (`.obtn`);
  What people come back for is a 3-across rail (arrows, dots), the top 9 dishes ranked by votes; Our story is a 46 s narrated photo video
  (`story-v2.mp4` in vegan-media `media/business/sample/`, Liz in her roster voice, checked word for word with stt, captions `story-v2.vtt`,
  LESARUSS said as a name, no Green Goddess); The space: At night is the same corner at dusk (`s-outside-night.webp`), Inside is six
  distinct photos (`s-room-wide`, `s-window-bar`, `s-banquette` are new).
- **About**: News from the kitchen, 6 posts (`posts` in the Cartridge, dates count back from today), a rail with votes and Newest / Top voted;
  a post opens in a window over the page.
- **Menu**: every dish has its own page `#/menu/<section-item>`: allergens (from the ingredients), nutrition per serving (estimates), what is
  in it and where it comes from (`menu.ingredients`, 65 entries: local farm, local maker, made here, market, or a real Directory brand
  linked to its listing: Oatly, JUST Egg, Wiwa's Tempeh, Violife, Follow Your Heart, Miyoko's, West Indies Peppa Sauce, Harmless Harvest,
  Navitas Organics). The farms, bakery, roaster and tofu maker are made up. Three more photos in a row under the main one; tapping one
  swaps it in (close-up crops in `img/g/`, because Higgsfield was at 1.15 credits). The breadcrumb's section opens that section
  (`#/menu/sec-<n>`).
- **Sample login** (`#/signin`): demo@vegansexplore.com / explore11 for anyone; a visitor already signed in on vegansexplore.com is signed in
  as themselves on arrival. Signed in: one heart vote a day per dish or post; Save makes a Favorite pill on the photo; the sample bar
  switches As a member / As the owner. The owner sees a yellow bar and, on any dish page, removes ingredients and adds them by searching
  the Directory's Food Brands and Nutrition & Supplements (public read) or typing their own. Everything is kept in the browser for the visit.
- **Order**: compact rows with Add on the right; Add becomes a − n + stepper everywhere (menu cards, dish pages, order rows), so a dish comes out
  where it went in; Vegans Explore Delivery under Pickup, Coming soon; after paying, a tracker resting on Preparing.
- **Sign in with Vegans Explore** after Order online, and a Vegans Explore circle first among the footer's socials, linking to the business's listing.
- **ve-front-of-house pricing locked** (canon v9 `pricing_v9`, migration `20261108_branddesk_site_pricing_v9.sql`): BrandDesk Site $500 a quarter,
  no setup; photos $250, video $250; Managed $500 a month stays as the step up; Community Manager on Site paid once per client.

## Not done / not built
- Pricing in the product: Stripe prices, `/business/managed`, the pitch page, `/business` Managed by us, the agreement and the Guides facts still
  say $1,500 + $500 a month. The Community Manager onboarding fee amount is Sean's (Logan suggested $150).
- A client's own domain cannot pick up a Vegans Explore session yet (needs the one-time-code handoff, like Continue with LESARUSS).
- Real extra dish photos (about 72 images, about 150 Higgsfield credits) or the photographer's shot list.
- The tour button (Liz, guided view from `/partners` + `ve-guided.js`, script to Sean first) and the BrandDesk view for the owner.

## Waiting on Sean
- The Community page idea and its flags (playbook record): points spent at a restaurant changes canon; club credit that rolls over is stored
  value (lawyer and Florida rules) and needs Stripe Connect and their point of sale; "up to $100 in savings" must be real; check-ins every two weeks.

## Next
1. Sean answers the Community page flags. 2. The tour script, then the tour. 3. The owner's BrandDesk view. 4. The pricing build per pricing_v9.
