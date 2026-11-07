# ve-ads-studio: the opening prompt (2026-11-07)

Paste this into a new chat. Playbook `ve-ads-studio` (row in `ve_playbook_index`, first decision record 2026-11-07).

---

Logan here. Playbook ve-ads-studio: plan the Vegans Explore Ads Studio, starting with our own Google Ads to our Guides.

Read first:
- The playbook's first record (playbook_records, slug ve-ads-studio, 2026-11-07) and the ve-explorer-path decision of the same day (the price of admission is the survey for everyone; the $11 is the Guide route).
- CLAUDE.md sections "Ad rail", "House banners on listings", "Our Guides fill the rails", "Tracked links", "Analytics", "Guide pricing, points and levels", and "Google costs" (that cap is Places API spend, not ad spend).

What I want (Sean, 2026-11-07):
- A possible $500 Google Ads credit on the LESARUSS account. Use it to run ads against our Guides ($11 or 1,100 points each), and maybe the Guides page.
- Facilitate it through our own platform: a Vegans Explore Ads Studio (call it Studio), so we create, run and read ads from one place and drive traffic to our pages.
- Be honest about what works: I am open to talking it through here first.

What exists today: the ad rail and the ad_* tables (ad_placements, ad_campaigns, ad_campaign_placements, ad_impressions, ad_sponsor_campaigns), ad-resolve and ad-click, the house Guide banners (ads/guides/guide.html, sponsor ve-house-banners, /go/ve-guide-* links that name the member who clicked in ve_initiative_interest), Depot > Analytics (Google Analytics property 432623792). Related but separate: ve-business-hub-ad-console (selling our slots to businesses).

Bring me, before building anything:
1. Whether the credit is real, its terms, and which Google Ads account it lands in (check, don't guess). The current Google Ads promotional credit rules.
2. A first campaign plan: which Guides, which searches or audiences, budget per day, how long, what we count as a win (a Guide bought, an Explorer survey finished), and how we track it end to end (UTM and /go/ links, GA conversions, a purchase or survey row tied to the click).
3. What the Studio would be in V1 (a Depot or BrandDesk page: campaigns, spend, clicks, conversions, the creative), what it would read from Google Ads (API access needs a developer token and approval: say how long that takes) and what we can do by hand until then.
4. Landing pages: does each Guide page work as an ad landing page today (speed, the offer above the fold, the $11 clear), and what to fix.
5. A recommendation and the default you will take if I don't override.

Rules: no money spent and no Google Ads account changed without my go; every ad link a tracked link; Guides drawn in our illustration style; plain words, Eastern time.
