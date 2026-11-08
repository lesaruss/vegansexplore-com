# ve-community-directory: confirm the 36 hidden Facebook pages, as a bounty (2026-11-08)

Playbook `ve-community-directory`. Follows `2026-11-08-ve-feedback-facebook-hidden-queued.md` (merged here from `claude/nifty-lovelace-rqrmsb`).

## Done
- **No Community Manager exists** (0 active on 2026-11-08), so a CM job would sit unclaimed. The task is an online research bounty instead,
  copied from Map the venues (`map-the-venues`).
- Campaign `confirm-facebook` "Find their Facebook pages" (South Florida board), 6 bundle jobs, **60 points each**, one person each, `remote`
  true, due 2026-11-22 midnight Eastern (`due_at` 2026-11-23T04:59Z): South Florida 1, South Florida 2, Florida and the Mid-Atlantic,
  New York, Philadelphia and Southern California, Los Angeles and London, London and our media. 34 parts cover all 36 listings
  (Sweet Leaf's two locations share one page, so do Sagar's). Each part names the place, its city and the old link. Honest Cuban's part also
  asks whether `@honestcuban` on Instagram is theirs. The brief asks for each page's link and a screenshot of its top, or "No page found" with
  what was searched; fan pages, review sites and namesakes do not count; we check every page before paying.
- Applied live through the connector; migration `20261108_bounty_confirm_facebook.sql` (idempotent). Points are Logan's default, Sean's to change.
- Playbook record cfac2f06 (decision).

## Nothing restored yet
No submission exists, so no page was restored. **When a submission comes in** (Depot > Bounties > review), for each page that checks out:

```sql
with l as (select id from listings where slug = '<slug>' and status = 'approved' and facebook is null)
update listings set facebook = '<checked link>' where id in (select id from l);
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'facebook', null, '<checked link>',
  jsonb_build_object('by','logan','why','Confirmed by a member''s Facebook search, checked by the team',
    'where','bounty','playbook','ve-community-directory','source','<submission id>','decided_by','sean')
from listings where slug = '<slug>' and status = 'approved';
```

Sweet Leaf and Sagar: restore both locations. "No page found" leaves the listing empty (its old value stays in `details.social_removed`).
Then approve and pay the job.

## Limits
- The board lists jobs by chapter, so these show only on South Florida's board (as Map the venues does); a remote job's own page opens for a
  member in any city. Link: `/bounties?community=south-florida&campaign=confirm-facebook`.
- Not seen in a browser this session (the list needs a member token).
