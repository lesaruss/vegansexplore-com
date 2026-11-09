-- signal-context-efficiency: always-load canon trimmed (Sean approved 2026-11-09). Applied through the connector.
-- 102 always_load records (405,313 chars) -> 43 (139,585). The other 59 keep status active, always_load false,
-- and an ondemand:<area> tag. canon-manifest expected_slugs rewritten to the 43; canon-core gained the on-demand rule.
create table if not exists zz_canon_load_snapshot_20261109 as
select slug, always_load, tags, version, body, now() as taken_at from knowledge_records
where (always_load and status='active') or slug in ('canon-manifest','canon-core');
alter table zz_canon_load_snapshot_20261109 enable row level security;
-- The flag flip, manifest and canon-core edits are data changes recorded in playbook_records
-- (slug signal-context-efficiency), with the rollback statement.
-- ROLLBACK:
-- update knowledge_records r set always_load=s.always_load, tags=s.tags from zz_canon_load_snapshot_20261109 s
--   where s.slug=r.slug and s.always_load;
-- update knowledge_records r set body=s.body from zz_canon_load_snapshot_20261109 s
--   where s.slug=r.slug and r.slug in ('canon-manifest','canon-core');
