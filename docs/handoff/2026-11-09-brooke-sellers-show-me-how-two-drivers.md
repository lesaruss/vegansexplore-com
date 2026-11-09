# brooke-sellers: Show me how, one set of steps with two drivers (2026-11-09)

Playbook `brooke-sellers` (with `branddesk-production-wing`). Session: Logan with Sean. Nothing built, merged or sent this session.

## Decided (Sean)
- **Step by step, never rattled off.** Each connection step (Search Console, Instagram, YouTube, TikTok) is split into single actions. V plays one, stops,
  then **Done** (next step) or **I have a question** (a chat with V on that step; if V cannot solve it, it goes on the next Hot Lab).
- **Same steps, two drivers.** "It's just who's driving it is the question."
  - **The client drives** (self-serve clients): BrandDesk > <brand> > Get set up > Show me how.
  - **Sean drives** (managed clients, on the Hot Lab): a staff-only view, BrandDesk > Meatless Muscle > Get set up > **Run the Hot Lab**. The same steps as his
    run sheet: the line to say, a tick, "what she should see", the fix if she is stuck. It adds our own steps in order: create her Metricool brand, connect
    Instagram, YouTube and TikTok from our side while she approves on her phone, add Search Console, confirm her numbers in Insights. Her ticks are saved
    so her Get set up shows Done. Sean: "I'm going to need the instructions... I'm not fluid enough to be able to do it without seeing you telling me what to do."
- **Brooke**: everything done live on her walkthrough Hot Lab; she is not sent the videos.

## Logan's defaults (Sean did not override)
- Self-serve clients never hand over passwords or API keys (no key room). Connect buttons: Metricool's client connect link for the socials (believed to exist,
  **not verified**), and Google Search Console and Analytics by adding our read-only analytics address with **Restricted** access (what the Website tab already asks).
- Show me how's "contact@lesaruss.com, Full" is for managed clients only; self-serve gets the read-only address. Fix the mismatch when the steps are split.
- Every video and step ends the same way, except TikTok (always done together).

## State
- Scripts: `docs/proposals/brooke-show-me-how-scripts.md`, copied onto `claude/brooke-insights` this session, so `claude/brooke-show-me-how-scripts` can be deleted.
- HQ `claude/brooke-insights` (1f6e498) and vegansexplore-com `claude/brooke-insights`: both merge cleanly into main (checked 2026-11-08). Still waiting on "merge both".
- Written steps live today in HQ `lib/clientTasksDefs.ts` (on `claude/brooke-insights`), rendered by `components/branddesk/client/ShowMeHow.tsx`.

## Next, in order
1. On Sean's "merge both": merge HQ `claude/brooke-insights` to HQ main, then vegansexplore-com `claude/brooke-insights` to main; confirm live at
   hq.lesaruss.ai signed in with a new example.com throwaway (`ve-once-desk-proof`, fresh key), 1440 and 390 px; delete the throwaway, stub the function.
2. Split the four scripts into single steps with "what she should see" and "if she's stuck"; Sean reviews the words before anything is built or recorded.
   Our own Metricool steps are written against Metricool's real screens, never from memory.
3. Build **Run the Hot Lab** (staff view, steps from one shared definition in `lib/clientTasksDefs.ts`, ticks saved to her tasks).
4. Then the client-driven step-by-step version (clips, Done / I have a question, V chat on the client desk), and verify Metricool's connect link.

## Waiting on Sean
- "Merge both". Merge HQ 085 (`claude/funny-goldberg-yghwuu`). Delete `claude/brooke-show-me-how-scripts`. Merge `claude/nifty-lovelace-86xs90`.
- Approve V's lines and outreach draft 4fbbd9f4 (nothing goes to Brooke without his approval).

## Findings, with defaults
- GA4 data starts Oct 30: Insights should say "No earlier data" instead of a % when the period before starts earlier.
- 24 of her 69 leads in 30 days are bots: queue an intake filter on her website form (hidden trap field and a minimum fill time); existing leads untouched.
- One Coach OS check-in dated Dec 12, 2026: her data, raised with her on the Hot Lab, not changed by us.
