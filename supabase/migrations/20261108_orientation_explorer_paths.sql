-- ve-outreach-buckets: orientation by path (Sean, 2026-11-08: "We need an orientation for people who completed the Explorer program. And
-- then if they happen to complete get a badge and something else, then it can unsubscribe them from that and then subscribe them into
-- that automation, since it's more tailored"). Replaces the old one-size Orientation draft (four notes with restaurant door lines).
--
-- Six BrandDesk people campaigns, from the Vegans Explore team, three notes each (the engine's limit), all DRAFT: nothing sends until
-- Sean reads, locks and approves each one in BrandDesk > Outreach > Campaigns, which also sets its start day.
--   orientation-explorer     anyone who finishes the Explorer survey
--   orientation-restaurant   finishes the Vegan Restaurant Guide intake (Registered restaurant)
--   orientation-events       finishes the event survey (Registered event host)
--   orientation-creator      finishes the creator survey (Registered creator)
--   orientation-nonprofit    finishes the Nonprofit Guide intake (Registered nonprofit)
--   orientation-business     finishes the Pre-Vegan Business Guide survey
--
-- ve_orientation_sync() (cron ve-orientation-sync, every 15 minutes) does the moving:
--   * Explorer finished, no path badge yet, never in the Explorer orientation: joins it, first note the next day at 10 AM Eastern.
--   * A path badge earned while that path's orientation is live: they come off the Explorer orientation (stopped, reason kept) and join
--     the path's, first note the next day. One path orientation at a time: a second badge waits until the first finishes.
--   * A path orientation that is not approved yet: they stay on the Explorer one (so nobody is left with nothing).
--   * Only completions on or after a campaign's start day count, so approving one never mails everyone who joined before it.
--   * Members only (member_class member, active, with an email); never twice in the same orientation.
-- Safe to run twice.

insert into ve_outreach_campaigns (slug, name, audience, status, email_count, daily_pace, sender_brand, link_path, footer_reason, note)
values
 ('orientation-explorer', 'Orientation: Explorer', 'people', 'draft', 3, 200, 'vegans-explore', '/dashboard?from=orientation', 'you joined Vegans Explore by finishing the Explorer survey', 'Always on. Anyone who finishes the Explorer survey; they move to a path orientation when they earn a path badge.'),
 ('orientation-restaurant', 'Orientation: Restaurant path', 'people', 'draft', 3, 200, 'vegans-explore', '/guides/vegan-restaurant-guide?from=orientation', 'you finished the Vegan Restaurant Guide survey', 'Always on. Starts when someone earns the Registered restaurant badge.'),
 ('orientation-events', 'Orientation: Event host path', 'people', 'draft', 3, 200, 'vegans-explore', '/guides/vegan-events-guide?from=orientation', 'you finished the Vegan Events Guide survey', 'Always on. Starts when someone earns the Registered event host badge. Replaces the Events Guide Day 3 and Day 7 notes once approved.'),
 ('orientation-creator', 'Orientation: Creator path', 'people', 'draft', 3, 200, 'vegans-explore', '/guides/creator-guide?from=orientation', 'you finished the creator survey', 'Always on. Starts when someone earns the Registered creator badge.'),
 ('orientation-nonprofit', 'Orientation: Nonprofit path', 'people', 'draft', 3, 200, 'vegans-explore', '/guides/nonprofit-guide?from=orientation', 'you finished the Nonprofit Guide survey', 'Always on. Starts when someone earns the Registered nonprofit badge.'),
 ('orientation-business', 'Orientation: Business path', 'people', 'draft', 3, 200, 'vegans-explore', '/guides/pre-vegan-business-guide?from=orientation', 'you finished the Pre-Vegan Business Guide survey', 'Always on. Starts when someone finishes the Pre-Vegan Business Guide survey.')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, day_offset, subject, body) values
-- Explorer
('orientation-explorer', 1, 1, 'Where to start on Vegans Explore', E'Hi {first_name},\n\nYou finished the Explorer survey, so you are in. Here are three things worth doing this week.\n\nSearch for anything at the top of any page: a dish, a place, a person. Vote for the places you love, once a day each, because votes are how a place gets found by everyone else. Save the ones you want to try, and they wait for you in My Saves.\n\nYour dashboard has your points, your level and everything you saved: {link}\n\nThe Vegans Explore team'),
('orientation-explorer', 2, 8, 'A path made for what you do', E'Hi {first_name},\n\nMost people on Vegans Explore do more than eat out. If one of these is you, there is a path made for it:\n\nYou run a Vegan restaurant.\nYou host events.\nYou make content.\nYou run a nonprofit, rescue or sanctuary.\nYou run a business adding plant-based options.\n\nEach path has its own Guide, free with a short survey, and a badge on your profile when you finish it. Once you do, these notes stop and we send you ones made for that path instead.\n\nSee the Guides: https://vegansexplore.com/guides\n\nThe Vegans Explore team'),
('orientation-explorer', 3, 15, 'Your city, and who should be here', E'Hi {first_name},\n\nEvery chapter has its own page: the places, the events coming up, the Daily Pulse and the boards for jobs, fosters and rescues. Pick yours from Communities: https://vegansexplore.com/communities\n\nVegans Explore grows city by city, one person at a time. If you know someone who would use it, tap Share on any page while you are signed in. Anyone who joins from your link counts as yours, and you earn points for it.\n\nYour dashboard: {link}\n\nThe Vegans Explore team'),
-- Restaurant
('orientation-restaurant', 1, 1, 'Your restaurant on Vegans Explore', E'Hi {first_name},\n\nThank you for finishing the restaurant survey. The Vegan Restaurant Guide is yours now, and the Registered restaurant badge is on your profile.\n\nStart with your page in the Directory. Claiming it is free for members, and once it is yours the hours, photos, menu link and story are yours to change. Your business dashboard shows who viewed your page and what they did next.\n\nOpen your Guide: {link}\n\nThe Vegans Explore team'),
('orientation-restaurant', 2, 8, 'The fixes that matter most', E'Hi {first_name},\n\nYour Guide walks through the things Vegan restaurants run into most: hours that are out of date online, a menu people cannot find, photos that do not show the food. Each fix says what to do, one step at a time.\n\nIf you would rather we did it, every fix has a button for that.\n\nThe Guide also has Sourcing: suppliers for what you buy, and recipes for what you could make yourself.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
('orientation-restaurant', 3, 15, 'Getting found by more people', E'Hi {first_name},\n\nThe Get featured part of your Guide shows how places rise in the Directory: member votes, a complete page and a claimed listing. The Promotions part lists what we run with restaurants, each one marked Live or Coming so you know what is ready today.\n\nIf you have a question, reply to this email and our team will answer.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
-- Events
('orientation-events', 1, 1, 'Your events on Vegans Explore', E'Hi {first_name},\n\nThank you for finishing the event survey. The Vegan Events Guide is yours now, and the Registered event host badge is on your profile.\n\nStart with The plan: a 12-week checklist you can tick as you go. Then decide your rain plan before the day, not on it. The Guide covers rain, heat, no-shows and a vendor who does not show.\n\nOpen your Guide: {link}\n\nThe Vegans Explore team'),
('orientation-events', 2, 8, 'Put your event on the calendar', E'Hi {first_name},\n\nEvery approved event shows on our calendar and in its chapter. Add yours with a flyer, a link or by typing it in: https://vegansexplore.com/events\n\nIf your event is already there, open it and tap Are you running this event? Once our team confirms it, you can see who is going and message the guests who said yes.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
('orientation-events', 3, 15, 'Working with us on an event', E'Hi {first_name},\n\nWe sponsor Vegan events with marketing, not cash: a calendar feature, a Daily Pulse mention and a post, in return for a booth and a mention. The Work with us part of your Guide has the application. We review applications against each other each month, so apply early.\n\nYou can also tell us your story as a host, by voice, in the Guide. Approved stories may air on our podcast.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
-- Creator
('orientation-creator', 1, 1, 'Your path as a creator', E'Hi {first_name},\n\nThank you for finishing the creator survey. The Creator Guide is yours now, and the Registered creator badge is on your profile.\n\nStart with the 10 tips. Each one has a short action list for the week, and an episode from our shows behind it.\n\nOpen your Guide: {link}\n\nThe Vegans Explore team'),
('orientation-creator', 2, 8, 'Your profile in the Directory', E'Hi {first_name},\n\nThe People section of our Directory lists creators, with their work, their episodes on our shows and their links. If you already have a page there, open it and tap Is this you? to claim it. If not, the Creator Guide shows how to be added.\n\nPeople can vote for creators the same way they vote for places.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
('orientation-creator', 3, 15, 'Gigs and paid work', E'Hi {first_name},\n\nGigs show on the Gig Board as they open: points jobs, perk jobs and, as we grow, paid campaigns with brands. Paid campaigns are coming; the Creator Guide marks each kind of work Live or Coming so you know what is open today.\n\nIf there is something you want to make with us, reply to this email and tell us.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
-- Nonprofit
('orientation-nonprofit', 1, 1, 'Your organization on Vegans Explore', E'Hi {first_name},\n\nThank you for finishing the nonprofit survey. The Nonprofit Guide is yours now, and the Registered nonprofit badge is on your profile.\n\nStart with the 10 tips. Each one has a checklist for the week and a conversation from our shows with people who run organizations like yours.\n\nOpen your Guide: {link}\n\nThe Vegans Explore team'),
('orientation-nonprofit', 2, 8, 'Getting your organization found', E'Hi {first_name},\n\nNonprofits, rescues and sanctuaries have their own section in our Directory. Claim your page there, free for members, and keep your story, links and donation link current. Put your events on our calendar too: https://vegansexplore.com/events\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
('orientation-nonprofit', 3, 15, 'When people want to give', E'Hi {first_name},\n\nOur Holiday Guide has a Give back section that sends people to the organizations in our Directory, straight to each one''s own donation page. We never handle the money. A page with a current donation link and a clear story is the one people choose.\n\nIf you have a question, reply to this email and our team will answer.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
-- Business
('orientation-business', 1, 1, 'Adding plant-based options, step by step', E'Hi {first_name},\n\nThank you for finishing the business survey. The Pre-Vegan Business Guide is yours now.\n\nStart with its five steps. Tick each one as you go, and the Guide keeps your place.\n\nOpen your Guide: {link}\n\nThe Vegans Explore team'),
('orientation-business', 2, 8, 'Buy it or make it', E'Hi {first_name},\n\nThe Sourcing part of your Guide lists suppliers for plant-based ingredients and products, each labeled honestly. Buy or make pairs each item with a recipe, so you can decide which is right for you.\n\nYour Guide: {link}\n\nThe Vegans Explore team'),
('orientation-business', 3, 15, 'Getting found for your plant-based options', E'Hi {first_name},\n\nOnce your business is in our Directory and claimed, your page can show the Pre-Vegan badge, so people looking for plant-based options can find you. Claiming is free for members.\n\nIf you have a question, reply to this email and our team will answer.\n\nYour Guide: {link}\n\nThe Vegans Explore team')
on conflict (campaign_slug, step) do nothing;

create or replace function public.ve_orientation_sync()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r record; joined int := 0; moved int := 0; held int := 0;
  first_send timestamptz;
begin
  -- Path badges first, so someone who finished both on one day goes straight to their path.
  for r in
    with p(survey, slug) as (values ('vegan-restaurant-guide','orientation-restaurant'), ('vegan-events-guide','orientation-events'),
      ('creator-guide','orientation-creator'), ('nonprofit-guide','orientation-nonprofit'), ('pre-vegan-business-guide','orientation-business'))
    select c.member_id, c.completed_at, p.slug, lower(m.email) as email, m.name
    from ve_survey_completions c join p on p.survey = c.survey_slug
    join ve_outreach_campaigns cp on cp.slug = p.slug and cp.status = 'active' and cp.approved_at is not null and cp.start_on is not null
    join members m on m.id = c.member_id and m.member_class = 'member' and m.membership_status = 'active' and coalesce(m.email,'') like '%@%'
    where c.completed_at >= greatest(cp.start_on::timestamp at time zone 'America/New_York', cp.approved_at)
      and not exists (select 1 from ve_outreach_campaign_members x where x.campaign_slug = p.slug and x.person_key = lower(m.email))
    order by c.completed_at
  loop
    if exists (select 1 from ve_outreach_campaign_members x where x.person_key = r.email and x.removed_at is null
               and x.campaign_slug like 'orientation-%' and x.campaign_slug <> 'orientation-explorer' and x.send_status in ('waiting','in_sequence')) then
      held := held + 1; continue;  -- one path orientation at a time
    end if;
    update ve_outreach_campaign_members set removed_at = now(), send_status = 'stopped', stop_reason = 'moved to ' || r.slug
      where campaign_slug = 'orientation-explorer' and person_key = r.email and removed_at is null and send_status in ('waiting','in_sequence');
    if found then moved := moved + 1; end if;
    first_send := (((now() at time zone 'America/New_York')::date + 1) + time '10:00') at time zone 'America/New_York';
    insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
      values (r.slug, r.email, r.name, r.member_id, 0, 'in_sequence', first_send);
    joined := joined + 1;
  end loop;

  -- Explorer, for anyone with no path badge.
  for r in
    select c.member_id, lower(m.email) as email, m.name
    from ve_survey_completions c
    join ve_outreach_campaigns cp on cp.slug = 'orientation-explorer' and cp.status = 'active' and cp.approved_at is not null and cp.start_on is not null
    join members m on m.id = c.member_id and m.member_class = 'member' and m.membership_status = 'active' and coalesce(m.email,'') like '%@%'
    where c.survey_slug = 'explorer' and c.completed_at >= greatest(cp.start_on::timestamp at time zone 'America/New_York', cp.approved_at)
      and not exists (select 1 from ve_survey_completions b where b.member_id = c.member_id
        and b.survey_slug in ('vegan-restaurant-guide','vegan-events-guide','creator-guide','nonprofit-guide','pre-vegan-business-guide'))
      and not exists (select 1 from ve_outreach_campaign_members x where x.campaign_slug = 'orientation-explorer' and x.person_key = lower(m.email))
  loop
    first_send := (((now() at time zone 'America/New_York')::date + 1) + time '10:00') at time zone 'America/New_York';
    insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
      values ('orientation-explorer', r.email, r.name, r.member_id, 0, 'in_sequence', first_send);
    joined := joined + 1;
  end loop;
  return jsonb_build_object('joined', joined, 'moved_off_explorer', moved, 'waiting_for_path', held);
end $$;
revoke all on function public.ve_orientation_sync() from public, anon, authenticated;

select cron.unschedule('ve-orientation-sync') where exists (select 1 from cron.job where jobname = 've-orientation-sync');
select cron.schedule('ve-orientation-sync', '*/15 * * * *', $$select public.ve_orientation_sync()$$);

-- Part 2 (same day). A start day so BrandDesk shows and can approve them; people count only from the later of the start day and the
-- approval, so a draft with a start day enrolls nobody and approving never mails anyone who joined before. A sample person in each,
-- stopped, so Preview and Send a test work before anyone has joined; a stopped row is never sent (ve_outreach_campaign_due).
update ve_outreach_campaigns set start_on = date '2026-11-09' where slug like 'orientation-%' and start_on is null;
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason)
select slug, 'contact@lesaruss.com', 'Sample Member', 0, 'stopped', 'Sample for previews and tests; never sends'
from ve_outreach_campaigns c where c.slug like 'orientation-%'
  and not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = c.slug and m.person_key = 'contact@lesaruss.com');
