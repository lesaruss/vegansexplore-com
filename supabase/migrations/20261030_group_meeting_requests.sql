-- Request a meeting (Sean, 2026-10-30: "they can request a meeting... it would be my goal to get community managers who can be
-- that person they speak to. And if I can't get a community manager, then I'll speak to them... don't put my name in there. Make it
-- general"). The Group Partner Guide's Request a meeting (/groups/welcome#/meet) sends one row through ve-group 'meet', kind
-- 'meeting', in the same table as the applications; it is emailed to the chapter's Community Managers, else the team inbox. The
-- person only ever hears "our team". Depot > Group Partners > Applications shows the two kinds apart.

alter table ve_group_applications add column if not exists kind text not null default 'application';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 've_group_applications_kind_check') then
    alter table ve_group_applications add constraint ve_group_applications_kind_check check (kind in ('application', 'meeting'));
  end if;
end $$;
create index if not exists ve_group_applications_kind on ve_group_applications (kind, status, created_at desc);
