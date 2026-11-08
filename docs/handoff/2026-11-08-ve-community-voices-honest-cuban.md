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
