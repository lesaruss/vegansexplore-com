-- ve-idea-intake: Sean's idea inbox (Sean, 2026-11-06: "an intake somewhere that I can go to drop ideas... voice dictation, upload
-- assets... links... give you context... you confirm what I'm asking, and then I approve, and then you start working on it... provide me
-- with the link to see what you've done"). Depot > Ideas (/admin/depot/ideas), edge function ve-ideas, super admins only.
-- Steps: new (dropped) -> read (Logan wrote back what he thinks is asked) -> approved -> building -> done, or set_aside.
-- Step 3 (approve starts a build session) is not wired yet; approved waits for Logan in a session.

create table if not exists public.ve_ideas (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.members(id),
  body text not null default '',
  links text[] not null default '{}',
  files jsonb not null default '[]'::jsonb,          -- [{path, name, type, size}] in the private bucket idea-files
  page_url text,                                     -- the page Sean was on, when dropped from a page
  status text not null default 'new' check (status in ('new','read','approved','building','done','set_aside')),
  read jsonb,                                        -- {ask, playbook, playbook_is_new, plan[], questions[], at}
  thread jsonb not null default '[]'::jsonb,         -- [{role: sean|logan, text, at}]
  playbook_slug text,
  session_url text,
  result_url text,
  note text,
  approved_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_ideas_status_idx on public.ve_ideas (status, created_at desc);
alter table public.ve_ideas enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('idea-files', 'idea-files', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;
