-- branddesk-production-wing: the Depot home (Sean, 2026-11-07). The Depot opens on an overview of sections instead of the Library,
-- each tile showing what is waiting today; retired tools sit in a visible trash bin that Sean can restore from himself.
-- ve_depot_counts(): the numbers on the tiles. Service role only; read through the edge function ve-depot (super admins).
create or replace function public.ve_depot_counts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'events_waiting', (select count(*) from events where status = 'pending'),
    'claims_waiting', (select count(*) from ve_listing_claims where status in ('submitted', 'paid')),
    'listings_on_hold', (select count(*) from listings where status = 'pending' and details ? 'review'),
    'logos_to_do', (select count(*) from listings l where l.status = 'approved'
        and coalesce(l.business_status, '') <> 'CLOSED_PERMANENTLY'
        and coalesce(l.logo_url, '') = ''
        and coalesce((l.details->>'logo_letter_ok')::boolean, false) = false
        and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'])),
    'logos_suggested', (select count(*) from ve_logo_suggestions where status = 'found'),
    'inbox_open', (select count(*) from ve_inbox_items() i left join ve_inbox_state s on s.source = i.source and s.source_id = i.source_id
        where s.replied_at is null and s.closed_at is null),
    'search_questions_open', (select count(*) from ve_search_questions where status = 'open'),
    'bounty_proofs', (select count(*) from ve_bounty_submissions where status in ('submitted', 'applied')),
    'checkin_actions', (select count(*) from ve_checkin_actions where status = 'pending'),
    'watchlist', (select count(*) from ve_abuse_cases where status = 'watching'),
    'ideas_new', (select count(*) from ve_ideas where status in ('new', 'read')),
    'feedback_new', (select count(*) from ve_feedback where status = 'new'),
    'guides_live', (select count(*) from ve_guides where published)
  );
$$;
revoke all on function public.ve_depot_counts() from public, anon, authenticated;
grant execute on function public.ve_depot_counts() to service_role;

-- The trash bin: which retired tools Sean has put back. Retired tools are listed in public/depot-tabs.js (TRASH); a restored one
-- shows in its section again. Nothing is deleted either way.
insert into ve_site_settings (key, value)
values ('depot_trash', jsonb_build_object('restored', '[]'::jsonb))
on conflict (key) do nothing;
