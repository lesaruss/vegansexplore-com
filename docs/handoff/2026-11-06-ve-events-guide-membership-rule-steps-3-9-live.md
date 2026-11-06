# ve-events-guide: membership rule steps 3 to 9, live (2026-11-06)

Playbooks: `ve-events-guide` (also `ve-pathways`, `ve-pricing-points-passport`). Canon `canon-ve-door-guides` v6 `membership_rule_v6`.
Wording approved by Sean the same day: `docs/proposals/membership-rule-wording-steps-3-9.md` (as written; badge "Registered restaurant", not
"restaurant owner"; "Plant-based options alongside other food", never "Vegan options"). Then "Merge and go live". Main merge 68083a3.

## Live
- **3. Shared questions** (`20261106_shared_intake_tagged.sql`): chapter, org_name, org_link, vegan_level (values all/mostly/friendly/notyet,
  e_vegan and e_chapter ids kept so Depot > Event sponsors Compare scores). Events and Restaurant ask all four, Creator chapter, Nonprofit three.
  Every intake totals 250. Intros corrected from "100 points" to "up to 250 points".
- **4. Nonprofit intake** (`20261106_business_guides_intake_only.sql`): `ve_surveys` 'nonprofit-guide', 11 questions, 250; the Guide is a door
  Guide, free with the survey; its old form and $11/points buttons are gone; catalog card "Free with a short survey". Creator was already on it.
- **5. Intake only**: `ve-guide-unlock` opens a door Guide only with `ve_survey_completions` for its survey (purchases and comps still count);
  `unlock`/`checkout` on a door Guide answer 409 `survey_only`; `ve_owns_guide` follows. Events, Restaurant and Nonprofit gates show the member line.
- **6. Registered badges** (`20261106_registered_badges.sql`): `ve_member_badges`, `ve_person_badges` (anon); on the dashboard ("Registered"),
  the member card and a linked People profile.
- **7. Explorer survey** (`20261106_explorer_survey.sql`): `ve_surveys.reviewed`; 'explorer', 8 questions, 250; for an unpaid account the points
  are held and finishing sets `members.survey_review` pending (Depot > Profiles > Waiting for review, which now lists Guide survey answers);
  approval pays and admits (Founding by the finish day). `/passport` and the $11 window's survey button go to `/survey?s=explorer`. After the $11
  the dashboard shows the survey prompt until any survey is finished (Not now hides it per browser).
- **8.** "We got your claim" email and the claim thank-you link the event survey.
- **9.** `/policies#membership` (Becoming a member, Guides), the Guides' facts and 7 saved answers (`20261106_membership_rule_words.sql`).
- Functions deployed from 68083a3 (sha256 matched): ve-guide-unlock, ve-dashboard, ve-mission-survey, ve-events. DB writes the connector held went
  through the one-time `ve-once-membership-rule`, now the 410 stub.

## Proven
Rolled back: badges; the Explorer path (held, pending, locked, approve paid 210 and Founding). Live: status/checkout refusals; pages at 1440 and
390 with no errors or sideways scroll; survey screens and gates against mocked answers.

## Not proven / open
- A real signed-in run of any survey and an Explorer approval on a live account.
- Lines Logan wrote to make it work (Sean OK'd shipping): Events and Nonprofit Get access intros, Dani's Get access line (text, not recorded),
  the Explorer thank-you pointers and "Your points are in." River's recorded Events "Get access" line still says the $11 is a way through;
  re-recording is Sean's call.
- The Restaurant Guide's Get in screen speaks to non-members; a member who reaches it reads "your membership opens when you finish".
- The Creator Guide page wording waits on branch `claude/optimistic-mendel-box698`; its server side already follows the rule.
- The old `/survey?door=1` 31-question door still works for anyone mid-way.
