-- ve-nominate-someone step 2: the invitation and Kai's interview (Sean, 2026-11-12: "yes to both, approved, build step 2").
-- Approving a nomination makes its invite (a private token for the interview link) and Kai's personal welcome (the opening line with the
-- nominee's and nominator's names, generated in Kai's voice and checked word for word), and puts the nominee in the Nominee invitations
-- campaign. The nominee's answers are kept one row per question. Finishing the interview and setting up an account makes them a member
-- (the interview counts as their Explorer survey). Safe to run twice. RLS on, no policies: everything goes through ve-nominations.

alter table ve_nominations add column if not exists invite_token text unique;
alter table ve_nominations add column if not exists invited_at timestamptz;
alter table ve_nominations add column if not exists welcome_path text;          -- vegan-media path of Kai's personal opening (mp3)
alter table ve_nominations add column if not exists welcome_text text;          -- the words it says (the approved template, filled in)
alter table ve_nominations add column if not exists welcome_checked boolean;    -- stt matched the words
alter table ve_nominations add column if not exists interview_opened_at timestamptz;
alter table ve_nominations add column if not exists interview_sent_at timestamptz;
alter table ve_nominations add column if not exists interview_release_at timestamptz;
alter table ve_nominations add column if not exists member_id uuid;
alter table ve_nominations add column if not exists joined_at timestamptz;

create table if not exists ve_nomination_answers (
  nomination_id uuid not null references ve_nominations(id) on delete cascade,
  q text not null check (q ~ '^q[1-8](s[1-3])?$'),   -- q1..q8; q6s1..q6s3 are the favorite spots
  written text,
  audio_path text,                                   -- community-comments bucket, nominations/answers/<nomination>/<q>-<uuid>.<ext>
  audio_seconds integer,
  extra jsonb not null default '{}'::jsonb,          -- q2: {chapter, years}; q6sN: {name, slug}
  updated_at timestamptz not null default now(),
  primary key (nomination_id, q)
);
alter table ve_nomination_answers enable row level security;
