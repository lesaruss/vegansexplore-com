-- Community Manager: South Florida Community Nights (Sean locked the pitch 2026-11-19: "Lock it"; "Pay him monthly."; plan
-- docs/plans/2026-11-19-ron-groups-assignment.md). $150 once a month (period_days 30 = the monthly pay calendar in ve-positions), a one-month
-- trial, one holder. The agreement is KJ's plain-words version 1 with section 2, 3, 4 and 6 swapped for this role.
alter table ve_positions drop constraint if exists ve_positions_period_days_check;
alter table ve_positions add constraint ve_positions_period_days_check check (period_days = any (array[7, 14, 30]));

insert into ve_positions (mode, slug, title, status, summary, posting, pay_cents, period_days, trial_days, max_holders, application, agreement_version, agreement_text, agreement_sha256)
select 'assign', 'community-nights-south-florida', 'Community Manager', 'open',
 'Build the South Florida Community Nights: scout venues, bring people to the nights, be the person people ask, and keep our South Florida groups going.',
 $p$Community Manager, Vegans Explore: South Florida

Vegans Explore opens on January 1, and our South Florida Community Nights start in February. Help us build them.

Community Nights, $150 a month (December through the February launch)
- Scout venues for the nights and bring us the options.
- Reach out to the community and bring people to the nights.
- Be the person people ask: when we send the word out, questions come to you.

Our groups (part of the same $150)
- Post and share our posts in our Facebook groups and the South Florida Vegans group.
- Send the Meetup messages we write, from each group.
- Keep an eye on what's happening in South Florida and tell us.

Running a night: $150 for each night you run, on top of the monthly.

The goal: each night should bring in at least four times what it costs to put on, counting the months leading up to it, the night itself and its marketing. We'll track it together.

Your own hours. Paid through Stripe once a month. The first month is a trial. Your questions go to Kai on your dashboard.$p$,
 15000, 30, 30, 1, '[]'::jsonb, 'v1', t, encode(sha256(convert_to(t,'UTF8')),'hex')
from (select $a$Community Manager agreement, version 1

Between Vegans Explore (LESARUSS Inc.) and you.

1. You work for yourself.
You are an independent contractor, not an employee. You set your own hours, use your own phone and computer, can work for others, and handle your own taxes.

2. What you do.
- Scout venues for the South Florida Community Nights and bring us the options.
- Reach out to the community and bring people to the nights.
- Answer people's questions about the nights.
- Post and share our posts in our Facebook groups and the South Florida Vegans group, and send the Meetup messages we write, from each group.
- Tell us what's happening in South Florida.
- Read the weekly brief and do its asks.
Your questions go to Kai on your dashboard. Sean sees every conversation.

3. Ground rules.
- Bring us the venue options. Nothing is booked or paid for until Sean says yes.
- In our groups you post what we send and answer as Vegans Explore. You don't change group settings or remove organizers.
- No bots or automation.

4. Pay.
$150 for each month of work, through Stripe, paid the first Friday after the month ends. A part of a month at the start or end is paid by the day. Running a Community Night is a separate assignment: $150 for each night you run. Set up Stripe, including your W-9, before your first payday.

5. Trial and ending.
The first month is a trial. Either of us can end this at any time with 7 days' notice by email, or right away if the ground rules or privacy are broken. You are paid through your last day.

6. Access.
We add you as a moderator on our Facebook groups and a co-organizer on our Meetup groups, with your own login. No password is shared. We can see everything and can remove access at any time.

7. Privacy and tone.
Keep what you learn about Vegans Explore, its members and the people you talk to private. Be warm and honest, and never promise anything we haven't built.

8. What belongs to whom.
The groups and the conversations you handle for Vegans Explore belong to Vegans Explore. What you post on your own accounts stays yours.

9. When it ends.
We remove your access, and you delete anything of ours you have. Sections 7 and 8 still apply.

10. The basics.
Florida law applies. This is our whole agreement. Typing your name and ticking the box counts as signing, and you get a copy by email.$a$ as t) x
where not exists (select 1 from ve_positions where slug = 'community-nights-south-florida');

-- VE_TEAM_NOTIFY_EMAIL (2026-11-20): ve-positions reads where team notices go from lesaruss_secrets instead of keeping the address in
-- code; the row was copied inside the database from the founder's member record, so the address is never typed out.
