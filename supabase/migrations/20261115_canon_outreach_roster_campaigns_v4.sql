-- Wrap 2026-11-15 (canon-wrap-up-standard v3): two outreach rules from this session into canon-ve-outreach-roster-campaigns v4.
-- Sean, 2026-11-15, on Next Level (20 locations, one owner): "when there's one person who's running multiple accounts, we just send them one
-- communication." And the fix found the same day: campaigns take turns (20261115_campaign_due_round_robin.sql). Plus the Opted out tab
-- (Sean: "I would like to know people who don't want to hear from us"). Safe to run twice.
update public.knowledge_records
   set body = body || jsonb_build_object('v4_2026_11_15', jsonb_build_object(
         'one_email_per_address', 'Inside one campaign an address gets each email once, however many listings or entries share it (ve_outreach_campaign_due skips a member whose address already got that step). Sean: "when there''s one person who''s running multiple accounts, we just send them one communication."',
         'campaigns_take_turns', 'The due list is round robin across campaigns, so a campaign whose daily pace is spent cannot starve the others (on 2026-11-13 Businesses took every slot and Everyone Else sent nothing).',
         'send_runs', 've-outreach-send at :00 and ve-outreach-send-b at :05 past each ten minutes, weekdays 9 to 5 Eastern; every rule lives in the sender, so the second run adds room, never volume.',
         'opted_out', 'HQ Outreach > Roster > Opted out lists everyone who marked an email as spam or unsubscribed, with the email that did it (view ve_opted_out_people).')),
       version = 4, updated_by = 'logan', updated_at = now(),
       change_summary = 'v4: one email per address per campaign (Sean, Next Level); campaigns take turns; second send run; Opted out tab.'
 where slug = 'canon-ve-outreach-roster-campaigns' and status = 'active' and version = 3;
