-- Your Guide (Sean, 2026-10-04): setting up a Guide is a dashboard action item. guide_setup_at marks
-- that the member finished it (Mission Survey done or not needed, and they have seen how to use their
-- Guide). guide_slug already holds which Guide; Liz when they have not chosen (choosing is Passport).
-- Applied to production 2026-10-04.
alter table public.members add column if not exists guide_setup_at timestamptz;
comment on column public.members.guide_setup_at is 'When the member finished setting up their Guide (/guide). Written by the ve-guide edge function.';
