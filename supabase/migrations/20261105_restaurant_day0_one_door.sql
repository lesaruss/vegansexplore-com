-- ve-outreach-buckets / ve-restaurant-guide: Day 0 now says there is one door (the survey), as the Guide does (Sean, 2026-11-04, canon-ve-door-guides v5).
-- It had said "There are two ways in: $11, one time, or a short survey". Still a DRAFT; nothing sends until Sean approves a send day and a city is on.
-- Applied live 2026-11-05 (one row changed; checked: no $11 left in the body).
update ve_outreach_templates set updated_at=now(),
  body=replace(body, 'There are two ways in: $11, one time, or a short survey that tells us how to serve you. Either one helps us grow faster.', 'Joining is free. A short survey tells us how to serve you, and when you finish you are a member.')
where program='business-outreach' and step=1 and status='draft';
