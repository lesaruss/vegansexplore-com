-- ve-community-directory: a logo the hunter found and saved to its listing (ve-logo-hunt apply). Applied 2026-11-07.
alter table ve_logo_hunts add column if not exists applied_at timestamptz, add column if not exists applied_url text;
