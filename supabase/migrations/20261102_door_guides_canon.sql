-- Door Guides (LOCKED by Sean 2026-11-02: "lock it"), with the panel's seven changes. Canon canon-ve-door-guides, playbook
-- ve-door-guides; write-up docs/proposals/door-guides.md. Also the build record for step 1 of the event host path.
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-door-guides',
  'Vegans Explore: door Guides, free to read with an email, your voice with the Passport; the Events Guide first (LOCKED by Sean 2026-11-02)',
  'decisions', 'product', 'active', 'sar', false, 50,
  array['vegans-explore','guides','passport','taster','podcast','events'], 1, 'logan', 'logan',
  'Locked with the panel''s seven changes (Sean: "lock it").',
  jsonb_build_object(
    'why', 'Sean: "turn these creator guide, the event guide... into free guides... all they got to do is give us their email address to unlock it... We don''t scare them away by saying it''s $11 and they never click it." The $11 unlocks their voice: "the question of the month... tell us the good news... if you''re struggling... that could be their part, what they unlock."',
    'which', 'Door Guides only: the Vegan Events Guide first, then the Creator, Nonprofit and Vegan Restaurant Guides once the events work is done. Topic Guides (Dairy, Nutrition, Airport, Stadium & Arena...) stay $11 or 1,100 points.',
    'levels', jsonb_build_array(
      'Open, no email: the Overview and the one free example (public, indexed).',
      'Free with an email: the rest of the Guide to read. The ask comes inside the Guide when they open a second section ("Get the rest of the Guide free: just your email"), one field, confirmed by the emailed link. The email makes them a Taster (ve_tasters) with a welcome series for that Guide.',
      'The $11 Passport: their voice. Record in the browser the question of the month, their story, good news, what they are struggling with, something for the community; approved clips become podcast segments (one per Guide, Host Notes for events), credited on their People profile, with points once approved; saving to their account on every device.'),
    'always_free', 'The event claim, the sponsorship application, and a claimed host recording their own Host Notes interview. Ticketing and messaging guests are not Passport features: they are the host path (canon-ve-event-host-path, 5% a ticket for everyone).',
    'struggling', 'What you are struggling with is private by default: it goes to the team and the chapter''s Community Manager to help, and airs only with a second yes.',
    'recording_rules', '18 and over; up to 90 seconds a clip; a prompt card and quiet-room tips before recording; the release ticked on every clip (our shows and site, name credited, taken down on request); the team listens before anything airs; never naming another business in a bad light.',
    'saving', 'Plans and checklists save in the browser for everyone; to their account on every device with the Passport.',
    'living', 'Each door Guide has a This month section: the question of the month, open opportunities (sponsorships, gigs, bounties) and the latest segment made from members'' clips.',
    'measure', '30 days on the Events Guide before rolling out: emails per Guide, Taster to Passport, clips sent and aired.',
    'rule_change', 'Every Guide is $11 or 1,100 points, except the door Guides: free to read with an email, your voice with the Passport.',
    'dissent', 'The producer would let everyone record one clip free; kept as Passport only, the free host interview covering early volume.',
    'checked', 'On 2026-11-02 nobody had paid for the Events, Creator, Nonprofit or Restaurant Guides (only Sean''s comp copies), so they change cleanly.',
    'build_order', 'After the event host path''s heads-up email (step 2): the Events Guide''s gate (open / email / Passport), the email ask inside the Guide, the question of the month and This month, Passport recording with the rules, the private struggling flow, the measures; then the other three.',
    'playbook', 've-door-guides')
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-door-guides');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-door-guides', 'vegans-explore', 'Logan',
  'Locked by Sean 2026-11-02 ("lock it"), V''s concept with the panel''s seven changes. Door Guides (Events first, then Creator, Nonprofit, Vegan Restaurant) are free to read with an email; the $11 Passport unlocks your voice. Open: Overview and the free example. Email: asked inside the Guide on the second section, one field, confirmed by link, makes a Taster with a Guide-specific welcome series. Passport: record the question of the month, your story, good news, what you are struggling with (private by default, team and Community Manager only, airs only with a second yes), clips become podcast segments credited on People profiles, points once approved, saving across devices. Always free: the event claim, the sponsorship application, a claimed host''s own Host Notes interview; ticketing and guest messages belong to the host path, not the Passport. Recording rules: 18+, 90 seconds, prompt card and quiet-room tips, the release on every clip, team listens first, never naming another business in a bad light. A This month section keeps each Guide living. Measure 30 days on the Events Guide (emails per Guide, Taster to Passport, clips sent and aired) before the other three. Rule change: every Guide is $11 or 1,100 points except door Guides. Dissent kept: one free clip for everyone was declined. Build after the host path heads-up. Canon canon-ve-door-guides.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-door-guides' and kind = 'decision');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-event-host-path', 'vegans-explore', 'Logan',
  'BUILD RECORD, step 1, the event claim (built and live 2026-11-02; Sean: "start step 1"). Server-rendered event pages first: api/event.js (head tags, schema.org Event and BreadcrumbList, the event as HTML in #ev-cal) reached through middleware.js (Edge Middleware on /events, x-middleware-rewrite, since the static events/index.html wins over a vercel.json rewrite); the sitemap lists approved events from the last 365 days on. The claim: "Are you running this event?" under the RSVP box opens #claim/<id> (drawClaim in public/ve-events.js): role (host, promoter, venue), name, email, org, phone, proof link or note; GA event_claim; a thank-you with the Events Guide. ve-events claim (public): ve_event_claims (RLS on, no policies), 3 a day per email, one open claim per event and email, member_id kept only when the signed-in account''s email is the claim''s, email to the chapter''s Community Managers else the team plus a confirmation, [TEST] names send nothing; Inbox source event_claim. Depot > Events > Claims (#claims/new|approved|declined, #claim/<id>): Approve or Decline (a note required). Approval runs ve_event_claim_link (organizer row now, or when an account with that email appears via trg_ve_event_claim_link) and emails them. Migration 20261102_event_claims.sql through ve-once-event-claims (now the 410 stub; its first run failed on ve_inbox_items'' trailing order by, fixed by stripping and re-adding it); ve-events from commit 4ec511b, sha256 matched. Proven live against the function (bad input refused, repeat recognized, admin actions refused to a visitor, decline without a note refused, approval linking the internal account, second approval refused, a no-account approval linking once the account appeared in a rolled-back transaction, 1366 and 390 px clean), test rows removed. Open: a host with no account cannot make one without the $11 (the email asks them to reply; Sean''s call whether hosts get a free organizer account); the $50 ad credit waits for step 5. Next: step 2, the heads-up email (template to Sean for approval before anything sends).',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-event-host-path' and kind = 'decision' and body like 'BUILD RECORD, step 1%');

insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
select 've-events-guide', 'vegans-explore', 'Logan',
  'UPDATE 2026-11-02: the Vegan Events Guide is the first door Guide (canon-ve-door-guides, locked): free to read with an email, recording with the Passport, except a claimed host''s own Host Notes interview, which is free. Its price changes from $11 or 1,100 points when that build ships, after the host path heads-up email. Not built yet.',
  'text', 'decision'
where not exists (select 1 from public.playbook_records where slug = 've-events-guide' and body like 'UPDATE 2026-11-02: the Vegan Events Guide is the first door Guide%');
