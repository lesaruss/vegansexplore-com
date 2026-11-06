# vegans-explore-initiative-business-certification: B1 to B3 built

Date: 2026-11-05 (wrapped 2026-11-06). Logan, build mode. Branch `claude/inspiring-hypatia-ilwro1` (not on `main`).

## Done
- **B1** Verifier desk-review and visit forms: https://claude.ai/artifact/CPSYLTidahPfAWWQv2QXWG
- **B2** Pre-assessment: survey `pre-vegan-assessment` (27 questions), `ve_preveg_rules` (95), `ve_preveg_readiness(member)`, private,
  read through `ve-mission-survey` `preveg_readiness` (v9, source sha256 matched). Migration `20261105_pre_vegan_assessment.sql` (applied).
- **B3** Pre-Vegan Restaurant Guide: free door Guide opened by its survey; optional $11 contribution with the normal 1,100 welcome points.
  Migration `20261105_pre_vegan_guide.sql` (applied). Page and script on the branch. `survey.html` routes to the survey's `guide_slug`.
- `ve-stripe-webhook` v64: survey-door members get 1,100 on their first $11.
- Playbook records: 9f626156 (B1), 5daf39ea (B2), 788bdf88, 63fc478a, 401d91b5 (B3), and the WRAP record.

## Not launched / not proven
- Guide `published` false, survey `active` false. Nothing sent, no city on, nothing charged.
- A live readiness read by a real member; a live first $11 granting the points.

## Sean
- A4 name the attorney; A2 the entity.
- Approve Liz's lines (text in `guide-scripts/pre-vegan-restaurant-guide.js`), then the go to publish the Guide and turn the survey on.
- Merge `claude/inspiring-hypatia-ilwro1` and `claude/fervent-hamilton-fc48qo`.
- Decide whether `ve_outreach_due` stays people-only (business outreach cannot send today).
- Decide whether invitation members also get 1,100 on a first $11.

## Logan next
- B4: dish status registry and QR status page, then B5 to B7.
