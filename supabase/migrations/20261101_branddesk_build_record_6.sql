-- BrandDesk build record 6 (playbook ve-front-of-house): Sean's walkthrough review, 2026-11-01. Safe to run twice.
insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-front-of-house', 'vegans-explore', 'Logan', $pb$BUILD RECORD 6, 2026-11-01 (Logan). Sean's review of the walkthrough, fixed.

1. THE FIRST EMAIL IS TRUE OR SILENT. Rootz Soul Cafe's draft said "Google has no hours" (Google marks it closed for now) and "we could not find the Instagram" (our reader missed it). Now: only a check-up from the last 7 days, never for a business marked closed, only the five checks read straight from Google or their home page (hours, rating, phone speed, page title, search description), every line dated. Businesses on a send day in the next 10 days are re-checked first. 7 first emails carry a check today.
2. NO PROMISES WE DON'T MAKE. "Yours to keep" and the Partner Dashboard / Liz line are gone from Day 0; the ask is claiming the listing. The link is vegansexplore.com/check/<slug>, no code.
3. PITCH LIST: Presence and Google line up with their headers (fixed column widths).
4. THE BRAND KIT IS STEP 1 of Your website: each part Locked, In progress or Not started, and Open the brand kit; the site is step 2.
5. THEIR OLD ADDRESSES KEEP THEIR TRAFFIC. Before the domain moves we read their current site (sitemaps, home page links), match each address to Home, Menu, Order, About or Visit, and their domain answers each with a 301. The team can change any match or add one; the final check tries them. Love Life Cafe's site: 15 addresses read from its sitemap.

Defaults (Logan's, Sean's to change): 7 days for a check-up in an email; the five checks; the match words.

Open for Sean: merge the branch; which chapter outreach starts in (none are on); the first warm-list names.$pb$, 'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-front-of-house' and body like 'BUILD RECORD 6,%');
