-- ve-pre-vegan-guide: LOCKED by Sean 2026-11-08 ("lock it"), concept session with V.
-- Canon canon-ve-pre-vegan-guide v1, the playbook decision record, and the playbook index row.
-- Safe to run twice.

insert into knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
values (
  'canon-ve-pre-vegan-guide',
  'The Pre-Vegan Guide and 111 Days to Going and Staying Vegan',
  'decisions', 'guides',
  $j${
    "locked": "Sean, 2026-11-08: lock it (concept session with V)",
    "why": "A Facebook post from someone ready to go Vegan who did not know where to start. A free door Guide for Pre-Vegans, sticky enough to use every day, with a members-only daily course. The engine is the prototype for 111 Day Theory and a module to rent on LESARUSS.ai and BrandDesk, so it is built brand-neutral.",
    "door": "Free door Guide. The Pre-Vegan survey is Explorer's questions plus 5 Pre-Vegan questions in one flow, 250 points; finishing makes them a member. No $11 at the door. It replaces the Coming soon Pre-Vegan Guide card. Maya narrates. Template parent: the Vegan Dairy Guide. Overview tour standard and the mobile card standard apply.",
    "free": ["The Overview tour and the phase map (titles only)", "Day 1 in full as the free example", "Is it Vegan? (the barcode scan)", "Near me (the Directory)", "Swap of the week"],
    "members": ["Start the 111 days and the daily drop", "Challenges and points", "Unlocks, the full Swap Library, My list", "The Library of all 111 at the end, and the badges"],
    "phases": [
      {"n":1,"days":"1-7","name":"Start here"},
      {"n":2,"days":"8-21","name":"Breakfast and dairy"},
      {"n":3,"days":"22-35","name":"Your plate"},
      {"n":4,"days":"36-49","name":"Shopping and the pantry"},
      {"n":5,"days":"50-63","name":"Eating out and people"},
      {"n":6,"days":"64-77","name":"Cooking confidence"},
      {"n":7,"days":"78-91","name":"The deeper why"},
      {"n":8,"days":"92-104","name":"Your community"},
      {"n":9,"days":"105-111","name":"Staying Vegan"}
    ],
    "phase_rule": "Each phase ends on a capstone day; the capstone unlocks the next phase.",
    "points": {
      "open_today": 5, "do_it_ticked": 5, "scan_auto": 10, "save_auto": 10,
      "checkin_bonus": "+15 on top of the usual check-in 10", "photo_approved": 25,
      "voice_or_reflection_approved": 25, "phase_capstone_approved": 50,
      "rules": "At most one paid action per type per day. Photo, voice and capstone pay only after a person approves, like bounties. About 2,500 points over the course (Level 2 at the finish; about 1,100 by Day 45, enough for a topic Guide). Abuse watch applies. Points are given, never bought."
    },
    "unlocks": {"7":"Pre-Vegan badge on the profile and Phase 2","14":"The full Swap Library","21":"Maya's Starter Shelf in the Cookbook","35":"The plate builder (printable)","49":"Shopping list templates","63":"The Eating Out kit","77":"Five meal plans","104":"Their chapter's Founder or Ambassador path card","111":"The Library of all 111 and the 111 Days badge"},
    "vegan_word": "We never award a Vegan badge. Day 111 asks them to choose: I'm Vegan, or Still Pre-Vegan, still going. Both are honored; I'm Vegan changes their profile's journey answer, in their own words.",
    "day_clock": "Day 1 opens on Start. Then a new day unlocks at 5 AM in their own time zone, only once the day before has been opened (progress, not calendar): no backlog and no bingeing ahead. Opened days can be re-read. Proofs stay open 7 days after a day unlocks. No streak shaming: Days you showed up. After 3 quiet days one gentle note from Maya, then nothing until they return. Pause up to 14 days, once per phase.",
    "question_map": "The course gathers what we need deliberately: about one question every 5 days (about 22), each the Build your profile question that fits that day, saved and paid per answer as Build your profile already does, so the profile is about complete by Day 111. Plus course-only questions: their why (Day 1), what is hardest now (each capstone), the Day 111 choice. What is hardest feeds the monthly what-people-ask-for list. Every answer can be skipped; Can be shown / Just for Vegans Explore applies. The map (day to question key) is course data, not code.",
    "after_111": "Maya checks in by email: 1 week, 1 month, 3 months, 6 months after Day 111, then every 6 months until they stop. Two lines only: Hi <first name>, it's Maya. Just checking in. How's it going? Anything we can help with? No offers, no asks, no ulterior motive. It says she is their Guide and a person on our team reads every reply. Replies go to the team Inbox, assigned to the chapter's Community Manager else the team, 24-hour reply clock, a person answers. Stop any time (link or reply stop); quiet through 2 in a row drops to once a year. People who stop partway get one note 30 days after going quiet (no pressure, their day is still there), then the same rhythm. Wording is a draft, off until Sean approves.",
    "days_1_7": [
      {"day":1,"title":"Why you're here","free":true,"maya":"You don't have to be perfect to start. You just have to start. For the next 111 days I'll bring you one thing a day. Today's is the easiest: tell me why.","do":"Write your why in one sentence (private; shown back on Day 111)","points":"5 open + 5"},
      {"day":2,"title":"One swap, your milk","maya":"Most people's first win is in their coffee. Pick a plant milk today, just one, and live with it for a week.","learn":"Oat, soy, almond, pea compared (Dairy Guide)","do":"Photo of your new milk in your fridge or cup","points":25},
      {"day":3,"title":"Find your places","maya":"Vegan food is closer than you think. Let's find yours.","learn":"Near me, the Directory, what 100% Vegan, Plant-based and Pre-Vegan options mean","do":"Save 3 places near you","points":10},
      {"day":4,"title":"Read the label","maya":"Five words do most of the hiding: whey, casein, gelatin, carmine and honey. Learn those and the aisle opens up.","do":"Scan 3 things (10, automatic); bonus photo of yourself at the supermarket (25, approved)"},
      {"day":5,"title":"Your first meal out","maya":"Today, let someone else cook. Pick a 100% Vegan place you saved and go.","do":"Check in there (10 + 15), optional meal photo"},
      {"day":6,"title":"Hear it from someone who's been there","maya":"Five minutes, one story. This is someone who sat where you're sitting.","learn":"One content-index moment about starting out (picked by Logan from tagged moments)","do":"Listen, then one line on what stuck","points":25},
      {"day":7,"title":"Say it out loud","capstone":true,"maya":"Week one, done. The hardest part of going Vegan is often the first time you tell someone. Tell one person you're Pre-Vegan.","learn":"Three ways to say it without a lecture","do":"20-second voice note on how it went, or a photo with them","points":50,"unlock":"Pre-Vegan badge and Phase 2"}
    ],
    "drafts": "Maya's lines are text drafts until Sean approves them, then recorded in her roster voice (sM8RysETdBj1LIqLd9tl), checked with stt.",
    "engine": "Brand-neutral: programs, days, enrollments, progress, proofs, unlocks, question map. Vegans Explore first, 111 Day Theory second. Proofs reuse the bounty and check-in review queues and the Scan and Saves logs. Check-ins reuse the Guide welcome-note sender with its own switch.",
    "build_order": ["1. The engine data model (incl. the question map)", "2. The Guide shell copied from the Vegan Dairy Guide, Overview tour, mobile card, the Pre-Vegan survey (Explorer + 5)", "3. The daily drop and notifications (daily email by opt-in, one weekly reminder if unopened; push when the app ships)", "4. Days 8 onward written in batches by phase, each batch to Sean", "5. After-111 check-ins and email replies routed into the Inbox (new piece, useful everywhere)"]
  }$j$::jsonb,
  'active', 'sar', false, 50,
  array['vegans-explore','guides','pre-vegans','maya','111-days','drip-course','111-day-theory'],
  1, 'Locked by Sean 2026-11-08', 'v', 'v'
)
on conflict (slug) do nothing;

insert into playbook_records (slug, brand_slug, author, body, source, kind)
select 've-pre-vegan-guide', 'vegans-explore', 'v',
  've-pre-vegan-guide: LOCKED by Sean 2026-11-08 (canon canon-ve-pre-vegan-guide v1). Free door Guide (Explorer + 5 Pre-Vegan questions, 250 points, Maya, Dairy Guide parent). Members-only 111 Days to Going and Staying Vegan in 9 phases with capstones; points 5/10/25/50 (about 2,500 total, Level 2 at the finish); unlocks on days 7, 14, 21, 35, 49, 63, 77, 104, 111; never a Vegan badge (Day 111 is their own declaration); progress-based day clock at 5 AM local, proofs open 7 days, no streak shaming, pause 14 days per phase; a question map gathers the profile deliberately (about 22 questions); after Day 111 Maya sends two-line check-ins (1 wk, 1 mo, 3 mo, 6 mo, then every 6 mo), replies to the team Inbox. Days 1 to 7 drafted in the canon. Next: Logan builds, engine data model first.',
  'text', 'decision'
where not exists (select 1 from playbook_records where slug='ve-pre-vegan-guide' and body like 've-pre-vegan-guide: LOCKED by Sean 2026-11-08%');

insert into ve_playbook_index (slug, brand_slug, title, goal, status, stage, next_action, owner, priority)
values ('ve-pre-vegan-guide','vegans-explore','Pre-Vegan Guide and 111 Days',
  'A free Pre-Vegan door Guide with Maya and a members-only 111-day daily course, on a brand-neutral engine that becomes 111 Day Theory.',
  'building','Locked by Sean 2026-11-08; Days 1 to 7 drafted; nothing built',
  'Logan: engine data model (programs, days, enrollments, progress, proofs, unlocks, question map), then the Guide shell from the Dairy Guide. Sean: approve Maya''s Day 1 to 7 lines.',
  'Logan', 2)
on conflict (slug) do update set status=excluded.status, stage=excluded.stage, next_action=excluded.next_action, goal=excluded.goal, title=excluded.title, updated_at=now();
