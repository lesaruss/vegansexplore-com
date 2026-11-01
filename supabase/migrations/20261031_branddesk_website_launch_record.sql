-- BrandDesk build record 4 (playbook ve-front-of-house): the website launch. Safe to run twice.
insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-front-of-house', 'vegans-explore', 'Logan', $pb$BUILD RECORD 4, 2026-10-31 (Logan). The website launch: the real client site.

1. BUILT. Each client's site is their Cartridge on the same frame as business/site.html, only the brand slots changing. One shared hosting project serves every client: Vercel branddesk-sites (prj_fwcoroEU9vkhwbWNChxQf2Bi1JhF, this repo's branddesk-sites/ folder), one function answering by the domain asked for, each page at its own address with its search tags written on the server, robots.txt and a sitemap per domain. A frame change rebuilds it, so every client gets it at once.

2. THE STEPS, EACH RECORDED (ve_branddesk_sites, ve_branddesk_site_events). Build their website (needs the brand kit) -> Send it for their OK (the owner gets a private preview, never indexed) -> the owner approves on their dashboard by typing their name, or asks for changes (a super admin can record an OK given another way only with a note) -> approval freezes that version: their domain serves only what they approved, and later kit changes go live only after a new OK -> Add their domain (attached through the Vercel API; www sent to it) with the records they add -> Check the domain (DNS, SSL) -> Run the final check (every page over https with their name, its own address and open to search; robots, sitemap, http to https, www, every picture). All passing makes it Live, emails the owner and team, and ticks the onboarding step. Take it down, put it back, end it.

3. WHERE. Managed by us > Your website (the owner), Depot > BrandDesk > a client > Your website (the team), Preview journeys > BrandDesk.

4. PROVEN LIVE on a [TEST] client on Love Life Cafe, then removed: every guard, the kit built from the listing, the preview served by the hosting project (51 menu items, noindex), sent, changes asked, sent again, approved as version 1 with the name recorded. NOT YET PROVEN: the domain, SSL and final check on a real domain; the test DNS record was stopped by the build session's safety check and waits on Sean's go.

5. DEFAULTS (Logan's, Sean's to change): the preview lives at branddesk-sites.vercel.app/p/<token>; a site wears Fresh neighborhood until the kit's six colors are set; ordering on a live site is their own ordering page, else a call. Vercel's default login protection on vercel.app addresses was narrowed to preview deployments so the preview is public.

Next: the domain proof on Sean's go, then the two handshake builds (the free check's top fixes in business outreach's first email; a Signs filter on the pitch list).$pb$, 'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-front-of-house' and body like 'BUILD RECORD 4,%');
