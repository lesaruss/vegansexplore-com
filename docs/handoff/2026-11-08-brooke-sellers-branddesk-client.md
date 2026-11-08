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
- Her live billing link (client_billing_plans fb28f444) is still `pending`: she has not added her card.

## Done after Sean's "go"
- Creator checklist (`kind` creator), her brand kit read for the checklist and asset sheet (`kit_brand`), her plan in words (`plan_line`) on the client page,
  Depot > BrandDesk and HQ Clients; Pause and End it refused with `billed_outside`. `ve-branddesk` v22 from fb3569a live (sha256 matched), checked: pause and
  cancel 409, client shows creator steps and the meatless-muscle kit, list shows her plan line. Branches: VE and HQ `claude/determined-cannon-c6qjm0`, not on main.

## Waiting on Sean
- Send her the Creator Guide link email (Depot > Outreach draft `brooke-resend`) and the billing link.
- Book the welcome call (onboarding step Welcome).

## Founding terms (Sean, 2026-11-08)
Brooke's setup fee is waived and her monthly rate is discounted ($200), because she has been with Sean since 2024. What we get: her feedback as she uses it, so we work out the bugs and the process with a real person. Recorded in `ve_branddesk_accounts.plan_line` and `note` (migration `20261108_brooke_founding_terms.sql`). Her resend email in Depot > Outreach (draft 4fbbd9f4) now tells her this before the card link. It is still a draft and waits for Sean's approval.
