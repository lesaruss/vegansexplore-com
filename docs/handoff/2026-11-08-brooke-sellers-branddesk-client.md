# brooke-sellers: Brooke set up as the first BrandDesk client

Date: 2026-11-08 (Eastern). Playbooks: `brooke-sellers`, `branddesk-production-wing`. Logan, build mode.

## Done
- BrandDesk > Clients (HQ) and Depot > Members checked live signed in as vegan@ at 1440 and 390 px (Clients empty then, Members 39 matching the
  database). QA session signed out, `ve-once-qa-session` back to the 410 stub.
- Brooke's Vegans Explore account made: bsellersotss@gmail.com, member 809e1680-cc21-410e-a9c8-a9d6c7544a34, `pending_payment` (not a comp).
  She becomes a member by finishing the creator survey from her Creator Guide link; Continue with Google on that email signs her into this account.
- Her People listing `brooke-sellers` names it (`details.person.member_id`, a `ve_listing_edits` row).
- BrandDesk account 26572b91-50fd-473f-9dce-52c3c55def3b: active, live (test false), setup `full` with `setup_paid_at` set (no setup fee),
  social off, agreement `founding-partner-2026-11` "Not signed", note on billing. No welcome email sent (the stock one quotes $1,500 and $500).
- Onboarding: brand kit ticked by hand (her kit is `ve_brand_cartridges` meatless-muscle, not a listing kit); meatlessmuscle.com archived into
  her Library (18 pages, 71 files, 38.7 MB; 2 files could not be saved). `list` returns her as the one client.
- Migration record: `supabase/migrations/20261108_brooke_branddesk_client.sql`.

## Gaps found (not fixed)
- Pause and End it in Depot > BrandDesk call Stripe with her empty subscription and will fail; her billing is HQ client billing.
- The onboarding checklist is the restaurant one (starter shoot of menu items, Google profile); some steps do not fit a creator.
- Her brand kit is a brand kit, so the client view's asset sheet reads her listing, not the kit.
- Her live billing link (client_billing_plans fb28f444) is still `pending`: she has not added her card.

## Waiting on Sean
- Send her the Creator Guide link email (Depot > Outreach draft `brooke-resend`) and the billing link.
- Book the welcome call (onboarding step Welcome).
