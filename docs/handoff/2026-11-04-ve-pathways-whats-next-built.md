# ve-pathways: What's next built, Liz's Get in and What's next lines recorded (2026-11-04, Logan)

Branch `claude/dazzling-archimedes-3rxgti` (not on main; merging is Sean's step). Commit author: Claude `<noreply@anthropic.com>` (Sean chose it, 2026-11-04).

## Playbook names
- `ve-pathways: What's next page and the one-door Get in (Restaurant Guide V1)`: built, on the branch.
- `ve-pathways: What's next becomes the Welcome Guide (orientation, tailored by door)`: Sean's direction, not built.
- `ve-outreach-buckets: all outreach under People in BrandDesk`: Sean's ask, not built (he cannot find Depot > Outreach).
- `ve-feedback: business bounties (for example gift cards into the Vault for points)`: idea only.

## Built (commits f31987f and the next one)
- `guide-scripts/vegan-restaurant-guide.js`: a members-only **What's next** tab (`#/next`, `#/next/follow`), nine tiles (Make a contribution to `/dashboard?contribute=1`, Share your story and Opportunities as Coming with Tell me when it opens into `member_interest` `restaurant-guide-<key>`, Claim your page, Open your dashboard, Share your link `/r/<code>`, Read the Welcome Guide, Post a job, Follow us). **Follow us**: the four checked socials and Tell us you joined (Copy message; Facebook and email prefill; Instagram and TikTok copy first). Get in is one door, the survey; no $11 door, no points promised anywhere. A finished survey lands on `#/next` (`?welcome=survey`).
- Checked at 1440 and 390 px beside `passport.html?guide=welcome` against a mocked signed-in member: same family, no script errors. A real unpaid-to-member run is unproven.
- Liz recorded with `el-media` (voice `IUMUPi350HfIhyzUBJB3`, read from her roster profile), checked word for word with `stt`: `vegan-media/media/liz/restaurant-guide/door-join-v1.mp3` ("There is one way in, and it is free. Take the short survey. When you finish, you are a member.") and `door-next-v1.mp3` ("You are in. Thank you. Here is what you can do next. Claim your page, open your dashboard, and follow us so we can follow you back."). Wired as `AUDIO.join` and `AUDIO.next` (`lizAudio`: join for visitors, next for members).

## Sean's direction, not built (recommendation given, default taken)
1. **What's next becomes a short guide, not a menu**: four steps, one per view, the step list always on the right: Claim your page; Your points (what they have and where it came from); Spread the word (link, Follow us, Tell us you joined); Optional (contribute, Share your story, Opportunities, post a job). It is **the Welcome Guide**, the orientation guide: businesses see it in BrandDesk, everyone else on their dashboard, tailored by the door they came through. Re-record the `next` line when the words change.
2. **The sorting hat** (next piece after the restaurant batch): the Explore door is the catch-all for regular members and routes a suspected business or creator to its own track.
3. **Points wording**: only what exists. Members can give points to a listing (Give box); say they show on the dashboard, after checking an owner can see them. **Never promise spending them** (a photographer, ads, tickets): points as coupons is described, not locked, not built (the business points rule, Earn your Passport part 7).
4. **All outreach under People in BrandDesk** (HQ). Today it is Depot > Outreach (`/admin/depot/outreach`) and Depot > Business outreach (`/admin/depot/business-outreach`), and Sean cannot find them. Its tables are shared, so it moves unchanged; needs a plan in HQ (lesaruss/lesaruss-hq).

## Next, in order
1. Sean merges the branch to main.
2. Load the emails (Day 0, 4, 10, Instagram message) as drafts in Business outreach; Find emails; pull a random 30 across regions with published emails; Send me a test to contact@lesaruss.com. Nothing sends until Sean approves and a city is on. Sean overrode city by city for this spread of 30 (his words: "I feel good sending this to anybody now"); the 15-day commitment still guards the plan.
3. Rebuild What's next as the four-step Welcome Guide; then mount it on the dashboard and in BrandDesk.
4. Plan outreach under BrandDesk > People.
5. Not built: Can be shown switch, plus-button list for question 16, Their story.

## Notes
- The Supabase connector held one `execute_sql` for an approval that never showed (the call with `pg_sleep`); splitting it into a write call and a read call worked. Do not combine a pg_net post, a sleep and a read in one call.
- Times to Sean are Eastern.
