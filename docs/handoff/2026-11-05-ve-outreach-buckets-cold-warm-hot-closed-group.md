# ve-outreach-buckets: Cold, Warm, Hot statuses; cities are a filter; a No longer open group proposed

Date: 2026-11-05 (Thursday). Playbook: `ve-outreach-buckets`. Follows `2026-11-05-ve-outreach-buckets-roster-campaigns-built.md`.
**No email has gone to a business. No city is on. Nothing is on HQ `main`.**

## Done
- Sean looked at the Roster and Campaigns preview: "really shaping up", good for V1, keep tweaking.
- **Cities are a filter, not the campaign** (Sean: "Cities can be a criteria within a campaign, but it shouldn't define the campaign. If I'm
  sending it to CPG brands for being part of our gratitude box, the city's not going to matter... I've mentioned this before"). The earlier
  recommendation (approve makes one send day per city, city switch as a second safety) is withdrawn. Recorded in the playbook and canon
  `canon-ve-outreach-roster-campaigns` v2.
- **Roster statuses are Cold, Warm, Hot, Member, Unsubscribed** (Sean's words). Cold = nothing heard; Warm = opened an outreach email, no
  click; Hot = clicked their link or replied, or started a claim (Logan kept the claim here); Member = claimed or joined; Unsubscribed =
  suppressed, opted out or bounced. Migration `supabase/migrations/20261105_outreach_roster_cold_warm_hot.sql` (applied live: 2,370 Cold,
  4 Member, 1 Unsubscribed, 0 Warm since no real outreach email has gone). HQ `lesaruss/lesaruss-hq` branch `claude/quirky-hawking-7xrux2`
  commit 710f1a0 (labels, the API's filter list, V's help line). Opens are a floor and can be false (Apple Mail prefetch); Hot rests on clicks and replies.
- Answered: there was never a "Verified" status; "Unverified" meant not heard from yet.

## Proposed, waiting on Sean's go
1. **Sending governed per campaign**: approving a campaign lets it send; each campaign has its own start day, daily pace and pause; city is an
   optional filter, never a gate; new Guides become new campaigns on the same machinery. Today the engine (`ve-outreach`) still sends from
   city lists and send days with the city switch.
2. **A No longer open group** in the Roster: Permanently and Temporarily closed listings leave the door tabs into their own group, never
   deleted (history, notes and tags kept); Removed listings (duplicates, not real, not Vegan) left out. On 2026-11-05: 72 permanently closed
   (17 with an email), 9 temporarily closed (0 with an email). A reply that says they reopened puts the listing back to open and its door; a
   new venture becomes a new listing or a person record tagged with it; no news keeps them in the group with a note.
3. **The Checking in email** (from Sean, a draft for his edit or approval):

   Subject: Checking in, {first name}

   Hi {first name},

   It's been a while since {business} closed its doors, and I wanted to check in. No ask here, I'm just curious how you're doing.

   If you've started something new, maybe in another city or another state, I'd love to hear about it. We're always looking for people
   and stories to feature, and that includes whatever comes next for you.

   Vegans Explore is in cities across the country and in London now. If you travel, it's an easy way to find Vegan options wherever you land.

   If nothing's changed, I'd still love to hear how you are. Just reply to this email.

   Sean

## Still open from before
- The two after-membership notes (`docs/proposals/restaurant-door-after-membership-notes.md`): sender (default team) and the Founding line after Jan 1 (default drop it).
- Orientation (one campaign for everyone or one per door), the evergreen tour (text first, `-v2` recordings after approval), not yet seen signed in on real data.
- London and Washington D.C. Find emails fail (`WORKER_RESOURCE_LIMIT`). Commit author still undecided (Claude noreply used).

## Next
Sean says go (and edits the email). Logan builds sending-per-campaign and the No longer open group on the HQ branch, gives the Vercel
share link (`get_access_to_vercel_url`, team `contact-2245s-projects`, `/branddesk/brands/vegans-explore?view=people&p=roster`), and merges
to main only on Sean's go. Nothing sends unless a campaign is approved.
