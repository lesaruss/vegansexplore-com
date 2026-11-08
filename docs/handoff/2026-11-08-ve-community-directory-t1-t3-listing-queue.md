# ve-community-directory: T1 Juices For Life, T2 hello draft, the 114 read, T3 the listing-request queue (2026-11-08)

Playbook: `ve-community-directory`. Branch `claude/bold-bohr-4v3yrd` (carries `claude/eager-meitner-bpmr31` merged in). Not on `main` until Sean merges.
Sean's answers were left blank, so the handoff's defaults were used: Miami Beach Vegan set aside; Angela Yvonne set aside (not on our shows);
his 17 held left; the nine thin rescues kept.

## Done, each checked in the database
- **T1 Juices For Life** (Styles P and Adjua Styles). Google (`once:juices-for-life-2026-11-08`, 3 searches, $0.12; $27.84 left of $50) shows three open
  shops: Juices For Life, 1026 Castle Hill Ave, Bronx (main listing, 804 reviews); Juices For Life - Throggs Neck, 3463 E Tremont Ave, Bronx; Juice 2 Heal -
  White Plains, 180 Grand St (the 2024 rename). No Yonkers shop came back. How Vegan: **Vegan options** (no source confirms an all-Vegan menu; HappyCow files
  it as a juice bar with shakes); vetted by us as Sean's find. juicesforlife.shop is a third-party menu site, so the Bronx shops carry no website.
  New York chapter, tenant `...0002`, live and serving 200. Migration `20261108_juices_for_life.sql`.
- **T2**: a cold hello to @juice2heal (the only handle we can confirm; no published email) is a **draft** in Depot > Outreach for Mon Nov 9, team voice,
  tracked link `/go/juice2heal` to the listing. Nothing sent.
- **The 114** (A person / Not a restaurant rows that mention animals or Vegan): **8 listed** (Compassion Co, Green Vegan Bags, GUNAS New York, Vegan Club in
  Clothing and Fashion; Black Rican Vegan, Catering, New York; The Vegan Sweet Spot, South Florida; International Vegan Film Fest and Vegan Women Summit,
  Events, every chapter). **106 set aside** with a reason (creators and coaches we have not worked with, quiet since 2024, outside our chapters, already listed,
  Ike's serves meat). Miami Beach Vegan set aside. Rose of Sharon gained South Florida. Migration `20261108_new_places_114_read.sql`.
- **T3, the listing-request queue** (idea `f8adc4c3` marked done). Table `ve_listing_requests` (RLS on), edge function `ve-listing-requests` (submit,
  research, queue, decide; verify_jwt off), cron `ve-listing-requests` (every 15 minutes, only when something is new; 3 a run, 20 reads a day in
  `ve_site_settings` `listing_requests`). Research uses `ve-listing-intake` (now takes the cron secret) and makes a quarantined draft listing (crawl_source
  `listing-request`); a place we already list is never drafted twice (Instagram handle, name and city, or website). **Sean's dashboard For you**: Request a
  listing (his own, straight to work, never in his review list) and each worked request with **Publish** (live, vetted by us), **Send to vetting** (a food
  place with Vegan options goes to Being vetted; anything else On hold for review) and **Remove** (set aside); a duplicate shows the listing we have and
  **Close it**. Visitors reach it from search's empty state ("Tell us about it", `/public/ve-listing-request.js`). Deployed from 63b7c634; `ve-listing-intake`
  v8 from 61c4894a (source sha256 matched). Proven live: submit, the worker drafting a new place, the duplicate path, refusals without a token; test rows removed.

## Not proven / not built
- **decide** was not run as a signed-in super admin (no session in this build); Sean's first click on For you is the proof. The For you tiles were not
  seen in a browser.
- Feedback's "Something is missing" on Directory pages does not feed the queue yet (would mean redeploying `ve-feedback`; check its live version first).
- A request with nothing findable still makes an Uncategorized draft; Sean removes it.

## Next (Logan)
Stop here. **Friday Nov 13: M**, the logo hunt on the 382, only on Sean's go in that chat (check the Claude credit, expires Nov 17, and Apify's $29 cap first).
