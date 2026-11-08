-- ve-front-of-house: BrandDesk Site pricing relocked by Sean, 2026-11-08 ("Lock it. Agree on pricing feedback.").
-- Applied through the connector on 2026-11-08 (canon canon-ve-front-of-house v8 -> v9). Safe to run again.
update knowledge_records set version = 9, updated_at = now(), updated_by = 'logan',
 change_summary = 'v9 2026-11-08: BrandDesk pricing relocked by Sean ("Lock it"): BrandDesk Site $500 a quarter, no setup; add-ons photos $250 and video $250; Managed $500 a month stays as the step up.',
 body = body || jsonb_build_object('pricing_v9', jsonb_build_object(
  'locked_by', 'Sean, 2026-11-08, "Lock it. Agree on pricing feedback."',
  'site', 'BrandDesk Site: $500 a quarter, no setup fee. Their website on our frame, their brand kit, their Directory page, Vegans Explore member sign-in on their site, a Community Manager running onboarding (coordinating the photographer, their uploads and their questions), content creator visits sent to them with a heads-up, a check-in every quarter.',
  'add_ons', 'Photos $250 (up to 8 dishes, or the owner uploads their own; a full 15-dish shoot is quoted, the photographer default being $450). Video $250 (our narrated photo slideshow).',
  'managed', 'Managed stays the step up at $500 a month: Google, social, a campaign every month, on top of Site.',
  'community_manager_pay', 'On Site: a one-time onboarding fee per client (Logan suggested $150; Sean to confirm the amount), not $250 a month.',
  'replaces', 'The $1,500 setup as the only way in. Existing terms for anyone already signed stay.',
  'not_built', 'Stripe prices, /business/managed checkout, the pitch page, /business Managed by us, the agreement and the Guides facts still say $1,500 setup and $500 a month until changed.'))
 where slug = 'canon-ve-front-of-house' and status = 'active';
