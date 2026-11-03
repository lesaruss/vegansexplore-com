-- Feedback button (Sean, 2026-11-03): "a feedback button... prominent across the site, the same way we have the share button... it loads the page
-- you are on as the default, you can still choose another... select different options... so we know immediately if anything is wrong."
create table if not exists public.ve_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('broken','wrong','confusing','missing','idea','praise','other')),
  page_url text not null,
  page_label text,
  message text not null,
  email text,
  name text,
  visitor text,
  member_signed_in boolean not null default false,
  user_agent text,
  viewport text,
  status text not null default 'new' check (status in ('new','working','fixed','set_aside','spam')),
  note text
);
create index if not exists ve_feedback_status_created on public.ve_feedback (status, created_at desc);
alter table public.ve_feedback enable row level security;
