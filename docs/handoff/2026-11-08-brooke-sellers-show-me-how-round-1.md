# brooke-sellers: Show me how, Sean's round 1, and a gift logo (2026-11-08)

Playbooks: `brooke-sellers` (with `branddesk-production-wing`). Logan, build mode.

## State
- HQ branch `claude/brooke-show-me-how`, latest **045f277**, NOT merged to HQ main. Preview: the newest Vercel deployment of that branch
  (`lesaruss-pj4ql1mzs-contact-2245s-projects.vercel.app` at 045f277; get a share link with Vercel `get_access_to_vercel_url`).
- Commits this round: 93f36fe (links, payment wording, header), 0f9280e (gift logo), 8b473d1 (logo left, pill beside, tabs left), 045f277 (phones: pill beside logo in one row).

## What changed (Sean's feedback)
1. Every web address in a Show me how step is a link, new tab (`linkify` in `components/branddesk/client/ShowMeHow.tsx`; addresses after @ stay text).
2. BrandDesk > Meatless Muscle > Get set up: "Add your payment information" / "Your payment information is on file." / button "Add my payment information".
3. Client desk header, every client (`CD_CSS` in `components/branddesk/client/ClientDesk.tsx`): logo left, status pill to its right centered on its height,
   no slogan, tabs left-aligned, first tab's text in line with the logo. Phones: logo smaller, pill beside it in one row (checked 360 and 390), 16px under the dropdown.
   Sean picked this over Logan's no-pill version (side-by-side comparison shown).
4. Gift logo for Meatless Muscle in the desk header only (`DESK_LOGO`, `public/branddesk/desk-logos/meatless-muscle.png`): double M beside MEATLESS over MUSCLE.
   Her locked kit and the Brand kit tab keep her original. If she likes it, give it as a gift in proper files (redraw as vector; source is a low-res JPEG)
   and change the kit with her yes. Files kept: `vegan-media/media/brandkit/meatless-muscle/gift-logo/` side-by-side.png, stacked.png, source-original.jpg.
   Playbook record 18f4fc63.

## Answered for Sean, waiting on his go
- **What I did it does today**: records she says so and emails the team; access goes to contact@lesaruss.com in Google, Meta, YouTube. Nothing reaches Metricool.
- **Metricool connect link** (from Metricool's own swagger, read through pg_net since help.metricool.com is blocked from build sessions):
  `POST /v2/settings/brands/connections/anonymous-link` makes the Brand settings > Connections link; whoever holds it connects Instagram, Facebook, TikTok,
  YouTube to our brand with no Metricool account; one link at a time, it expires (`expiresAt`), Advanced plan or higher. Recommendation: one
  "Connect your social accounts" step replaces Instagram, YouTube and TikTok (TikTok no longer needs the Hot Lab); Search Console stays. Needs a Meatless Muscle
  brand in Metricool (may count against the plan) and the plan checked.
- **Videos**: only Instagram is worth one, and only if that page stays; must be screen recordings on our own accounts with V's voice.

## Cleanup done
- Throwaway client login (test-bd-showmehow-1108@example.com) and its seat deleted; `ve-once-desk-proof` back to the 410 stub (verify_jwt on).
  The first throwaway used a lesaruss.com email and landed on the staff BrandDesk: any lesaruss.com email is staff. Use example.com.
- Client task tables still empty (0 tasks, 0 events). Nothing sent to Brooke.

## Next (Logan)
1. On Sean's word: merge `claude/brooke-show-me-how` to HQ main, confirm live signed in at 1440 and 390 (new throwaway on example.com, removed after).
2. On Sean's go: Metricool brand for Meatless Muscle, check the plan, the connect-link step.
3. B3, BrandDesk > Meatless Muscle > Insights: her GA4 (meatlessmuscle.com), Vegans Who Lift downloads (Captivate), leads/check-ins/sales (Coach OS);
   search and social say they wait on her Show me how steps. Branch, signed-in check, show Sean before merging.

## Waiting on Sean
- Merge item 2 (this branch). Go on the Metricool connect link. Approve video scripts, V's lines, Depot > Outreach draft 4fbbd9f4.
- Merge HQ 085 record (branch `claude/funny-goldberg-yghwuu`); delete stray branch `claude/brooke-show-me-how-scripts` on vegansexplore-com.
- Merge `claude/nifty-lovelace-86xs90` on vegansexplore-com (CLAUDE.md and handoffs).
