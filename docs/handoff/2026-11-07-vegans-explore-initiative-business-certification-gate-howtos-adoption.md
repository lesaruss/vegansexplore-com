# vegans-explore-initiative-business-certification: gate how-tos and Guide adoption (2026-11-07)

## Done (merged to main ec5f826, Vercel production READY)
- Sean approved `docs/proposals/pre-vegan-guide-gate-howtos.md` and three defaults: $150 re-review or re-check; the restaurant provides tasting-night portions; the 2-year bar removes the whole listing (Removed, never deleted).
- The 8 gate pages in `guide-scripts/pre-vegan-restaurant-guide.js` are full how-tos (rule, what to do, G3 passes/fails, G5 staff Q&A, how to prove it, what the Verifier checks, common failures, Doing it without us). Members tick steps (Mark done, `ve-cookbook` kind `fix`, v13).
- Adoption tracking: `ve_preveg_readiness_snaps` with triggers, `ve_preveg_adoption()`, Depot > Pre-Vegan Certification > Guide adoption (`ve-certification` v4). Migration `20261106_preveg_guide_adoption.sql`, applied via the one-time `ve-once-preveg-adoption` (now the 410 stub).
- B6: `[$150]` became `$150`.

## Still dark
The Pre-Vegan Restaurant Guide is unpublished, its survey inactive, `/certified` noindex. Nothing sent, charged or certified.

## Not proven
- A real member ticking steps and their readiness moving in the adoption card (rolled-back transaction only).
- `ve-certification` admin-token route returns 401 (its `LESARUSS_ADMIN_TOKEN` env is unset; it was before this change). Test signed in.

## Next
- Logan: check the G5 staff questions against Form B's critical questions; set `LESARUSS_ADMIN_TOKEN` on `ve-certification` if Sean agrees; merge `claude/blissful-fermi-qmyiwt` (B5 art, B6, B7, C2 drafts) when Sean says.
- Sean: A2 entity, A4 attorney (send B6), A6 reviewer, A7 insurance, C1 the restaurants, A8 Verifier training call; the go to publish the Guide.
