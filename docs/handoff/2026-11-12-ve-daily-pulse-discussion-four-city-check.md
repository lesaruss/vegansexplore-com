# ve-daily-pulse-discussion: four-city Pulse check (2026-11-12)

Checked the latest live issues (Wed Nov 11; Thursday had not published at 2 AM ET) in South Florida, New York, London and Los Angeles,
at 1440 and 390 px, in the normal look and `?look=preview`. Passed:
- every story under a topic, no "More news";
- the Facebook bounty (`/bounties?campaign=confirm-facebook`) is the first bounty tile and never a story;
- tiles 320x132 on desktop, 264x132 on phones (84% of the strip by design; the old 269 figure was a stale measurement);
- no script errors, no sideways scroll (Google Analytics and a Google profile picture are blocked only in the build sandbox).

One New York story (Green Queen, NYC school soy milk pilot) has no picture: greenqueen.com.hk answers our server 403; `ve-pulse-pics` rerun
gave the same. Left as the blank square. Thursday's drafts: every story has a known topic; the Facebook feature is added at publish.
No code change. Confirm-facebook bounty: 0 member answers.

Open (Sean): Depot > Pulse subscribers signed in; Save and Edit on a Pulse card; Insights > Ads > By banner.
Open (Logan): restore and pay confirm-facebook answers when they arrive (SQL in `2026-11-08-ve-community-directory-facebook-bounty.md`).
