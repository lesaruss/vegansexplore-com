-- ve-community-directory: logo hunt groups claimed three at a time, and Claude's cost per listing. Applied 2026-11-07.
alter table ve_logo_hunts drop constraint if exists ve_logo_hunts_status_check;
alter table ve_logo_hunts add constraint ve_logo_hunts_status_check check (status in ('queued','claimed','working','done','failed'));
alter table ve_logo_hunts add column if not exists claude_usd numeric;
