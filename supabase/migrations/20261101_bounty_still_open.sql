-- Is it still open? (Sean, 2026-11-01: "Make the 36 on hold a bounty"; earlier: "worst comes to worst, we can have that as a bounty to give
-- people things to do"). The 36 places the nightly check holds for no socials and no website, which Google lists as open but with few or
-- old reviews: one Bounties campaign in each of their nine chapters, one job a place, so a member takes the ones near them. In person: a
-- photo of the storefront today and, if open, of the menu, the counter or a receipt, and the hours on the door. Closed is just as useful.
-- 50 points a place, one person each, 30 days (Logan's defaults, Sean's to change). Reviewed in Depot > Bounties; on approval the team
-- puts the place back or marks it closed (Directory review), with what the member found. Safe to run twice.
insert into ve_bounty_campaigns (slug, community_slug, kind, title, story, cover_url, due_at, status, proposed_by, decided_by, decided_at)
select 'still-open-' || ch, ch, 'ongoing', 'Is it still open?',
  'These places are on Google but have gone quiet: no website, no socials, few recent reviews. Stop by, tell us if they are still serving, and we put them back on the Directory or say goodbye properly. Every place you check makes the Directory one you can trust.',
  null, '2026-12-01 04:59:00+00', 'open',
  'aa000000-0000-4000-a000-000000000010', 'aa000000-0000-4000-a000-000000000010', now()
from (select distinct ve_chapter_of(l.address_city, l.address_state) ch from listings l
      where l.status = 'pending' and l.details->'review'->>'by' = 'Nightly check' and l.google_place_id is not null
        and l.details->'review'->'reasons' ?| array['No socials','No website','The website did not open','The monthly check-up flagged it as gone quiet']
        and not (l.details->'review'->'reasons' ?| array['Google says it is temporarily closed','Google says it is permanently closed'])) c
where ch is not null and not exists (select 1 from ve_bounty_campaigns b where b.slug = 'still-open-' || c.ch);

insert into ve_bounties (community_slug, campaign_id, kind, title, brief, deliverable, points, slots, max_awards, due_at, status, sort, parts, remote)
select c.community_slug, c.id, 'other', 'Is ' || l.name || ' still open?',
  'Go to ' || l.name || ' at ' || concat_ws(', ', nullif(l.address_street, ''), nullif(l.address_city, ''), nullif(l.address_state, '')) ||
  ' (on the map: https://www.google.com/maps/place/?q=place_id:' || l.google_place_id || '). If it is open, take a photo of the outside, then one inside: the menu, the counter or your receipt, and the hours posted on the door. If it is closed for good or gone, a photo of the storefront as it is now is just as useful. Add their Instagram, Facebook or website if you see one. Photos from today only, taken by you, never from Google or their pages. We check them before paying and update the listing with what you found.',
  'Photos from your visit, open or closed', 50, 1, 1, '2026-12-01 04:59:00+00', 'open', 0,
  array['A photo of the outside, taken today', 'If open: the menu, the counter or your receipt', 'If open: the hours posted on the door', 'Their Instagram, Facebook or website, if you saw one'],
  false
from listings l
join ve_bounty_campaigns c on c.slug = 'still-open-' || ve_chapter_of(l.address_city, l.address_state)
where l.status = 'pending' and l.details->'review'->>'by' = 'Nightly check' and l.google_place_id is not null
  and l.details->'review'->'reasons' ?| array['No socials','No website','The website did not open','The monthly check-up flagged it as gone quiet']
  and not (l.details->'review'->'reasons' ?| array['Google says it is temporarily closed','Google says it is permanently closed'])
  and not exists (select 1 from ve_bounties b where b.campaign_id = c.id and b.title = 'Is ' || l.name || ' still open?');
