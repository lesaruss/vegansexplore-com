# The photographer bench: list and drafts

**Sean said yes (2026-11-13).** Loaded for his final look in HQ Outreach > Campaigns, program `photographer-bench-2026`
(https://hq.lesaruss.ai/branddesk/brands/vegans-explore?view=people&p=campaigns&prog=photographer-bench-2026), migration
`supabase/migrations/20261113_photographer_bench_program.sql`. The email campaign `photographer-bench-2026-email` is **draft**: nothing
sends until Sean turns it on.

## Confirmed 2026-11-13 (read through ve-web-reader)

| Who | City | Confirmed | Channel | Tracked link |
|---|---|---|---|---|
| C&I Studios | Fort Lauderdale | Photography studio; contact page publishes contact@c-istudios.com | Email (draft) | `/go/pb-cistudios` |
| Carlos, Miami Profile (gonza.co) | Miami, covers South Florida | Food photography page: restaurants, chefs and menus | Instagram @gonzcasa (DM) | `/go/pb-gonzcasa` |
| Photography by Riguel (Riguel Dorta) | Miami, covers Broward | Food, beverage and menu photography for restaurants; no email published | Contact form, pasted by hand | `/go/pb-riguel` |
| Jason Varney | Philadelphia | Food, travel and lifestyle photographer since 2007 (Drexel profile, varneyphoto.com) | Contact form on varneyphoto.com | `/go/pb-varney` |
| Philly Vegans | Philadelphia | Instagram @phillyvegans, on Philly Mag's Vegan scene story | DM for referrals | `/go/pb-phillyvegans` |

Dropped or parked: SoFlo Vegans now redirects to our own Vegans Explore South Florida page (not an outside channel). Limestar
Photography, TYE Studios, Neal Santos, Courtney Apple, K.C. Tinari, Michael Miville, Paul S. Bartholomew and Philippe Lesaux could not
be confirmed with a contact through the reader (pages blocked, empty or no contact published); parked until a link to them turns up.

The job links open `/gigs?city=<chapter>#gig/<id>`; signed out, the Gig Board's gate now says "Sign in or join free" and brings them
back to that job (`gigs/index.html`).

## The original list (2026-11-13, before confirming)


Playbook `ve-front-of-house`, canon `canon-ve-front-of-house` v16 `sales_route_v16` (talent: "Start finding photographers now: a
paid job on the Opportunities board and a city-by-city list... drafts go to Sean first"). Nothing here has been sent.

## The jobs (live on the Gig Board since 2026-11-13)

| City | Gig | Pay | Applications close |
|---|---|---|---|
| Fort Lauderdale (South Florida chapter) | `724b97fa-4dc9-4966-9fe2-518a91829a7e` "Food photographer: Fort Lauderdale (paid)" | $75 paid three-dish trial, then each shoot at their quoted rate, plus 250 points | Fri Dec 4, 11:59 PM Eastern |
| Philadelphia | `25c1cc7f-49ee-4462-a604-ab4895d5f57a` "Food photographer: Philadelphia (paid)" | same | same |

Posted by LESARUSS.ai (the shop sells the shoots at lesaruss.ai/shop/photos, $250 for up to 8 dishes). Migration
`supabase/migrations/20261113_photographer_bench_gigs.sql`. Applications land in Depot > Bounties like every Gig Board application.

Pay rule to settle when the first shoot is booked: the shop sells 8 dishes for $250, so the photographer's quoted rate has to leave
room for the Community Manager and us. The applications ask each photographer for their rate; Logan brings the first quotes to Sean.

## The list, city by city (found 2026-11-13 from public pages; contact details still to confirm)

None of these are confirmed Vegan specialists; the Vegan scene's own channels are listed so we can ask for referrals too.

### Fort Lauderdale and South Florida

| Who | What they shoot | Where we found them | Channel |
|---|---|---|---|
| Riguel Dorta Photography | Food and menu styling for restaurants, cafes, food trucks; covers Broward and Miami-Dade | rdorta.photobiz.com | Website contact |
| C&I Studios (Fort Lauderdale) | Menu, packaging and restaurant interiors; Gold Coast Magazine's best new restaurants | c-istudios.com | Website contact |
| Gonzalo (gonza.co, Miami) | Restaurant and menu photography; shoots any Broward city with no travel fee | gonza.co | Website contact |
| Limestar Photography | Food photography, Fort Lauderdale | Giggster's Fort Lauderdale food photographer list | Website or Instagram, to find |
| TYE Studios | Studio in South Fort Lauderdale near downtown Miami | Giggster's list | Website, to find |
| SoFlo Vegans (referral channel) | South Florida Vegan directory with a photography services page | soflovegans.com | Ask who they recommend |

### Philadelphia

| Who | What they shoot | Where we found them | Channel |
|---|---|---|---|
| Paul S. Bartholomew (Bartholomew Studio) | Food, drink and interiors, 20+ years, local hospitality | Production Paradise | Website contact |
| Neal Santos | Commercial and editorial food; co-runs a restaurant | Peerspace's Philadelphia list | Website or Instagram, to find |
| Courtney Apple | Commercial and editorial, the local food community | Edible Philly contributors | Website, to find |
| K.C. Tinari | Food, beverage and hospitality since 2016 | Edible Philly contributors | Website, to find |
| Jason Varney | Food, travel and lifestyle | Drexel alumni spotlight | Website, to find |
| Michael Miville | Food, lifestyle and branding | Snappr's Philadelphia list | Snappr profile |
| Philly Mag's Vegan scene list (referral channel) | "12 People Who Are Helping Shape Philly's Vegan Scene" | phillymag.com | Ask the people on it who they hire |

## The drafts

One email per photographer, sent from the LESARUSS.ai team (never Sean's name for team mail), through a BrandDesk Outreach program in
HQ once Sean says yes. Every link is a personal tracked `/go/` link made at send time; the email carries `{{unsubscribe_url}}` and
`{{postal_address}}`. `{first}`, `{city}` and `{their_line}` are filled per person; `{their_line}` is one true sentence about their work.

**Subject:** Paid food shoots in {city}

> Hi {first},
>
> {their_line}
>
> We are LESARUSS.ai, the marketing company behind Vegans Explore, the guide to Vegan food city by city. Restaurants book food shoots
> through us, and we are building a small bench of photographers in {city} to shoot them: up to 8 dishes and the space, every photo
> to one standard, paid at your rate.
>
> If that sounds like you, the job is here: {gig_link}. It asks for a short pitch, two or three examples and your rate. A few people
> get a paid trial ($75, three dishes) before we book.
>
> Thank you,
> The LESARUSS.ai team
>
> {{postal_address}} · Unsubscribe: {{unsubscribe_url}}

**Referral note** (SoFlo Vegans, the Philly Mag list): a warm opener first, the link only once they reply.

> Hi {first}, we are LESARUSS.ai, the team behind Vegans Explore. We are looking for food photographers in {city} who shoot plant-based
> food well. Who would you recommend?

The `{their_line}` for each person is written when the list is confirmed (their site read through `ve-web-reader`), so it is true.

## What waits on Sean

Yes or no on sending these (and any changes to the words). On yes: Logan confirms each contact, writes `{their_line}`, makes the
personal `/go/` links and loads the program in HQ Outreach > Campaigns for his final look.
