-- Sean, 2026-11-05 (playbook ve-page-guide), phase 1: the super admin's chat with the page's Guide. Sean tells it what to change
-- on a listing, it shows the exact changes, he confirms, it applies them (each a ve_listing_edits row or an outreach event).
-- 1. A name Sean sets by hand is confirmed, so the outreach greeting uses it even when the email address does not contain it.
alter table ve_outreach_contacts add column if not exists name_confirmed boolean not null default false;

create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
returns table(subject text, body text, to_email text, page_url text, guide_url text)
language sql stable security definer set search_path to 'public' as $function$
  with x as (
    select r.*, c.listing_id, split_part(btrim(coalesce(c.contact_name, '')), ' ', 1) as first,
           (c.listing_id is null or c.name_confirmed or ve_outreach_name_ok(c.contact_name, c.email)) as name_ok
      from ve_outreach_render_base(p_contact, p_step) r
      left join ve_outreach_contacts c on c.id = p_contact
  )
  select case when nullif(first, '') is not null and name_ok
              then replace(x.subject, '{first_name}', first)
              else replace(replace(x.subject, ', {first_name}', ''), '{first_name}', '') end,
         case when name_ok or nullif(first, '') is null then b
              else replace(b, 'Hi ' || first || ',', 'Hi there,') end,
         x.to_email, x.page_url, x.guide_url
    from x,
    lateral (select case when position('{free_check}' in x.body) > 0
                         then replace(x.body, '{free_check}', coalesce(case when x.listing_id is not null then ve_outreach_free_check(x.listing_id) end, ''))
                         else x.body end as b) bb
$function$;

-- 2. Every conversation turn and what was applied. RLS on, no policies: only ve-page-guide reads and writes it.
create table if not exists public.ve_page_guide_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  member_id uuid not null,
  page_url text not null,
  listing_id uuid,
  kind text not null check (kind in ('chat', 'apply')),
  message text,
  reply text,
  changes jsonb,
  result jsonb
);
alter table public.ve_page_guide_log enable row level security;
create index if not exists ve_page_guide_log_listing_idx on public.ve_page_guide_log (listing_id, created_at desc);
