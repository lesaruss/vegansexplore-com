# vegans-explore-initiative-business-certification: B4 dish status registry and QR status page

Date: 2026-11-06. Logan, build mode. Branch `claude/gracious-gauss-d7r3h7` (not on `main`). Nothing certified, sent, charged or launched.

## Done
- Migration `20261106_pre_vegan_dish_registry.sql` applied (through `ve-once-preveg-registry`, now the 410 stub; the connector held it).
  Tables `ve_preveg_certs`, `ve_preveg_dishes`, `ve_preveg_dish_events`; the move function, expiry sweep (cron `ve-preveg-expire`), public read and registry.
- Edge function `ve-certification` (verify_jwt off), deployed from bdd8538, source sha256 matched.
- Depot > Pre-Vegan Certification (`admin/depot/certification.html`, parent the Watchlist); public `/certified/<code>` and `/certified`
  (`certified.html`, parent the listing page, noindex). QR library vendored as `public/vendor-qrcode.js`.
- Proof (rolled back): direct status update refused; no reason refused; applied to active refused; non-admin refused; approve; public shows
  certified 1 of 20 with what else they serve; a failed dish never shows and its reason never leaks; registry lists it; suspend shows Suspended with
  no reason; approver who is the Verifier refused; same Verifier and desk reviewer refused; ended term reads not current before the sweep; sweep
  expires; 6 events kept; delete and history edit refused; unknown code not found. 0 rows left.
- Screenshots at 1440 and 390 px beside the parents (mocked answers), no sideways scroll, no script errors.

## Not done / not proven
- A real certificate through the Depot (records cannot be deleted; make the first real one for a pilot restaurant, C3).
- The diner report form of its own (the status page uses the Feedback window for now).
- Launch: `noindex` off, sitemap, and a link from the Pre-Vegan Restaurant Guide, after D1.

## Sean
- Unchanged from B1 to B3: A4 attorney, A2 entity, Liz's lines and the go to publish, merge the three branches
  (`claude/fervent-hamilton-fc48qo`, `claude/inspiring-hypatia-ilwro1`, `claude/gracious-gauss-d7r3h7`), the `ve_outreach_due` guard,
  invitation members and 1,100.

## Logan next
- B5 stamp and decal artwork with disclosures (Sean approves), then B7 the Verifier manual.
