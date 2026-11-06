# vegans-explore-initiative-business-certification: Standard V1.2 locked, A-to-Z work queue, entity question

Handoff, 2026-11-05. Logan, build mode. Nothing built for the public, nothing sent, nothing charged, no city turned on.

## What happened

- **Outreach list read (step A1, not changed yet).** The restaurant outreach door (which carries the 100% Vegan Restaurant Guide emails)
  holds 63 Vegan-friendly and Vegan-options food places not sent, plus 11 held. 22 of them sit on South Florida's proposed send days
  (Nov 10: 13, Nov 11: 9, neither approved), including five pilot picks: Orion Fresh Mediterranean, Queen of Sheba, The Hummus House,
  Macchialina, Phuc Yea. **The sender and planner do not read `door`** (`ve_outreach_due`, `ve_outreach_plan`; only the insert trigger sets
  it), so relabeling alone would not stop them. Six may be 100% Vegan and mislabeled (Garden Butcher, Soul Vegetarian No. 2, Bakaris Plant-Based
  Kitchen, Leonor's Mexican Vegetarian, Ci Su Vegetarian Bistro, Govinda Vegan & Vegetarian). Turning Point has two contacts; one held listing
  has `vegan_status` `vegan`.
- **Legal Research Report V1** (Word, uploaded by Sean; AI-assisted research, not an attorney opinion) read against CRITERIA v1.1.
  **Sean locked** its seven changes and Logan's three pushbacks: no Shared Equipment mark in the pilot; one public standard, points private;
  a change stops the mark at once; suspension does not wait on intent; every critical staff question right; public registry, never a failure
  log; records term plus 5 years; a protected path includes a clean separate pan, pot or barrier (never shared fryer oil, cooking water or an
  uncleaned grill with animal products); the pilot cohort is free and the price is set after two timed audits; verifier, desk reviewer and
  approver are different people and the approver is a person. Report errors marked for counsel: the garbled G2 sentence, two unverified
  citations (DOL Feb 2026 proposal, 4th DCA 4D20-1986).
- **Verifiers** (locked): a job posting to our network for experienced people; nobody hired until the pilot.
- **Done is a recipe** (locked): each finished step gets a dated record of what, how, who and where.
- **Entity.** Sean is dissolving Vegans Explore Inc. and wants Vegans Explore as its own LLC for investors. From his Sunbiz PDFs: the
  only live entity is **Vegans Explore Inc., N24000008839**, Florida Not For Profit Corporation, ACTIVE, EIN 99-4445734, annual reports 2025
  and 2026, officers Sean Russell, Ella Magers (board member), Claudia Russell. **W24000086202** (2024-06-07) is a Rejected Filing: no for-profit
  exists. Recommendation given: hold the dissolution until an attorney answers whether it can convert directly to an LLC (conversion may keep
  the Stripe account and billing) and what board vote is needed. Default if filed anyway: DBA of LESARUSS Inc., LLC decided before D1,
  payments moved first.

## Where it lives

- Playbook records for the slug (newest 2026-11-05): LOCKED (legal report), **STANDARD V1.2** (the one to work from), **WORK QUEUE** (A to Z),
  verifier and entity locks, A2 entity open question, A2 Sunbiz facts, page rebuild.
- Canon `canon-ve-pre-vegan-certification` v3.
- Playbook page (`briefings` slug `vegans-explore-initiative-business-certification`, type playbook) rebuilt from template v3: 25 queue items,
  6 completed, 21+ history entries. Not seen in a browser (HQ not reachable from this session).
- `ve_playbook_index` row: status building, owner Logan, next action A1.
- CLAUDE.md: new section "Pre-Vegan Certification" (branch `claude/fervent-hamilton-fc48qo`).

## Next

- **A1 (Logan)**: migration that adds a not-ready `pre_vegan` door, moves the 74, takes the 22 off the Nov 10 and 11 send days, makes
  `ve_outreach_plan` and `ve_outreach_due` skip doors that are not ready, sets the door from `vegan_status` on insert for food places, merges the
  Turning Point duplicate; first check the six names on their own sites. Proven in a rolled-back transaction, then applied.
- **A2 (Sean)**: fictitious-name search for "Vegans Explore"; attorney on conversion and the board vote; CPA on moving Stripe, bank and
  Brooke's Nov 30 charge.
- **A3 (Logan)**: Standard V1.2 as one Claude Doc for Sean's final check.
- **A8 (Logan drafts)**: the verifier and second-approver job posting.

## Not done

- No migration file: this session changed only records (playbook, canon, index, briefing page), no schema.
- CLAUDE.md and this handoff are on the session branch, not yet on `main`.
