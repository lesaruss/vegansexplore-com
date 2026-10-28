-- What Sean knows about each person (Sean, 2026-10-28: "I don't want to focus on the structuring of the sentence. I can let you know a
-- little bit about that person, maybe something positive that only I would know... some context of how we know each other"). Kept on
-- the invitation; ve-invites draft_note writes the email's personal opening (reason) from it and the person's HQ record. Safe to run twice.
alter table public.universe_invites add column if not exists context text;
alter table public.universe_invites drop constraint if exists universe_invites_context_len;
alter table public.universe_invites add constraint universe_invites_context_len check (context is null or char_length(context) <= 2000);
