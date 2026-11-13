# Vegans Explore entity: the decision and the checklist (2026-11-13)

V, concept mode. Nothing has been filed, sent or changed. Every form, fee and statute below was read live today from Sunbiz
(dos.fl.gov), the 2026 Florida Statutes (leg.state.fl.us) and irs.gov through `ve-web-reader`. The session network was not
changed. Lines marked **Unverified** could not be read today and need a person to confirm them.

## What changed since the Nov 5 recommendation

**Converting the nonprofit straight into an LLC is probably closed.** A new 2026 section, read today:

> **617.18041 Limitation on conversion.** A domestic corporation that holds property for a charitable purpose is prohibited from
> becoming a domestic eligible entity or a foreign eligible entity, except by domestication to become a foreign corporation.
> (s. 114, ch. 2026-168)

Vegans Explore Inc. was set up as a nonprofit, presented itself as one ("Vegans Explore Inc. is a Florida nonprofit corporation"
on the homepage), and a "Tax-Deductible Sponsorship" offer went out in the Global Tour deck. An attorney may well say it holds
property for a charitable purpose. If so, conversion is barred. Separately, 617.1405(6) says charitable property cannot be
diverted by dissolution either, except under Florida's cy pres and nondiversion laws.

The Nov 5 hope ("convert and keep Stripe") also no longer depends on converting. Stripe's help article on moving an account to a
different entity after a sale says to contact Support first, and that the legal business name and tax ID can be changed.
**Unverified:** read through search results only; support.stripe.com would not load here.

## 1. The decision

| Option | What it is | For | Against |
|---|---|---|---|
| A. Convert VE Inc. to an LLC (617.1804 to 617.18046) | Same entity, keeps its 2024 date, contracts and property | No asset transfer | Likely barred by 617.18041. Only works if an attorney finds VE Inc. holds nothing for a charitable purpose. |
| **B. New Vegans Explore LLC, then dissolve VE Inc.** | A clean for-profit entity | Investor-ready, clean books from day one, no nonprofit history in the entity | Takes a name consent, an asset transfer approved by the board, and a Stripe entity change |
| C. DBA of LESARUSS Inc. | Fictitious name "Vegans Explore" for LESARUSS Inc. ($50) | Fastest; the contracts already say this | Investors would be buying into LESARUSS Inc., not Vegans Explore. Moving it into its own LLC later is a second move. |

**Recommendation: B.** Form Vegans Explore LLC now, owned by LESARUSS Inc., so Vegans Explore can take investors on its own
while LESARUSS stays the parent. Move payments into it, then dissolve VE Inc. Keep A only as a question for the attorney
("does 617.18041 apply to us?"). If the answer is no, conversion is cheaper, and the LLC filing waits a week for that answer.
Skip C as an end state.

**Default if Sean does not override:** B, with the LLC owned by LESARUSS Inc.

One note for later: priced venture rounds usually want a corporation. A Florida LLC can convert to a corporation later
(Sunbiz form "Florida LLC into Florida Profit Corporation", cr2e105). LLC now does not close that door.

## 2. The ordered checklist

### Step 0. Before anything is filed (this week)
1. Download VE Inc.'s **articles of incorporation and bylaws** (Sunbiz record N24000008839, document images). Look for three
   things: whether it has **voting members** (this decides who votes), the **purpose clause**, and any **dissolution clause**
   saying where assets go.
2. List what VE Inc. holds: the Stripe balance, the bank account, subscriptions, any money received as a donation or under the
   "tax-deductible" offer, and the name, domain and content (check whose name the domain is in).
3. Attorney: does 617.18041 apply? Can the operating business (customers, subscriptions, the name) move to an LLC owned by
   LESARUSS Inc.? (See section 3.)

### Step 1. Form the LLC (Sean can file himself)
- **Articles of Organization**, Sunbiz form cr2e047, or file online at Sunbiz "Start E-Filing > Limited Liability Company".
  **$125** ($100 filing + $25 registered agent). Certificate of status $5 and certified copy $30 are optional.
- **The name.** Section 605.0112(1)(b): an LLC name must be distinguishable from every entity on file, and a different suffix does
  not count. While VE Inc. is active, "Vegans Explore LLC" is **not** distinguishable. Allowed: register it with the other
  entity's **written consent filed with the articles**, as long as the names are not identical. So the VE Inc. board signs a
  consent letter first (Step 2, item 1), and it goes in with the articles.
- Write an operating agreement (attorney). Its member is LESARUSS Inc. if B goes ahead as recommended.

### Step 2. VE Inc. board meeting (one meeting, minutes signed)
Voting rule, from 617.1402 and 617.1406 (read today): **with no voting members, a majority of the directors then in office**
adopts each resolution at a board meeting. With voting members, the board recommends and the members vote, a majority of votes
cast at a noticed meeting. The articles and bylaws from Step 0 decide which applies.
1. Resolution consenting to "Vegans Explore LLC" using the name (for the Sunbiz filing).
2. Resolution approving the move of the operating business to the LLC on terms the attorney sets. Sean is on both sides, so
   Ella should vote as the disinterested director, and the minutes should say why the terms are fair. 617.0505 bars
   distributions to members, directors and officers except as the dissolution rules allow.
3. Resolution to dissolve (617.1402).
4. **Plan of distribution of assets** (617.1406(3)), which must provide, in this order: (a) pay or provide for every liability;
   (b) return assets that must be returned on dissolution; (c) send **assets restricted to charitable, educational or similar
   use** to an organization doing substantially similar work; (d) distribute other assets as the articles or bylaws say;
   (e) anything left goes to whoever the plan names, which can be a for-profit. An officer signs a certificate of compliance,
   and **the plan is filed with Sunbiz** (617.1406(4)).

### Step 3. Move the money (before dissolving)
1. **EIN for the LLC.** irs.gov says to get a new EIN when you get a new charter from the Secretary of State. VE Inc.'s EIN
   99-4445734 cannot be reused by the LLC.
2. **Bank account** in the LLC's name.
3. **Stripe**: contact Stripe Support to move the Vegans Explore account from VE Inc. to the LLC (legal name, EIN, bank,
   representative). If Support says no, open a new account under the LLC and ask Support to move the data.
   **Unverified** (see above).
4. **Stripe 1099 setup** (paused at "Business information", totals set to Payouts only): **do not finish it until the payer is
   fixed.** The payer's name and tax ID go on the 1099-NEC. Whichever entity pays KJ in 2026 issues KJ's 2026 1099. The CPA
   confirms which.
5. **KJ (first payday Fri Dec 4, 2026).** The contract names LESARUSS Inc., and the payer must match it. If Stripe is not on the
   LLC by Dec 1, LESARUSS Inc. pays KJ's Dec 4 payment directly and the contract stays as it is. Once Stripe is on the LLC,
   assign or re-sign the contract to the LLC (Positions build: branch `claude/elegant-archimedes-e2id0v`).
6. Update `policies.html`, the homepage nonprofit line and the contract templates to the new entity once it exists.

### Step 4. Dissolve VE Inc. (after money has stopped landing there)
- **Non-Profit Articles of Dissolution (Has Commenced to Conduct its Affairs)**, Sunbiz form cr2e059, or file online at
  "File Corporation Dissolution". **$35.** Contents (617.1403): the name; then either the date of the members' meeting and that
  the votes were enough, or (no voting members) that fact, the date the board adopted it, directors in office, and the vote.
- File the **plan of distribution** (Step 2, item 4) with Sunbiz.
- After dissolution the corporation winds up only (617.1405): collect, pay, distribute under the plan. Directors and officers
  take on no personal liability just because it dissolved. The name stays reserved for 120 days unless an affidavit releases it.
- **Known claims** (617.1408), optional but protective: written notice to known claimants with a deadline of at least 120 days.
  Claims not sent by the deadline are barred.

### Step 5. IRS and state closing (CPA)
VE Inc. is not a 501(c)(3), so it is taxed as a C corporation (CPA confirms). irs.gov "Closing a business", read today:
- **Form 966**, Corporate Dissolution or Liquidation, when the board adopts the plan to dissolve. **Unverified:** the 30-day
  deadline comes from the form's instructions, which were not read today.
- **Final Form 1120**, "final return" box checked.
- **1099-NEC** for any contractor paid $600 or more in the closing year (Form 1096 for paper copies). Forms 941/W-2 only if
  VE Inc. ran payroll.
- **EIN**: the IRS cannot cancel an EIN, only deactivate it, by letter (EIN, legal name, address, the EIN assignment notice if
  you have it, the reason). It will not close the account until all returns are filed and all taxes paid.
- Florida corporate income tax and any Department of Revenue accounts. **Unverified:** not read today (CPA).
- Florida charitable solicitation registration, if the "tax-deductible" offer counted as a solicitation. **Unverified** (attorney).

## 3. Who does what

| Sean can file himself, today | Attorney | CPA |
|---|---|---|
| Fictitious-name and entity search for "Vegans Explore" on Sunbiz | Does 617.18041 bar conversion? (decides A or B) | Tax treatment of VE Inc.'s revenue to date; final Form 1120, Form 966 timing |
| Pull VE Inc.'s articles and bylaws from Sunbiz | The terms for moving the business from VE Inc. to the LLC, with Sean on both sides (617.0505, conflict vote) | Which entity issues KJ's 2026 1099; finish Stripe 1099 setup only after that |
| LLC Articles of Organization ($125), but only after the board's name consent is signed | Plan of distribution: are any assets restricted or charitable (617.1406(3)(c), 617.1405(6))? | LLC owned by LESARUSS Inc.: disregarded entity treatment, books, bank |
| EIN for the LLC, once the LLC is on file | The fix for the "Tax-Deductible Sponsorship" offer; charitable solicitation exposure | Florida DOR accounts and the final state return |
| Contact Stripe Support about the entity change | Operating agreement; reassigning KJ's agreement and the client contracts | |
| Board meeting and minutes (attorney drafts the resolutions) | | |
| Articles of Dissolution ($35), last | | |

**State fees if B goes ahead:** LLC $125 + Articles of Dissolution $35 = **$160** (plus optional certificates). If A is allowed:
Certificate of Conversion $35 (corporate fee schedule) or $25 (LLC fee schedule), plus new-entity filing fees if they apply. The
attorney or Sunbiz confirms which schedule applies. Option C: $50 fictitious name.

## Sources read today
- Sunbiz Corporate Fees: https://dos.fl.gov/sunbiz/forms/fees/corporate-fees/
- Sunbiz LLC Fees: https://dos.fl.gov/sunbiz/forms/fees/llc-fees/
- Sunbiz fees (fictitious name): https://dos.fl.gov/sunbiz/forms/fees/
- Sunbiz corporation forms: https://dos.fl.gov/sunbiz/forms/corporations/
- Sunbiz LLC forms: https://dos.fl.gov/sunbiz/forms/limited-liability-company/
- Florida Statutes 2026, Chapter 617: 617.0505, 617.1402, 617.1403, 617.1405, 617.1406, 617.1408, 617.1804, 617.18041,
  617.18042, 617.18043, 617.18044, 617.18046 (http://www.leg.state.fl.us/statutes/, Chapter 617 index)
- Florida Statutes 2026, 605.0112 (Chapter 605 index)
- IRS: Closing a business; Do you need a new EIN; About Form 966; Canceling an EIN (irs.gov)
- Stripe (search results only): https://support.stripe.com/questions/transfer-a-stripe-account-to-a-different-entity-due-to-a-business-sale-or-acquisition
