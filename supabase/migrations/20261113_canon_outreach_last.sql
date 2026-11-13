-- 2026-11-13: canon-sean-one-next-step gains "outreach is the last step" (Sean: "Let's finish it before we start talking about outreach.
-- Outreach should be the last thing we do."). Postmortem: REPEAT-PARTIAL of "finish before opening"; Logan loaded photographer outreach
-- before Sean had seen or locked the job it links to. Safe to run twice.
update public.knowledge_records
   set body = body || jsonb_build_object('outreach_last', 'Outreach is the last step (Sean, 2026-11-13): before any list, message, DM or campaign is built, the thing it sends people to (the page, the job, the offer and its terms) is shown to Sean as they will see it and locked by him. A yes to a draft message is not a lock on what it links to.'),
       updated_at = now(), updated_by = 'Logan'
 where slug = 'canon-sean-one-next-step' and not (body ? 'outreach_last');
