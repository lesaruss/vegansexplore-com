-- branddesk-production-wing: retire the blueprint_ideas view (2026-11-08, Logan).
-- N (20261108_one_idea_store.sql) made ve_ideas the one idea store and left blueprint_ideas as a view over it for anything still on
-- the old name. Checked before dropping it: no code on main in vegansexplore-com or lesaruss-hq reads it (comments and old migrations
-- only); the deployed ve-ideas (v10) reads ve_ideas; no database function, view, cron job or foreign key refers to it; the API log has
-- no request to /rest/v1/blueprint_ideas after the switch (the last was 2026-11-07 13:16 UTC, before it); and the unmerged HQ branch
-- claude/keen-hamilton-7bia8n (75b8223) changes only IdeasView.tsx, so merging it adds no reader back.
-- Kept: ve_ideas, blueprint_idea_events (the history, now pointing at ve_ideas) and blueprint_ideas_retired_20261108 (the old rows).
drop view if exists public.blueprint_ideas;
