# ve-demo-showroom: tour video v4 live, owner's BrandDesk view live, pricing_v9 next

Playbooks: `ve-demo-showroom`, `ve-front-of-house` (pricing_v9), `lesaruss-ai-professional-frames` (new, locked).
Session ended 2026-11-08, 9:25 PM Eastern. Branch `claude/vibrant-clarke-kh2ewo`, all work merged to `main`.

## Done and live
- **Green Leaf Kitchen tour video**: `media/business/sample/v-tour-v4.mp4` (131.98 s, 1080x1350) on `/business/sample/tour`,
  captions `business/sample/v-tour-v3.vtt` (31 cues). v4 = v3 plus a point-of-sale terminal on the counter shot (frame 15,
  `scripts/tour-video/v3/compose.py` `s-counter`) and a steady music bed: story-dining-v2 trimmed 4 s, crossfaded into
  story-playful-v2 at chapter 6, about -33 dB floor, -15.6 LUFS (`scripts/tour-video/v3/render.py`). v1 and v3 kept in storage.
  `ve-once-tour-v3` is back to the 410 stub. Checked live at 1440 and 390 px.
- **The owner's BrandDesk view** (Sean: "go with your default"): `public/ve-branddesk-client.js` adds **Insights** (latest sent
  report against the month before, what people did, On your list this month) and **Your brand kit** (8 parts with state pills,
  N of 8 locked, Open your brand kit). The sample site's owner bar has **Open your BrandDesk**. Checked live on desktop and phone.
- **Lawyer review list**: `docs/legal/lawyer-review-list.md` (Tier 1 blocks money: the Managed Marketing Agreement needs a
  pricing_v9 version and has no liability or indemnity clause; the Passport Challenge stop agreement; Partner plan terms).
  Subscription lawyer services were researched for Sean (LegalZoom and others); Sean picks one.
- **LESARUSS.ai professional frames, locked** (V session): playbook `lesaruss-ai-professional-frames`, migration
  `supabase/migrations/20261109_lesaruss_ai_professional_frames_locked.sql`. One model: $500 a quarter do it yourself, or
  $500 a month managed with one check-in a month plus communication through the platform. Order: coaches, then CPAs, then
  law firms (flat marketing fee, never a cut of legal fees). PR push after traction, judged January 1, 2027.

## Next: pricing_v9 (Sean said "Logan, start the pricing_v9 build"; not started yet)
Canon `canon-ve-front-of-house` v9 `pricing_v9` and v14 `hot_labs_v12`. Change in this order:
1. **Stripe**: new reusable Prices by lookup key in `ve-branddesk` (Site $500 every 3 months, photos $250 one time, video $250
   one time, Managed $500 a month, managed setup $250 one time). Keep the old `bd_*_v1` prices for anyone on them (nobody is).
2. **`/business/managed`** (`business/managed.html`): plan step offers Site (no setup) or Managed; agreement step points at the
   new version.
3. **The pitch page** (`business/pitch.html`) What it costs, and its in-page sign-up.
4. **`/business`** Managed by us tab (`passport.html` `BIZ` / `business-guide.html`).
5. **The sample BrandDesk plan text** (`VEBrandDesk.sampleData`, still "$1,500 setup then $500 a month").
6. **Managed Marketing Agreement**: a new version written as a **draft for the lawyer**; `AGREEMENT_VERSION` and the live terms
   stay unchanged until Sean approves (Logan's default).
Community Manager onboarding fee on Site is $150 per client (internal split, never in public copy).
Then: the coach frame and its sample coach demo (`lesaruss-ai-professional-frames` next action).

## Still waiting on Sean (do not act without his yes)
- The pace rule (`canon-video-shot-pace`), V's three line changes, check-ins every two weeks on the Community page,
  optional phone recordings for tour frames 5, 14, 17, 22.
- Which subscription lawyer service; sending Tier 1 items to them.
