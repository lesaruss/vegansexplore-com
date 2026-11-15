-- Votes are vouches (Sean, 2026-11-15, LOCKED: "Let's lock it in... only count my vote once for each listing that I voted for... make it
-- so somebody can unvote as well"). listings.vote_count, which every Directory shows and sorts by, is now the number of people who vote
-- for a listing (the same as voter_count), never the number of taps. ve-votes takes one vote per member per listing and `unvote` takes
-- it back (deleting their rows, which this trigger counts down). Older repeat votes stay as rows for the record; they count once.
-- Safe to run twice.
create or replace function public.fn_listing_vote_count()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare lid uuid := coalesce(new.listing_id, old.listing_id); n int;
begin
  select count(distinct member_id) into n from public.listing_daily_votes where listing_id = lid;
  update public.listings set vote_count = n, voter_count = n where id = lid;
  return null;
end $function$;

update public.listings l set vote_count = x.n, voter_count = x.n
from (select l2.id, coalesce((select count(distinct v.member_id) from public.listing_daily_votes v where v.listing_id = l2.id), 0)::int n from public.listings l2) x
where x.id = l.id and (l.vote_count is distinct from x.n or l.voter_count is distinct from x.n);
