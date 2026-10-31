-- BrandDesk build record 5 (playbook ve-front-of-house): the domain proof and the handshake builds. Safe to run twice.
insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-front-of-house', 'vegans-explore', 'Logan', $pb$BUILD RECORD 5, 2026-10-31 (Logan). The domain proof, and the handshake built.

1. THE WEBSITE LAUNCH, DOMAIN PROVEN LIVE (Sean: "go ahead with the domain proof"). A DNS-only test subdomain on lesaruss.com: our own domain refused without the test flag; added, verified, SSL issued within a minute; the final check 9 of 9 and Live on its own, the owner and team emailed, the onboarding step ticked. Take it down shows the plain page within about a minute (the cache was cut from 10 minutes stale to 30 s plus 30 s after the first try served a page 110 s stale); put back up answers at once. Domain, DNS record and every row removed. Not built: purging Vercel's cache on a takedown, the point-of-sale cart on a live site, a branded preview address.

2. THE HANDSHAKE, BUILT (canon v8). The first business outreach email now carries the top three things from their free check, in the check's own words, and a link to the whole free check; no price. 33 of 78 first emails have one; every other email renders exactly as before (checked byte for byte). The pitch list has Ready for a pitch (a sign or warm) and Showed a sign; each business shows its signs (clicked their link, claimed, ran or opened their free check, bought the Guide, asked us, talked on a pitch). Send it from me refuses a business with no sign unless Sean ticks it warm.

Defaults (Logan's, Sean's to change): three fixes in the email, a check-up counts for 45 days, an opened check counts once a visitor a day.

Open for Sean: merge the branch; which chapter outreach starts in (none are on); the first warm-list names.$pb$, 'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-front-of-house' and body like 'BUILD RECORD 5,%');
