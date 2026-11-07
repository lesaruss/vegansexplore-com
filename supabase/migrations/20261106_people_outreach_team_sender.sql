-- ve-outreach: media pitch from the Vegans Explore team (Sean, 2026-11-06).
-- A message whose template_key is 'team' sends as email brand vegans-explore (VEGANS EXPLORE), not lesaruss (Sean A. Russell);
-- see brandOf in supabase/functions/ve-people-outreach. The row exists only so the foreign key accepts the key; it holds no words,
-- and the media drafts are personal, so approving this template approves none of them. Applied live 2026-11-06.
insert into public.ve_people_outreach_templates (key, bucket, label, subject, body)
values ('team', 'community', 'From the Vegans Explore team (sent as Vegans Explore, not Sean)', '', '')
on conflict (key) do nothing;
