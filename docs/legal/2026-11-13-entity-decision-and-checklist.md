# Vegans Explore entity: the decision and the checklist (2026-11-13)

## Decision (Sean, 2026-11-13): Vegans Explore is a DBA of LESARUSS Inc.

Sean: "I feel good about making it a DBA under LESARUSS Inc. Yeah, let's go ahead and do that... we do want people to buy into
LESARUSS. That's the whole point. Every brand that we put out is just the proof of concept for the system that we've created...
we can always spin off any type of brand we want."

So no Vegans Explore LLC. Investors buy into LESARUSS Inc., and any brand can be spun off later. Vegans Explore Inc. (Florida
nonprofit corporation N24000008839) is dissolved once its money and business have moved to LESARUSS Inc.

Every form, fee and statute below was read live on 2026-11-13 from Sunbiz (dos.fl.gov), the 2026 Florida Statutes
(leg.state.fl.us) and irs.gov through `ve-web-reader`. Nothing has been filed, sent or changed. Lines marked **Unverified**
could not be read today and need a person to confirm them.

Why the earlier "convert to an LLC" idea is gone: 617.18041 (new in 2026, ch. 2026-168) says a nonprofit corporation "that holds
property for a charitable purpose is prohibited from becoming" another kind of entity. A DBA avoids the question.

## The ordered checklist

### Step 0. What is already on file, and the one thing still needed
Read from the database 2026-11-13 (these were in the records; the first draft of this checklist missed them):
- **Board**: Sean and Claudia Russell. Ella Magers resigned 2026-10-21 (`foundation_board_consents`, choice resign), effective when
  delivered (617.0807).
- **The 2026-10-08 consents** (Sean and Claudia approved) were for renaming VE Inc. to LESARUSS Foundation, Inc., **not** for
  dissolving it. Claudia has agreed to dissolve (Sean, 2026-11-13), and that now needs her signature on the new consent (Step 2).
- **Money** (`finance_entities`, `finance_stripe_txns`): VE Inc. Stripe `acct_1Q8MzdP0w5C9oZhv`, gross 2025 $11,533.02 (78 charges:
  vendor booth fees, subscriptions, a community partner registration), 2026 $2,494 through Nov 11 (a live subscription still bills
  here). **None labeled a donation** (the open check from the 2026-11-12 BOSS run, done). Sean: "Vegans Explore is making no
  money... all that's come in has come in for services LESARUSS has rendered."
- **LESARUSS Inc.**: Sunbiz P20000048978, Active (2026 annual report filed May 1, 2026), 300 SW 1st Ave, Suite 155, Fort Lauderdale,
  FL 33301 (Broward County). It already has its own Stripe account (`acct_17uJd8JqP8HzdnUn`).
- **Still needed from Sean**: the VE Inc. articles from Sunbiz (Sean is sending them) to confirm there are no voting members and
  that the articles and bylaws do not forbid acting by written consent. Also LESARUSS Inc.'s EIN for the DBA form, if it is not
  already in HQ.

### Step 1. Register the DBA (Sean can do this himself)
1. **Advertise** the intent to register "Vegans Explore" **once in a newspaper** (as defined in chapter 50) in the county of
   LESARUSS Inc.'s principal place of business: **Broward County** (Fort Lauderdale address on its 2026 annual report). This comes **before** filing, because the registration certifies it was done
   (865.09(3)(a)5).
2. **File the Fictitious Name Registration**: Sunbiz form CR4E001 or online ("Start E-Filing > Fictitious Name Registration").
   **$50.** Registrant: LESARUSS Inc., with its Florida document number and EIN. Valid until December 31 of the fifth calendar
   year after registration (865.09(5)).
3. Florida law says a business may not trade under a fictitious name until it is registered (865.09(3)(a)). The contracts
   already say "LESARUSS Inc. d/b/a Vegans Explore", so this goes first.

### Step 2. One written consent, signed by Sean and Claudia (replaces a meeting)
617.0821: unless the articles or bylaws say otherwise, the board can act without a meeting by a written consent **signed by every
director**; it counts as a meeting vote. With Ella gone, that is Sean and Claudia. The consent (built like the 2026-10-08 one,
signed by link) covers:
1. **Ella's resignation**, effective 2026-10-21, noted for the record.
2. **Dissolution** of Vegans Explore Inc. (617.1402(2): no voting members, so the directors in office decide). It replaces the
   2026-10-08 rename to LESARUSS Foundation, which is not going ahead.
3. **The Vegans Explore name, website, accounts and subscriptions move to LESARUSS Inc.**, which already provided the services
   behind that revenue.
4. **Plan of distribution of assets** (617.1406(3)): pay every liability first; no donations or restricted assets were found;
   whatever is left (a small Stripe and bank balance) goes to LESARUSS Inc. An officer signs a certificate of compliance, and the
   plan is filed with Sunbiz (617.1406(4)).

Attorney check, light: both directors are related to the receiving company's owner, so the consent should state why the move is
fair (LESARUSS Inc. rendered the services, and VE Inc. holds almost nothing).

### Step 3. Move the money to LESARUSS Inc. (before dissolving)
1. **No new EIN.** LESARUSS Inc. uses its own. A DBA is a name, not a new entity.
2. **Bank**: payouts go to a LESARUSS Inc. account. Stop topping up the VE Inc. account once Stripe has moved (a separate one for Vegans Explore is cleaner for showing the brand's numbers;
   CPA call).
3. **Stripe**: contact Stripe Support to change the Vegans Explore account's legal entity from Vegans Explore Inc. to LESARUSS
   Inc. (legal name LESARUSS Inc., doing business as Vegans Explore; LESARUSS Inc.'s EIN, bank account and representative).
   If Support will not do it, open a new account under LESARUSS Inc. and ask Support to move the data. **Unverified:** Stripe's
   article on transferring to a different entity was read through search results only.
4. **Stripe 1099 setup** (paused at "Business information", totals on Payouts only): finish it with **LESARUSS Inc.'s** name and
   EIN, **after** the account is on LESARUSS Inc. CPA confirms which entity issues KJ's 2026 1099.
5. **KJ (first payday Fri Dec 4, 2026)**: the contract names LESARUSS Inc., and with this path the contract and the payer finally
   match. If Stripe is not on LESARUSS Inc. by Tue Dec 1, LESARUSS Inc. pays KJ directly from its own account for Dec 4.
   Nothing changes in KJ's agreement (Positions build: branch `claude/elegant-archimedes-e2id0v`).
6. Site copy: the homepage line "Vegans Explore Inc. is a Florida nonprofit corporation" and `policies.html` change to
   "Vegans Explore is a DBA of LESARUSS Inc." (Logan, once the DBA is registered).

### Step 4. Dissolve Vegans Explore Inc. (after money stops landing there)
- **Non-Profit Articles of Dissolution (Has Commenced to Conduct its Affairs)**, Sunbiz form cr2e059 or online ("File Corporation
  Dissolution"). **$35.** It states (617.1403) the name and either the members' meeting date and that the votes were enough, or
  (no voting members) that fact, the date the board adopted it, the directors in office, and the vote.
- File the plan of distribution (Step 2, item 3) with Sunbiz.
- After dissolution the corporation only winds up (617.1405): it collects, pays, and distributes under the plan. Directors and
  officers take on no personal liability just because it dissolved.
- **Known claims** (617.1408), optional but protective: written notice to known claimants with a deadline of at least 120 days.
  Claims not received by the deadline are barred.

### Step 5. IRS and state closing for Vegans Explore Inc. (CPA)
It is not a 501(c)(3), so it is taxed as a C corporation (CPA confirms). From irs.gov "Closing a business":
- **Form 966**, Corporate Dissolution or Liquidation, when the board adopts the plan to dissolve. **Unverified:** the 30-day
  deadline is in the form's instructions, which were not read today.
- **Final Form 1120**, with the "final return" box checked.
- **1099-NEC** for any contractor Vegans Explore Inc. paid $600 or more in its closing year.
- **EIN 99-4445734**: the IRS cannot cancel it, only deactivate it, by letter (EIN, legal name, address, the assignment notice if
  you have it, the reason). The IRS will not close the account until every return is filed and every tax paid.
- Florida corporate income tax and Department of Revenue accounts. **Unverified** (CPA).
- Charitable solicitation exposure from the "tax-deductible" offer. **Unverified** (attorney).

## Who does what

| Sean can do himself | Attorney | CPA |
|---|---|---|
| Send the VE Inc. articles from Sunbiz | A light read of the written consent (both directors related to LESARUSS Inc.'s owner) | Tax on Vegans Explore Inc.'s revenue to date; final Form 1120; Form 966 timing |
| The newspaper notice, then the Fictitious Name Registration ($50) | The board resolutions and the plan of distribution: is anything restricted or charitable (617.1406(3)(c), 617.1405(6))? | Which entity issues KJ's 2026 1099; then finish the Stripe 1099 setup |
| Contact Stripe Support about the entity change | Fixing the "Tax-Deductible Sponsorship" offer; charitable solicitation exposure | Separate bank account and books for Vegans Explore inside LESARUSS Inc. |
| Hold the board meeting (attorney drafts) | | Florida Department of Revenue accounts and the final state return |
| Articles of Dissolution ($35), last | | |

**State fees:** $50 fictitious name + $35 dissolution = **$85**, plus the newspaper notice (price set by the paper) and optional
certificates.

## Sources read 2026-11-13
- Florida Statutes 2026, 865.09 Fictitious Name Act
- Florida Statutes 2026, Chapter 617: 617.0505, 617.1402, 617.1403, 617.1405, 617.1406, 617.1408, 617.1804, 617.18041 to 617.18046
- Sunbiz fees (corporate, LLC, fictitious name) and forms (corporations, fictitious name): https://dos.fl.gov/sunbiz/forms/
- IRS: Closing a business; Do you need a new EIN; About Form 966; Canceling an EIN (irs.gov)
- Stripe (search results only): https://support.stripe.com/questions/transfer-a-stripe-account-to-a-different-entity-due-to-a-business-sale-or-acquisition
