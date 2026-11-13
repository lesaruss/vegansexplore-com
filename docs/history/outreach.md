# History: outreach

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## Business outreach, city by city (Sean, 2026-10-10)

"Let's just make sure we're not sending any emails... when I say go... let's go city by city. And not try to hit everybody
at once." Then: "see who is on the queue, approve who the emails are going to be going out to... on Monday, we're sending
it to these 60... see what the draft is... and we commit to it for like maybe 15 days before we make any drastic changes."
The goal is businesses on board for Q1 2027 through Front Row Start. Migrations `20261010_ve_outreach.sql`,
`20261010_ve_outreach_batches.sql`, `20261010_ve_outreach_sender.sql`, `20261010_ve_outreach_listing_cleanup.sql` and `20261010_ve_partner_onboarding.sql`; edge function `ve-outreach`; console **Depot > Business outreach**
(`/admin/depot/business-outreach`).

- **The console** (one thing per view): Upcoming sends (each send day is a batch: Waiting for approval, Approved, Sent) and
  the cities. A send day lists its businesses (who they are, where the email goes and where we found it, the Guides they
  are in) with Preview; a business opens its three emails exactly as they go out beside its real page (framed,
  `?preview=1`), where Sean can fix the name or email, take it out of the day or mark it Never email. **Approve this send**
  approves all three emails for that day's businesses. Plan sends proposes days: first send day and businesses per weekday
  (`ve_outreach_plan`, brands first). The first approval in a city sets its 15-day commitment
  (`ve_outreach_cities.committed_until`, shown on the city card): no big changes to the emails or the plan before then.
  An upgrade to what we offer (Sean, 2026-10-10: the free restaurant audit "still falls in the plan, it's just an upgrade
  to the offer") is not a change to the plan and can go into the emails at any time; the commitment guards the plan itself.
- **Two gates before anything sends**: the batch is approved, and the city is on (Turn on sending / Pause sending on the city
  card, `ve_outreach_cities.enabled`, every city off until Sean turns it on). `ve_outreach_due()` is what goes next: approved
  send days whose day has come, then follow-ups when due, never a suppressed address.
- **The sender** (migration `20261010_ve_outreach_sender.sql`, `ve-outreach` `tick`, cron `ve-outreach-send` every 10
  minutes): weekdays 9 AM to 5 PM Eastern only, 6 a tick (a day of 30 goes out over about an hour), within the city's
  `daily_cap` (30) and the domain's warm-up allowance (`email_warmup_allowance`). Each email goes through `email-send`
  (brand `lesaruss`: from Sean A. Russell <sean@mail.lesaruss.ai>, replies to contact@lesaruss.com, one-click unsubscribe,
  the postal address, `campaign_ref` `ve-outreach-<contact>-<step>` so nothing is sent twice) as a plain personal email with
  a small footer. The page link is the business's own tracked link (`ve_links`, `bo-<code>`, campaign `business-outreach`,
  made at its first email). Day 4 and Day 10 are set for 10 AM Eastern on a weekday. Before every tick `ve_outreach_sync()`
  reads what they did: a real click on their link or a reply (not an auto-reply) makes them Interested, a claim makes them
  Joined, an unsubscribe or block makes them Unsubscribed, a bounce Bounced, and a send day turns Sent once everyone in it
  has had their first email. Three failed sends hold a business. Heartbeat: `email_heartbeats` `ve-outreach`.
- **Send me this as a test** (a business's preview, `ve-outreach` `test`): its real email to the signed-in admin with
  [Test] in the subject and the plain page link, so the test click never counts (the ops token can only dry-run it:
  `dry_run: true` renders it and passes email-send's checks without sending). **Interested** (`#interested`, `ve-outreach`
  `interested`): who clicked, replied or claimed, what they did, and who it is routed to.
- **The emails** (`ve_outreach_templates`): three from Sean (sender `email_brands` `lesaruss`, replies to
  contact@lesaruss.com), Day 0 "We built a page for {business}", Day 4 "Your front-row seat{in_city}", Day 10 "Last note
  from me". `ve_outreach_render(contact, step)` fills them; the console and the sender both use it. `{in_city}` is " in
  South Florida" (nothing for a national brand), `{guide}` is Liz (Maya for a Dairy Guide brand), and `{guide_line}` names a
  Guide the business is in, as a brand or as a store carrying its products (`ve_outreach_guides`), with a link to it in the
  Guide (`/guides/<guide>#/listing/<slug>`). No price in the emails: the $111 is on the Partner Dashboard.
- **Contacts** (`ve_outreach_contacts`): one per public, unclaimed listing with an email, by city; national brands are
  their own row, `brands`. A click, reply or claim makes it `interested`; `trg_ve_outreach_route` stops its emails and
  routes it to the city's Community Manager, or Sean. `ve_outreach_queue` is the interest queue.
- **Find emails** (city card, `ve-outreach` `find_emails`, 20 websites a press): reads the business's own home, contact
  and about pages, server side, and takes only an email published there (mailto, plain text, Cloudflare-protected), with
  the page as `email_source`. Never guessed. Each listing is tried once (`ve_outreach_lookups`).
- Ops: `ve-outreach` also takes `LESARUSS_ADMIN_TOKEN` for overview, preview, plan and find_emails; approving, changing a
  row and the city switch need a signed-in super admin.
- **People lists: one engine for every brand** (Sean, 2026-10-10: "This should use the same engine we just created for
  Vegans Explore to do outreach. We can select people in our system and add them to the distribution"; migration
  `20261010_ve_outreach_lists.sql`). A `ve_outreach_cities` row is a list: `kind` `city` (businesses, everything above) or
  `people` (people added from HQ > People). A people list has its own `program` (its three emails are
  `ve_outreach_templates` rows with that program; business outreach is program `business-outreach`), `link_url` (where
  `{link}` goes, made into the person's tracked /go/ link at the first email), `footer_reason` ("You are getting this because
  ...") and `brand` (the HQ label), and the same switch, daily cap, send days, approval and sender. A person contact has no
  listing (`segment` `person`, `person_id`, once per list by email); `ve_outreach_render` gives them `{first_name}` and `{link}`;
  `ve_outreach_sync` marks them Joined when they become a paying LESARUSS AI member or start a 111 Day Theory journey after
  their first email. The Depot here shows cities only (`overview` defaults to kind `city`; `interested` to businesses). HQ >
  Distributions works the people lists through `ve-outreach` with the admin token and `as_member` (the owner's super admin
  member id), which is honored only for people lists; `add_people`, `templates` and `template_save` are the people-list
  actions. A people list's emails start as drafts and send only once marked ready in HQ. First list:
  `111-day-theory-founding` (program `111-day-theory`, link `https://lesaruss.com/entry/join?program=111-day-theory`).
  Before and after the migration, `ve_outreach_render` over every business contact and step rendered the same text (md5
  d0864f6f38450faca8768a7f3eb13c86, 234 emails), and the Depot's overview returned the same 9 cities, 3 emails and 2 send days.
- The June 2026 `listing_outreach` queue (the old $11 claim offer, never sent) was retired on 2026-10-10 (`skipped`, note).
- **Cleaning up the Directory from here** (Sean, 2026-10-10: "remove people from the distribution list... move them to the
  closed and move them off the main list... leave a note"). Each business's preview has **The Directory listing**: team notes
  (`listings.details.admin_notes`, `[{at, by, kind: note|closed|logo, text}]`), **No longer in business** (`listing_closed`:
  `business_status = 'CLOSED_PERMANENTLY'`, which the Directory shows only under Type > Closed, never in All, plus
  `details.closed_at`/`closed_by`/`status_before_closed`) and **Use the letter, not this logo** (`listing_logo_letter`: the
  logo is set aside in `details.logo_unverified`, the same way as the Logos rule). However a listing gets closed (here or
  the listing page's admin editor), trigger `trg_ve_outreach_listing_closed` takes it off the email list, and planning and
  Find emails skip closed businesses (migration `20261010_ve_outreach_listing_cleanup.sql`). Send days list brands first,
  then A to Z, so the order never shifts. On 2026-10-10 five businesses the Directory already marked closed came off the list
  before anything was sent, and Darbster's blurry logo was set aside for the letter (Sean).
- **Owners edit their own page** (Sean, 2026-10-10: "go ahead and build the owner page editing"). Any owner of a listing (the
  approved claim makes them `owner_member_id`), with or without a plan, gets **Edit your page** on the Partner Dashboard tab
  (`mountOwnerEditor` in `directory/listing.html`): four steps, one per view (`?tab=brand&edit=about|hours|contact|photos`),
  Back / Step N of M / Save and next: About (the one line and the description), Hours (each day in their own words, empty
  hides it, saved as `google_hours_json` {Day: text}), Contact and links (phone, website, Instagram, booking, Uber Eats,
  DoorDash, street and ZIP), Logo and photos (logo at least 400 px on the shorter side, up to 12 photos at least 1000 px,
  into `vegan-media/media/listings/<slug>/owner-*`, checked in the page and again in the function; an owner's logo replaces a
  set-aside one, `details.logo_source = 'owner'`; photos go to `gallery_urls`, which the page shows). Their name, city,
  category and how Vegan they are stay ours. Changes go live at once (`ve-claims` `owner_page`, `owner_update`,
  `owner_photo_url`, `owner_photo_done`, `owner_photo_remove`), each one a row in `ve_listing_edits` with the value it
  replaced (migration `20261010_ve_listing_edits.sql`), and the account manager (else Sean) is emailed what changed. A new
  partner's page in the Depot lists **Their changes** with **Undo** (`ve-outreach` `listing_edits`, `listing_edit_undo`, which
  refuses when the same thing was changed again since).
- **New partners: onboarding** (Sean, 2026-10-10: "go ahead and build the onboarding"; migration
  `20261010_ve_partner_onboarding.sql`). Every business that claims its page (`ve_listing_claims` paid or submitted, never a
  test) gets a `ve_partner_onboarding` row through trigger `trg_ve_partner_onboarding`: Waiting for your approval, then, when
  Sean approves the claim in Depot > Claims, Welcoming. Approval starts two things. **Automatic**: three emails from Sean after
  ve-claims' own "your page is confirmed" (`ve_onboarding_templates`, rendered by `ve_onboarding_render`): Day 2 make the page
  yours (Edit your page on the Partner Dashboard, or reply with a logo, photos and changes and we do it),
  Day 7 the first week's numbers (views and visitors from `ve_listing_events`), Day 21 what's coming in Q1 and what they want
  to be part of, plus, on Front Row Start, the date of their first charge. **Personal**: the city's Community Manager, or Sean
  when the city has none, is emailed the task (welcome them within 2 days, with their contact details and the checklist), and
  the checklist lives in **Depot > Business outreach > New partners** (`#partners`, `#partner/<listing>`): welcome them
  personally, confirm the page details, get a clear logo and photos on, ask which Q1 campaigns they want in on. A partner is
  Welcomed when it is all ticked; a welcome more than 2 days late shows Late. The same page shows their three emails (sent,
  opened, next) and the listing notes. `ve-outreach` `tick` sends the task emails (any hour) and the onboarding emails
  (weekdays 9 to 5 Eastern). While building it, `ve_listing_claims_tier_check` turned out to refuse tier `brand` (the Partner
  plan), so every Partner claim would have failed to save; widened the same day, before any claim was made.

## Moving to BrandDesk: the Depot's people tools go into BrandDesk Outreach (Sean, 2026-11-08, playbook `branddesk-production-wing`)

"We need to figure out how we can put all that into the outreach... I don't need those to sit idle." **Agents: never use a Depot page that
says it moved to BrandDesk, never restore one, and never send email from the Depot.** Every email goes through BrandDesk > Vegans Explore >
Outreach campaigns. **Redirected (live 2026-11-08)**: Outreach, Social, Playbooks, Analytics, Members, and Business outreach's outreach
views (it keeps New places, Check-ups and New partners until BrandDesk has them); each stub tells agents why. **The bridge**: edge function
`ve-hq-bridge` (admin token + `as_member`, super admins in good standing only, never agents; a 15-minute session with `hq_bridge: true`, each
issue logged to `stream_events`), so BrandDesk runs the same functions the Depot ran, with their own checks. HQ: `lib/veDepot.ts` (`ALLOW`:
the functions and actions BrandDesk may run; a tool moving in adds its actions) and `/api/branddesk/depot`. **Built on HQ branch
`claude/amazing-hamilton-zpeq6o` (7e882a9), not on HQ main until Sean merges**: the Who list opens a person page in BrandDesk (timeline, tags,
notes, give and take back points) with the group's work on it (Ambassadors: link, level, profile; Invited: status, the email, copy the link,
cancel; Referral claims: decide), and a **Links** tab (make and manage tracked links). Once merged, Depot People, Links and Referral claims
redirect. **Still in the Depot, next**: new invitations (Founding Member, Ambassador, Nonprofit and Group Partner) as a BrandDesk campaign type,
Ambassador commissions, creators and paid work, Nonprofit and Group Partners (0 partners on 2026-11-08), Community Managers (0), Profiles review
(0 waiting), Role applications, Leads, BrandDesk clients billing; each redirects the day its BrandDesk version works.

## Depot > Outreach: everyone to reach each day (Sean, 2026-11-01, playbook `ve-outreach-buckets`)

**REMOVED 2026-11-08 (Sean: "This is the third time we've done this. I don't want to use the depot outreach. We need to remove that as an
option so that way we never do this again").** Never write, queue or send an email through Depot > Outreach or `ve_people_outreach`,
including one-to-one notes Sean dictates in chat. **Every email goes through BrandDesk > Vegans Explore > Outreach campaigns in HQ**
(`ve_outreach_campaigns`, sent by `ve-outreach` `campaignTick`, each member its own tracked link). `/admin/depot/outreach` is a redirect stub
to BrandDesk, it left the Go to menu, and the sender cron `ve-people-outreach` is unscheduled; 78 drafts stay in the table, unsent. The
table is kept for history (Depot > People reads its notes). The text below is history.

"Each day... see all the people I need to communicate with in all the different ways... when I click on it, it tells me exactly what
to do. It gives me the language. If it's an email... I approve it. It puts it on a schedule to go out... I have up until when it goes
out... If it's an Instagram message... me copying it... I just confirm that it was sent... text message... I respond in the notes with
what was said." **Depot > Outreach** (`/admin/depot/outreach`, People in the Go to menu; super admins), the Social studio's way of working
for one-to-one messages. Locked in V's outreach playbook: five buckets (business, community, sponsor, nonprofit, group), everyone Sean
knows reached by November 30, a weekend review. It lives in the Depot so it can be checked live from a build session; its tables are
shared, so it moves to HQ's People app unchanged.

- **A day** (`#day/<YYYY-MM-DD>/<todo|scheduled|finished|all>`): Day before / Today / Next day and a date picker, the days around it with
  how many still need Sean, a counter (need you, scheduled, done), and one row a person: initials, name and organization, the channel
  and bucket, what happened or why now, and the status (Needs you, Scheduled, Sent, Done, Skipped, Did not send). Anything left from
  earlier days shows as a banner on today (`#overdue`).
- **One message** (`#m/<id>`): what to do in one line, who and why now, where it goes (email, @handle with Open their Instagram via
  `ig.me/m/<handle>`, phone with Open Messages filled in, or the group), the tracked link in it with **Open the page** and its clicks, the
  words (editable). **Email**: Approve and schedule (goes out at its time, 10 AM Eastern on its day unless set; refused with no address,
  an empty subject or body, or a leftover `[Placeholder]`), Pull it back until then, Send me a test; changing the words of a scheduled one
  puts it back to Needs you. **Instagram, text, Meetup, call**: Copy, open the app, I sent it (or Done). Skip and Open it again. **Notes**
  are on the person (`person_key`: their email, `ig:<handle>`, or a key we set) and show on every message to them; **Follow up** puts them on
  a later day by any channel, a new draft. **Before and after** lists their other messages.
- **Data** (migration `20261101_people_outreach.sql`; RLS on, no policies): `ve_people_outreach` (one row a message: day, send_at,
  person, bucket, channel email | instagram | text | call | meetup | other, to_address, subject, body, link_code, why, personal,
  template_key, status draft | approved | sending | sent | done | skipped | failed), `ve_people_outreach_notes`, and
  `ve_people_outreach_templates` (the two or three base emails a bucket: approving one, `template_approve`, approves its messages that are
  not `personal`, and any later message made from it starts approved; personal ones always wait for Sean).
- **Server**: edge function `ve-people-outreach` (verify_jwt off; the VE token of a super admin, or `LESARUSS_ADMIN_TOKEN` with
  `as_member`): `day`, `overdue`, `get`, `save`, `approve`, `pull_back`, `done`, `skip`, `reopen`, `note`, `follow_up`, `test`, `create`,
  `templates`, `template_approve`, `tick`. Cron `ve-people-outreach` (every 5 minutes, x-cron-secret) runs `tick`: approved emails whose
  time has passed are claimed (`sending`), sent through `email-send` as brand `lesaruss` (from Sean A. Russell, replies to
  contact@lesaruss.com, one-click unsubscribe and the postal address, `campaign_ref` `ve-people-<id>` so nothing goes twice), then marked
  Sent, or Did not send with why (do-not-email list, bad address). Opened comes from `email_events`, clicks from the message's `/go/` link.
- **Loaded 2026-11-01** (20 messages, campaign `outreach-nov`, each with its own tracked link): Monday the Miami Meetup post and Instagram to
  Keya, Elle, Paige and Michelle; Tuesday emails to Dina's, The Rabbit Hole, Christopher's Kitchen and Love Life Cafe, Instagram to
  Stephanie's, Greens and Grains and Aguacate, emails to Ella Magers, John Thomas, Korin Sutton, Susan Hargreaves and Saffron Rivett, a text
  to Carol (Florida Animal Rescue Alliance unsubscribed from our email, so never email it); Wednesday the Broward and Friday the Palm Beach
  Meetup posts. All personal, so every one waits for Sean.
- **Made-right memberships** (same day): comps stay off, but a Founding Member invitation is on us, with 1,100 points, for the emails in
  `ve_site_settings` `founding_member.made_right` (Elle Jimenez, Korin Sutton, Ella Magers: they paid on the old platform and did not get its
  worth; `madeRight` in `ve-invites`, migration `20261101_made_right_memberships.sql`). Sean tells them in his second message, never the
  first. Proven live: Ella's test invitation came out on us, someone not on the list was refused, both removed.
- Built since: pick people and make drafts, the Campaigns table and the Week view (see Three doors, one Welcome, campaigns on people). Not built yet: replied and joined counts, Logan's proposed 30 for the next day, campaigns from
  BrandDesk feeding the queue, and reply tracking (replies land in contact@lesaruss.com, not here).

## Media drafts and the organizations door (Sean, 2026-11-06, playbook `ve-outreach`)

Explorer step 3 and free media claims are live (main 2a5ef27; the Explorer survey admits on finishing; a member claims a podcast, YouTube or
news page free; `ve-claims` v50). `ve_people_outreach.template_key` `team` sends as brand `vegans-explore`, never Sean's name (`ve-people-outreach` v9).
32 media drafts (`media-nov`, Mon Nov 9) and 25 civic drafts (`civic-nov`, Tue Nov 10) wait in Depot > Outreach. The organizations questionnaire
(`ve_surveys` `organizations`, Inbox source `org_survey`) is live; its slideshow preview (`business/organizations.html`, branch only) was rejected by
Sean as the old style: rebuild it as a Guide on the Creator Guide, in his words, no travel headline, and rewrite the civic drafts before any approval.
Handoff `docs/handoff/2026-11-06-ve-outreach-media-drafts-organizations-door.md`.

## People campaigns in BrandDesk, and founding cohort 1 (Sean, 2026-11-08, playbook `ve-outreach-buckets`)

"It was always our intention to send to people who aren't business owners... built into the outreach, and so we can track it the way we track
everything else." A BrandDesk campaign with `audience` `people` holds members by email (`ve_outreach_campaign_members.person_key`, plus
`person_name`, `person_id`), no listing, and sends through the same `campaignTick` with the same rules and the same per-member tracked `/go/` link
and `email_sends` rows (migration `20261108_people_campaigns.sql`; `ve-outreach` from 3ec1db0, sha256 bb430bd9; it still has `campaignTick`). Each
person's outreach contact is segment `person` on the list `people-campaigns`, which is never switched on. A campaign's `footer_reason` words the
footer. HQ (branch `claude/focused-fermi-o89hgt`, not on HQ main): a People tile, person rows, preview and test by `member_id`, and Opened / Clicked
on every campaign row. **Cohort 1** `founding-cohort-1-2026-11`: 151 from Suggested for Vegans Explore (list `docs/proposals/founding-cohort-1-list.md`),
from Sean, to the Welcome Guide, start Mon Nov 9, a draft until Sean locks and approves; three Wednesday Holiday Guide follow-ups by engagement
(`founding-cohort-1-wed-clicked|opened|quiet`), drafts with no people until Wednesday morning. Handoff
`docs/handoff/2026-11-08-ve-outreach-buckets-founding-cohort-email.md`. Not built: adding people to a people campaign from HQ.

**Approved and the people tools (2026-11-08)**: cohort 1 approved by Sean (135 waiting, 16 held out), sends from Mon Nov 9. A campaign's people can be ticked and given an Action (hold out of this batch, put back, Do not email, take off Do not email; `campaign_bulk`); held out and Do not email people leave the list until shown with the heading's link. Personal emails have Save and close and Undo (`personal_emails.undo_<step>`). Wednesday follow-ups fill Wed Nov 11. Handoff `docs/handoff/2026-11-09-ve-outreach-buckets-cohort-1-approved-hold-out.md`.

**The 36 hidden Facebook pages are a bounty (2026-11-08, playbook `ve-community-directory`)**: no Community Manager exists, so campaign `confirm-facebook` (6 remote bundle
jobs, 60 points each, due Nov 22, South Florida board) asks members to find each page signed in to Facebook, with a link and screenshot or "No page found". A checked page is
restored with one `ve_listing_edits` row (meta.playbook ve-community-directory, source the submission); the SQL is in `docs/handoff/2026-11-08-ve-community-directory-facebook-bounty.md`.
Nothing restored yet. Migration `20261108_bounty_confirm_facebook.sql`. **A remote bounty shows on every chapter's board** (Sean, 2026-11-08: "a bounty that goes to all chapters"; `ve-bounties` v17 from 8940496, sha256 6528824b matched): `list` returns the chapter's bounties plus every open `remote` one, so the six Facebook jobs (the only remote bounties) appear in all 13 chapters; claim and submit already accepted any chapter. Proven live as the Logan test account: listed on Atlanta, London and New York, claimed and released (the released row is left; it counts for nothing). **Announced and Honest Cuban settled (2026-11-08)**: a `ve_pulse_features` row puts the bounty first in every city's Daily Pulse Nov 9 to 15 ("Earn 60 points from home", link `/bounties?campaign=confirm-facebook`); Honest Cuban's Instagram is `@honestcubanofficial` (Sean; Apify: HONEST CUBAN BY VCC, formerly Vegan Cuban Cuisine, 35,664 followers), saved with a `ve_listing_edits` row, and its bounty part no longer asks about Instagram. **Pulse subscribe** (still off, `pulse_subscribe.on` false): every issue now ends with Join free (the Explorer survey) instead of the old Passport line every fifth issue (`membership_line_every` 1, `ve-pulse-subscribe` v3 from aba5053). **Turned on 2026-11-08** (Sean: "turn it on"; `pulse_subscribe.on` true, `ve-pulse-subscribe` v4 from 33268f7): the test issue found every email was refused by `email-send` ("html must contain {{unsubscribe_url}}"), so no confirmation or issue could have gone out; the footer now carries it. A test issue reached contact@lesaruss.com, a real sign-up with that address sent its confirmation (delivered), and the box shows on `/pulse` at 1440 and 390 px. Any email through `email-send` needs `{{unsubscribe_url}}` and `{{postal_address}}` in its html.
**Redone 2026-11-09 (Sean: "take where the search is and make that 50... a 2 column... a call to action just to subscribe to the Pulse"; playbook `ve-daily-pulse-discussion`)**: on `/pulse`'s Daily Pulse tab the search and the subscribe share one row, half and half (`#pulse-top`, `#vps-slot`, stacked at 760 px and under); the subscribe is one email field and Subscribe. Subscribe opens a window (Choose your Daily Pulse: cities, up to three; Every day or Once a week; the London box), Confirm sends the confirm email as before and the window says Check your email with Close. Articles get the same form as a card at the foot; the exit pop-up holds it too; the big box after the first card is gone. Anyone can subscribe, member or not. **Depot > Pulse subscribers** (`/admin/depot/pulse-subscribers`, Content): every subscriber with their cities, how often, Subscribed / Waiting to confirm / Stopped, the page and time they signed up (`ve_tasters.pulse_source`, `pulse_requested_at`, migration `20261109_pulse_subscribers_source.sql`) and issues sent; `ve-pulse-subscribe` `list` (super admins), v5.

## Orientation by path (Sean, 2026-11-08, playbook `ve-outreach-buckets`)

"We need an orientation for people who completed the Explorer program... if they happen to complete get a badge... unsubscribe them from
that and then subscribe them into that automation." Six BrandDesk people campaigns, three notes a week apart from the team, first the day
after: `orientation-explorer` (finished the Explorer survey, no path badge), `orientation-restaurant`, `-events`, `-creator`, `-nonprofit`,
`-business` (the path surveys). `ve_orientation_sync()` (cron `ve-orientation-sync`, every 15 minutes) enrolls people and, on a path badge,
stops them on the Explorer one (`stop_reason` "moved to <slug>") and starts the path's; one path at a time; a path not approved leaves them on
Explorer; only completions after the later of start day and approval count. Each has a stopped sample person (contact@lesaruss.com) for
previews and tests, never sent. All draft until Sean locks and approves each in HQ (Outreach > Campaigns > Orientation). Migration
`20261108_orientation_explorer_paths.sql`; proven in a rolled-back transaction. Once `orientation-events` is approved, turn off ve-nurture's
Events Guide Day 3 and 7 notes (`nurture.door_on`) so hosts are not mailed twice.

## 2026-11-10 to 11: Holiday launch, Review and backups, the pause
Full record in `docs/handoff/2026-11-11-holiday-launch-and-brand-lock.md` and playbook `ve-outreach-buckets`. Rules from it: people moved to
Review leave group lists and counts until Sean decides; a duplicate person has one primary email and backups that send only if the primary
bounces (personal address over a business one); every launch email says who we are and how we know them; all campaigns paused 2026-11-11
until the Color Block brand is live (welcome-community excepted).

## 2026-11-13: Media outlets, the private PR list
Sean: "collect all the media outlets into one location. I don't necessarily want to put them on the directory, public facing... another
service we can offer... we still treat them like they're directory listings, but not everyone, we can designate which ones we want to have
facing the public." Filled from the "Google Alert - Vegan" emails in srussell@lesaruss.com (read server-side with
`GMAIL_REFRESH_TOKEN_SRUSSELL`, read-only; the Claude Gmail connector is NOT the path, error registry `GMAIL-INBOX-AGENT-NO-CONNECTOR`) since
2026-01-01, plus the News Desk (`ve_news_leads`). Tables `ve_media_outlets` (one row per website domain, listing-shaped, `is_public` off by
default, `notes` written by the rollup, `team_notes` ours) and `ve_media_coverage` (one row per article: stance flattering / neutral /
critical toward the Vegan community, topic, a reason when critical), function `ve_media_outlets_rollup()`; migration
`20261113_ve_media_outlets.sql`. Social platforms (YouTube, Facebook, Instagram and so on) are left out. News Desk rows whose link is a
`news.google.com` redirect (about 2,800) are not in yet: the real site is not in the link. Depot > Content > Media outlets
(`/admin/depot/media-outlets`, function `ve-media-outlets`, super admins only): filter by how they cover us, kind, reach, Public / Private,
one outlet per view (`#/outlet/<slug>`) with its articles, Make public / Make private and our notes. Backfill ran through the one-time
`ve-once-media-outlets` (back to the 410 stub after). Next: a daily feed of new alerts, reporter contacts per outlet, and the BrandDesk PR
service (a client's own alert topic builds their list).
