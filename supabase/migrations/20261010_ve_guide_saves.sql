-- My list (Sean, 2026-10-10: "a tab or a drop down that says my list... they want to save milk, they can click save and then
-- it'll show up in their swap section on the my list"). A Guide owner saves swaps, recipes, brands and cookbooks (Directory
-- listings) and episodes; My list shows them by kind with the recipes they shared. Read and written only through ve-cookbook
-- (saves / save), which checks the member owns the Guide; RLS on with no policies keeps it closed to the public API.
create table if not exists public.ve_guide_saves (
  guide_slug text not null,
  kind text not null check (kind in ('swap', 'recipe', 'listing', 'episode')),
  item_key text not null,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guide_slug, kind, item_key, member_id)
);
create index if not exists ve_guide_saves_member on public.ve_guide_saves (member_id, guide_slug, created_at desc);
alter table public.ve_guide_saves enable row level security;
