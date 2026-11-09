# ve-explorer-path: step 6 proven, step 7 Build your profile (Nov 9, 2026, Eastern)

Playbook `ve-explorer-path`. Logan. On `main` and live.

## Done
1. **Step 6 proof** (one-time `ve-once-badges-proof`, now the 410 stub; source `scripts/supabase-once/badges-proof.ts`), rolled back, as Brion Hurley:
   two intakes held (Event host main by default), main set to Creator, Explorer refused (`not_held`), Creator taken back (main fell to Event host),
   finishing Creator again did not bring it back, the taken-back Creator refused as main. Six of six. Brion checked unchanged after.
   The connector held the first attempt for an approval that expired; the one-time function is the route.
2. **Step 7** (Sean: "go on step 7 with your defaults"):
   - Migration `20261109_profile_carry_explorer.sql`, applied through one-time `ve-once-profile-carry` (fetched from GitHub raw at 57095a0,
     sha256 180d986a matched; now the 410 stub). `ve_profile_carry_explorer(member)` and trigger `trg_ve_profile_carry_explorer`
     (Explorer completion insert, or `admitted` changing). Chapter to `q1_city` (not "other"), journey to `q6_stage` only where exact;
     Vegan is not carried. Pays each carried answer's profile points once; never replaces an answer; members and internal accounts only.
     Backfill: Brion got `q1_city` south-florida, 10 points. A rolled-back run with a Pre-Vegan answer carried both, paid 20 once, 0 on a second firing.
   - `public/ve-mission-survey.js`: the retired survey door's Review and finalize, team-review pending, sent-back note and "when approved" points removed.
   - `survey.html`: the Explorer finish adds "Build your profile. Tell us more about you, at your own pace, and earn up to 250 more points." (Sean approved);
     the profile gate for a non-member reads Join free.
   - `paths.html`: the same line as a strip under the paths for an Explorer whose profile is not finished (Keep building, with points so far, once started).
   - Checked locally at 1440 and 390 px signed out: no script errors, no sideways scroll.

## Not proven
- The profile page, the /paths strip and the Explorer finish screen signed in as a real member (checked signed out only).
- `q3_roles` (Which best describes you?) is not carried: it is a different question from "Do you run any of these?". Sean's call if he wants it pre-ticked.

## Next
Step 8: the invitations as drafts (one for everyone, a restaurant version; hero voice, canon-ve-voice-hero-guide). Step 9: policies, the Guides' facts, saved answers.
Still open for Sean: badge colors, the badge mock, seals on cards, the profile header redesign, the path Guides' "one short survey" line.
