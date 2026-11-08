-- branddesk-production-wing N: one idea store (Logan, 2026-11-08; Sean: "one list and no syncing").
-- ve_ideas (Depot > Ideas) is the one store. BrandDesk > Blueprint > Ideas (HQ) reads and writes it too.
--  * ve_ideas gains the Blueprint's columns (brand, title, source, the sorting fields, read_error, read_at).
--  * One status list for both screens: new, approved, building, done (the Depot's build path) and sent, own_playbook,
--    parked, declined (the Blueprint's sorting). 'read' is gone: an idea Logan has read is still new, its read is on the row.
--    'set_aside' became parked.
--  * Every blueprint_ideas row is copied into ve_ideas with the same id, so blueprint_idea_events (the history) keeps
--    pointing at it; its foreign key now points at ve_ideas.
--  * blueprint_ideas is renamed blueprint_ideas_retired_20261108 and kept (nothing dropped). In its place a view of the
--    same name over ve_ideas (detail = body) keeps HQ main and older code working until every caller reads ve_ideas.
begin;

alter table public.ve_ideas
  add column if not exists brand_slug text not null default 'vegans-explore',
  add column if not exists title text,
  add column if not exists source text not null default 'depot',
  add column if not exists source_ref text,
  add column if not exists submitted_by text,
  add column if not exists suggested_playbook text,
  add column if not exists suggest_reason text,
  add column if not exists suggested_at timestamptz,
  add column if not exists suggested_by_read boolean not null default false,
  add column if not exists target_playbook text,
  add column if not exists placed_on_page boolean,
  add column if not exists sorted_by text,
  add column if not exists sorted_at timestamptz,
  add column if not exists reason text,
  add column if not exists revisit_on date,
  add column if not exists read_error text,
  add column if not exists read_at timestamptz;

alter table public.ve_ideas drop constraint if exists ve_ideas_status_check;
update public.ve_ideas set status = 'new' where status = 'read';
update public.ve_ideas set status = 'parked', reason = coalesce(reason, note), sorted_at = coalesce(sorted_at, updated_at) where status = 'set_aside';
alter table public.ve_ideas add constraint ve_ideas_status_check
  check (status in ('new','approved','building','done','sent','own_playbook','parked','declined'));
alter table public.ve_ideas drop constraint if exists ve_ideas_source_check;
alter table public.ve_ideas add constraint ve_ideas_source_check
  check (source in ('depot','blueprint','feedback','playbook','fieldy'));

-- A title for every idea: an idea dropped with no title takes its first sentence.
create or replace function public.ve_ideas_title() returns trigger language plpgsql as $$
declare t text;
begin
  if new.title is null or btrim(new.title) = '' then
    t := btrim(substring(coalesce(new.body, '') from '^[^.!?\n]*[.!?]?'));
    if t = '' then t := 'Untitled idea'; end if;
    new.title := left(t, 120);
  end if;
  new.title := left(btrim(new.title), 200);
  return new;
end $$;
drop trigger if exists trg_ve_ideas_title on public.ve_ideas;
create trigger trg_ve_ideas_title before insert or update of title, body on public.ve_ideas
  for each row execute function public.ve_ideas_title();
update public.ve_ideas set title = null where title is null;

insert into public.ve_ideas (id, brand_slug, title, body, source, source_ref, submitted_by, status, suggested_playbook, suggest_reason,
  suggested_at, suggested_by_read, target_playbook, placed_on_page, sorted_by, sorted_at, reason, revisit_on, created_at, updated_at,
  files, links, thread, read, read_error, read_at, playbook_slug)
select id, brand_slug, title, coalesce(detail, ''), source, source_ref, submitted_by, status, suggested_playbook, suggest_reason,
  suggested_at, coalesce(suggested_by_read, false), target_playbook, placed_on_page, sorted_by, sorted_at, reason, revisit_on, created_at, updated_at,
  coalesce(files, '[]'::jsonb), coalesce(links, '{}'), coalesce(thread, '[]'::jsonb), read, read_error, read_at,
  coalesce(target_playbook, nullif(read->>'playbook', ''))
from public.blueprint_ideas
on conflict (id) do nothing;

create index if not exists ve_ideas_brand_idx on public.ve_ideas (brand_slug, status, created_at desc);

alter table public.blueprint_idea_events drop constraint if exists blueprint_idea_events_idea_id_fkey;
alter table public.blueprint_idea_events add constraint blueprint_idea_events_idea_id_fkey foreign key (idea_id) references public.ve_ideas(id);
alter table public.blueprint_idea_events drop constraint if exists blueprint_idea_events_action_check;
alter table public.blueprint_idea_events add constraint blueprint_idea_events_action_check check (action in
  ('added','suggested','sent','own_playbook','parked','declined','reopened','edited','read','read_failed','corrected',
   'approved','building','done','sent_to_pulse','sent_to_podcast'));

alter table public.blueprint_ideas rename to blueprint_ideas_retired_20261108;

create view public.blueprint_ideas with (security_invoker = true) as
  select id, brand_slug, title, body as detail, source, source_ref, submitted_by, status, suggested_playbook, suggest_reason,
    suggested_at, target_playbook, placed_on_page, sorted_by, sorted_at, reason, revisit_on, created_at, updated_at,
    files, links, thread, read, read_error, read_at, suggested_by_read
  from public.ve_ideas;
alter view public.blueprint_ideas alter column source set default 'blueprint';
revoke all on public.blueprint_ideas from anon, authenticated;
revoke all on public.blueprint_ideas_retired_20261108 from anon, authenticated;

commit;
