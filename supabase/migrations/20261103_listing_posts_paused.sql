-- ve_listing_posts: a 'paused' status (Sean, 2026-11-03: "do the paused status too").
-- Stop showing my Instagram posts used to set every shown post to 'hidden', and Show my posts again put back every unpinned
-- 'hidden' one, so it re-showed posts the owner had hidden by hand and (before 2026-11-03) left pinned ones hidden.
-- Now Pause moves shown posts to 'paused' (their pins kept) and Resume moves only 'paused' back to 'shown'; 'hidden' is only ever
-- the owner's own choice. Public read stays status = 'shown', so a paused post is private like a hidden one.
alter table ve_listing_posts drop constraint if exists ve_listing_posts_status_check;
alter table ve_listing_posts add constraint ve_listing_posts_status_check check (status in ('shown', 'hidden', 'paused', 'removed'));
