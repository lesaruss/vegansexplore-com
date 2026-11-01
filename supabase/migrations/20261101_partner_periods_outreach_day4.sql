-- The Partner plan charges at sign-up from 2026-11-01 (canon canon-branddesk-production-wing): business outreach's Day 4 email
-- no longer says "No charge today" or "cancel before January and you owe nothing". No price in the email (the business outreach rule).
-- Nothing had been sent and every city was off when this changed.
update public.ve_outreach_templates
set body = replace(replace(body,
  'Businesses that join before January 1 get the rest of 2026 on us. No charge today, your page is yours to run, and',
  'Businesses that join now get every day until January 1 on us: your page is yours to run from today, and'),
  ' If it isn''t right for you, cancel before January and you owe nothing.', '')
where program = 'business-outreach' and step = 2 and body like '%No charge today%';
