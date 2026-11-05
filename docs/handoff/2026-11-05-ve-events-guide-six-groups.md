# ve-events-guide: the 15 tabs as 6 groups, River's group lines waiting (2026-11-05)

Playbooks: `ve-events-guide`, `ve-audio-accessibility`.

## Done and live on main
- River voices the Events Guide (merged cefdadf, checked live at 1440 and 390 px).
- The leftover recording queue is gone (tmp-river-tts cron, tmp_river_fire, tmp_river_tts; the one-time function is the 410 stub).
- a7e8954: desktop banner has 14px under the dropdown; on phones Hide me sits under River, left of Start the tour, same 42px height, 6px corners. Checked live.

## Built, NOT on main: branch `claude/funny-brown-862zti` (9ec87c7)
Sean approved the grouping ("Yeah, I approve... Let's do that"). `GROUPS` in `guide-scripts/vegan-events-guide.js`:
Start here (Overview); Plan it (Kinds, The plan, Money); Line it up (Venue, Vendors, Gear); Run it (The word, Day of, After);
Learn from hosts (Elephants, Hosts); Work with us (Claim, Sponsorship, Get access or My list).
- Dropdown lists the 6 with sections in small type; a group opens as tiles (`#/g/<group>`); crumb and button name the group (Plan it > Money, N of 6).
- Old `#/<section>` links still work; Back / Next walks Start here, each group page, then its sections.
- The tab once called Work with us is now Sponsorship.
- Checked locally at 1440 and 390 px, no errors, no sideways scroll. Preview share link given to Sean (expires 2026-11-06).

## Waiting on Sean
1. Say "merge" for the branch (merge commit, author Sean A. Russell).
2. Approve River's 5 group lines (text drafts in `GROUPS[].say`; Play steps aside on group pages until recorded):
   - Plan it: "Plan it is where your event starts. Pick the kind of event you're hosting, count down from twelve weeks out, and work out where you break even before you set a price."
   - Line it up: "Line it up is everything you book and pack. Find a venue and the vendors near you in our Directory, then pack from the gear list so nothing gets left behind."
   - Run it: "Run it takes you from the first post to the thank you after. Get the word out, run the day, know what to do when it rains, and set up your next event the day after."
   - Learn from hosts: "Learn from hosts is the part people rarely talk about: the things that worry hosts, and the hosts who've been through them on our shows. You can tell us your own story too."
   - Work with us: "Work with us is where we team up. Claim your event and your page, apply for a sponsorship paid in marketing, and see how to get the whole Guide."

## After approval (Logan)
Record each line in River's roster voice `btaSeNTVh1pGx4pjFzub` via el-media tts called from the database (pg_net), check word for word with stt,
save as `vegan-media/media/voices/events-guide/river-g-<group>-v1.mp3`, wire `riverAudio` for `g:` keys, then check live.
