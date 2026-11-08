# ve-community-voices: Honest Cuban by VCC and the comment form (2026-11-08)

Playbook: **ve-community-voices** (new; Logan's call, Sean to confirm). Asking businesses, people, organizations and the community for a
comment by voice or in writing, and using what comes back in the Daily Pulse, articles, the podcast and listing spotlights. Related:
`ve-community-directory` (the listing rename), `ve-outreach` (the email goes through Depot > Outreach).

## Done
- **Directory**: listing `vegan-cuban-cuisine` (id 4f737d4e-e118-46e4-aca4-6639bea26aaa) renamed **Honest Cuban by VCC**. Source: their own
  Facebook post ("officially becoming Honest Cuban", same kitchen, team and recipes). Tagline and description say "formerly Vegan Cuban
  Cuisine" so searches for the old name still find it; `details.former_names`; a team note; three `ve_listing_edits` rows. Slug kept so every
  old link works. Website left as vegancubancuisine.com until they tell us otherwise.
- **Daily Pulse**: `ve_pulse_features` row (South Florida, 2026-11-08, live), applied to today's South Florida draft as its first story,
  publishing 7:00 AM Eastern. Links to their Directory page. Not yet checked as published.
- **The comment form**: `/comment/<code>` (`comment.html`, `noindex`, parent `claim.html`): the ask, then 3 steps (Your comment: record up to the
  request's limit, listen back, record again, or attach a voice memo, or write it; About you: name, credit line, optional email, may we name you;
  Review and send: the release and 18+), then Thank you with Claim <listing> (when unclaimed), Join free (signed out) and See it. `?preview=1` or
  code `sample` is Green Leaf Kitchen, nothing sent. Migration `20261108_comment_requests.sql` (`ve_comment_requests`, `ve_comment_responses`,
  private bucket `community-comments`, RLS on, no policies). Edge function **`ve-comments`** (verify_jwt off): public `get`, `upload`, `submit`;
  team `list`, `create`, `update`, `get_admin`, `response_set`. One answer closes a request unless `multi` (community comments). Each answer
  emails contact@lesaruss.com (reply-to them) and thanks them. **Depot > Comments** (`/admin/depot/comments`, Content): requests by status,
  New request, one request with its link, Copy, See their page, every answer (play, download, written words), Approved / Used (where it ran) /
  Not using, team note.
- **Proven live** on a [TEST] request: no release, empty, wrong file type, forged upload key, too long all refused; a real WAV uploaded and
  submitted; the request closed after one answer; get_admin, response_set and list as Sean. Page checked at 1440 and 390 px beside claim.html
  (same family, no script errors, no sideways scroll).
- **First request**: code `honest-cuban`, https://vegansexplore.com/comment/honest-cuban (live once this branch is on main), voice up to 3:00.

## Not done (the Supabase connector held a delete for an approval that never showed; nothing after it touched the database)
1. The email row in Depot > Outreach and its tracked link (draft below). Waits on Sean's approval anyway (personal message).
2. Delete the [TEST] request `zz-test-cmt` (answered, never shown anywhere) and its 32 KB test WAV in `community-comments/zz-test-cmt/`.
3. Redeploy `ve-comments` from the commit with the m:ss "too long" wording (live v2 says "0.5 minutes").
4. `ve_playbook_index` row and playbook record for `ve-community-voices`.
5. A Guide script for the comment page (every page needs one; Liz, text draft for Sean).
6. Merge the branch so `/comment/<code>` and Depot > Comments are live.

## The email (draft, from Sean, to vegancubancuisine@gmail.com)
Subject: Honest Cuban by VCC: a quick word for our community?

Hi Liz and Steven,

Congratulations on Honest Cuban by VCC. This morning's South Florida Daily Pulse led with the news, and your Vegans Explore page now carries the
new name.

I'm writing a fuller story and would love it in your words: why you made the change, what Honest Cuban means to you, and what stays the same.
You can record a short voice note right from your phone, or write it out, whichever is easier. If you record it, we may play it in the story.

{link}

While you're there, take a minute to claim your page on Vegans Explore. It's free for members (a short survey gets you in, and before
January 1 that makes you a Founding Member), and then the hours, photos, menu and links are yours to keep current.

Thank you for everything you've built for our community.

Sean

## Update, same morning (Sean: "approved", then "move it")
- Branch merged to main (7ca7893); `/comment/honest-cuban` and Depot > Comments are live; `ve-comments` v3 (source sha256 29245b6c matched).
- The email first went into Depot > Outreach for 10 AM; Sean wanted to review it in BrandDesk, so it was pulled back (status skipped, its link
  `hc-comment` turned off) and rebuilt as the **BrandDesk campaign `honest-cuban-comment-2026-11`**: one business (Honest Cuban by VCC), from Sean
  (`sender_brand` lesaruss), the approved words with "This morning's" changed to "Sunday's", its own tracked link to `/comment/honest-cuban`
  (`link_path`), email locked, campaign **draft**, start Mon 2026-11-09. BrandDesk campaigns send weekdays 9 AM to 5 PM Eastern only, so nothing
  could go on Sunday. It sends once Sean approves it in BrandDesk > Outreach > Campaigns. Written through the one-time `ve-once-honest-cuban`
  (now the 410 stub). The [TEST] request is deleted (its 32 KB test WAV stays in the bucket; Storage refuses SQL deletes).
- `ve_playbook_index` row `ve-community-voices` (waiting_on_sean) and its first decision record are in.
- Honest Cuban is also in `thanksliving-2026-vegan` (from the team, Tuesday). Two emails two days apart unless Sean takes them out of one.
- Lesson: outreach goes through BrandDesk campaigns, never Depot > Outreach.

## Update: out of ThanksLiving, thank-you follow-up (Sean, same morning)
- Honest Cuban removed from `thanksliving-2026-vegan` (`ve_outreach_campaign_remove`, the BrandDesk Remove).
- When their statement lands in Depot > Comments: build a one-business BrandDesk campaign from Sean, a thank you, then the ThanksLiving Holiday
  Guide invite with their own link to `/business/holiday-menu?listing=vegan-cuban-cuisine` (menus close end of Wed Nov 18). Draft words below,
  for Sean to approve in BrandDesk. If no answer by Thu Nov 12, bring Sean the choice of sending the ThanksLiving invite on its own.

Draft: Subject "Thank you, Liz and Steven"
Hi Liz and Steven,

Thank you for sharing the story behind Honest Cuban by VCC. We will let you know as soon as it runs.

One more thing while we have you: our free Holiday Guide puts Vegan ThanksLiving menus in front of people in South Florida who would rather
order their table than cook it all. If Honest Cuban is doing a holiday menu, send it to us (what you're making, your order-by date and your
holiday hours) and we will feature it, 100% Vegan places first. You can type it in or drop a photo or PDF of your menu:
{link}

Menus close at the end of Wednesday, November 18.

Thank you again,
Sean

## Update: one email, two asks (Sean, same morning)
The thank-you follow-up above is replaced. The campaign `honest-cuban-comment-2026-11` ("Honest Cuban by VCC: their story and their ThanksLiving
menu") now asks for 1. their story ({link}, their own tracked link to /comment/honest-cuban) and 2. their ThanksLiving menu (`/go/hc-thanksliving`
to /business/holiday-menu?listing=vegan-cuban-cuisine; menus close end of Wed Nov 18), then the claim line. Subject "Honest Cuban by VCC: your
story, and your ThanksLiving menu". Locked, draft until Sean approves in BrandDesk; sends Monday from 9 AM ET. No Nov 12 check needed.

## Update: Holiday Guide link and the test
- Point 2 now opens with "Take a look:" and `/go/hc-holiday-guide` (to /guides/holiday-guide), then the menu ask and `/go/hc-thanksliving`.
- [Test] sent to srussell@lesaruss.com (ve-outreach `campaign_test`, result sent). Sean's super admin row is **contact@lesaruss.com**
  (72712a4a-ea0e-4ef4-a29e-d382496ef8da); srussell@ is not a super admin, so `member_id` on the three rename edits and `p_by` on the ThanksLiving
  removal are null. Use the contact@ row for `as_member`.
- Test clicks on the Holiday Guide and menu links are real /go/ clicks (the comment link in a test goes straight to the page).
- Sean sends it once he is happy with the Holiday Guide (playbook ve-holiday-guide); approval in BrandDesk, weekdays 9 to 5 ET.
