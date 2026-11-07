# ve-outreach: media drafts live, organizations door half built (2026-11-06)

## Done and live (main 2a5ef27, merged on Sean's go)
- Explorer v7 step 1 (re-weight, two x_run options) and step 3 (finishing the Explorer survey admits at once; `ve_surveys.reviewed` false).
- Free media claims: a member claims a Podcasts, YouTube or News Outlets listing free (`ve-claims` `start` with `pay: 'member'`, v50, sha256 matched); claim.html "Claim it free"; a non-member is sent to `/survey?s=explorer` and back (`sessionStorage` `ve_claim_after_survey`).
- Team sender: `ve_people_outreach.template_key = 'team'` sends as email brand `vegans-explore`, not Sean (`brandOf` in `ve-people-outreach`, v9, sha256 matched; template row `team` exists only for the foreign key).
- Checking in (closed-checking-in) paused; activate in 1 to 2 weeks (Sean).

## Waiting on Sean in Depot > Outreach (nothing sends until he approves)
- 32 media drafts, Mon Nov 9, campaign `media-nov` (24 podcasts, 7 YouTube, UnchainedTV), signed Vegans Explore Bookings, own /go/ links. Wording approved: "30 years of building websites, running campaigns, making videos and podcasts, and hosting events"; "From January 1, 2027, we'll be in every city where we have a chapter through our members, community bounties, local partners and daily content, and on the road at events around the world." The 2% line was dropped (Sean). John Lewis (Sean reaches out), The Bodybuilding Vegan (member) and Torre excluded.
- 25 civic drafts, Tue Nov 10, campaign `civic-nov` (visitor bureaus, chambers, downtown districts), signed Vegans Explore Partnerships. **Do not approve yet**: their subjects and opening use a travel angle Sean never approved, and their links go to `/business/organizations`, which is only on the branch. Three addresses flagged to check (Visit Orlando, Equality Chamber DC, Visit Philadelphia's agency address).

## Organizations door (canon-ve-door-guides v8): what Sean approved vs what was built
- Approved: preview with no prices, CTA a free account through a short questionnaire, then a call, then a custom proposal.
- Live in the database: survey `organizations` (9 questions, 250 points, admits, no review); a finished one is an Inbox row (source `org_survey`). Migration `20261106_organizations_survey.sql`.
- On branch `claude/zen-einstein-tew79i` only (8df8410, NOT merged): `business/organizations.html` (a slideshow copied from `business/supermarkets.html`) and the survey.html thank-you for organizations.
- **Sean rejected the slideshow** ("an old style... drifting from the guides") and the travel framing (my addition, never approved). His direction at wrap: build it as a Guide using the **Creator Guide** as the parent (template gate). Message in his words: 10 years in this community since 2016, opening January 1, a presence in every chapter city, then the questionnaire, a call and a proposal made for them; travel only one item among possibilities. Liz's or another Guide's lines go to Sean as text first.
- Then: rewrite the 25 civic drafts to match and point them at the Guide; drop or replace `business/organizations.html` on the branch.

## Other open items
- 55 civic organizations have no published email (scratchpad list `civic-orgs.csv` is session-only; rebuild from search if needed).
- The sponsor list; routine Monday sends; the Hot Lab meetings merge (HQ branch `claude/quirky-hawking-7xrux2`) on Sean's go; Explorer v7 steps 4 onward.
- Temp tables `zz_podcast_owner_fetch` and `zz_media_email_check` dropped at wrap.
