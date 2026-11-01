Logan, pick up the listing check work on Vegans Explore (repo lesaruss/vegansexplore-com, Supabase project fwbhwfxpncrsfhttimna).

Read first, in this order:
1. The playbook `ve-listing-check` in `playbook_records` (two rows: the BUILD RECORD and the OPEN QUESTION).
2. CLAUDE.md: "The listing check, in Sean's order" (Directory review), "The restaurant audit", "The business dashboard", "Managed by us and Have us do it" (BrandDesk) and "The Restaurant Guide".
3. The code: `public/ve-partner-dashboard.js` (`healthCard`, `healthBlock`, `drawAudit`), `supabase/functions/ve-listing-health/index.ts`, `supabase/functions/ve-restaurant-audit/index.ts`, `public/ve-managed.js`, `business/sample/listing-demo.js` (`healthSamples`).

The first thing you do is answer the question below, before building anything. This is a "what are your thoughts" question. Give a recommendation, your reasoning, and the default you will take if I don't override it. List what already exists and what's missing, plus the build order. Don't build until I say go.

My question, word for word:

"Oh, what if on the partner dashboard they had a score based off of this? Because if we're already running these scans on these businesses, you know, we should be able to see. It's like we're just capturing the results. So that way when somebody unlocks their claim, they then get access to this information, and it's all designed to support them. And it lets them know exactly what to do with a little button that says, let us fix these issues. Or do you want us to fix these issues? And they click it and it takes them down the path to using our services, using our monthly services, and then explains and they go through that process. But it all starts with them getting their audit. And in reality, that's what we're saying in the restaurant guide and then the entrepreneur guide, is that that's what they get access to, which is already built out. They're literally just unlocking their profile and seeing everything that's there. And then we could also feed opportunities to them as well directly into their dashboard. And by the way, that dashboard that is on that profile actually becomes their dashboard. And then plus a few other things that aren't in that profile. So, what are your thoughts?"

Things to weigh in your answer (check them against the live system, don't assume):
- What we already hold per listing:
  - `ve_listing_health` (the nightly website and Instagram check)
  - `ve_audits` (the monthly check-ups and the free and full audits, 40 criteria)
  - Google status
  - `ve_restaurant_essentials`
- Whether one score can combine them honestly.
- How it fits with the paid $49 / $149 audit, so we don't give that away. The CLAUDE.md rule says the check-up reads as ours, never a score they bought.
- Wiring `D.health` live in `ve-claims` `owner_dashboard`.
- Pointing every flag's Fix at `VEManaged.open` (BrandDesk, $500 a month).
- Opportunities on the dashboard, which already exist as `OPPS`, `ve_dashboard_cards` and campaigns.
- How the business dashboard on the listing relates to the member's main `/dashboard`.

Open by saying "Logan here."
