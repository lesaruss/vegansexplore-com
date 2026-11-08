# ve-holiday-guide: Give Back pilot approved, temp objects dropped, card picture live (2026-11-08)

Playbook: `ve-holiday-guide`. Branch `claude/peaceful-mendel-d1dyco`, merged to `main` at b6ae3e5 (deploy READY, checked live).

## Done this session
1. **Temp objects dropped**: `tmp_theo_rec`, `tmp_theo_rec_next()`, `tmp_theo_stt(text[])`, through the one-time `ve-once-tmp-theo-drop` (now the 410 stub). Migration `supabase/migrations/20261108_drop_tmp_theo_recording_helpers.sql`. A SELECT confirmed 0 and 0.
2. **Spotted ThanksLiving menus** (from Sean's screenshots), live, by_team: Dina's Vegan Deli & Desserts, Soulicious Vegan Kitchen, A Broken Angel (Bend, OR, no listing). Migration `20261108_thanksliving_spotted_menus_1.sql`.
3. **Kwanzaa lines drafted** in `docs/proposals/holiday-guide-theo-lines.md` (on hold; Thanksgiving first). Open: drop the Black-owned card (Logan recommends dropping it).
4. **Guide card picture**: `public/guides/holiday-guide.jpg` (Theo serving a plant-based roast at a ThanksLiving table, store tee and apron), in the catalog and the og:image.
5. **Give Back**: cards open `/directory/<slug>` (places with a donation link first). Nonprofits, Rescues and Sanctuaries show **Donate** and **Why support <name>** (`giveCta`, `giveWhy` in `directory/listing.html`). Written by edge function `ve-giveback` (v2, commit 62a9988, sha256 matched). See CLAUDE.md "Give Back".
6. **Pilot of 20 Florida organizations**: 19 written (218 to 466 words), 17 with a tracked donation link. **Sean approved the pilot** ("I love it... I'm just approving it").

## Flags from the pilot (for Sean, not urgent)
- Project Paws Alive's site says Braselton, GA; our listing says Port St. Lucie.
- Kibblez of Love's figures look like 2018; Sanctuary at Soledad's from 2022.
- Animal Activism Collective's site shows a placeholder address.
- Beyond Nine's site mentions leaving PetSmart Fort Lauderdale in July 2026.
- Piper's Pals and Nathans Family Farm publish no way to give. Little Bear Sanctuary's site did not open.

## Next (Logan)
- **Run the rest**: about 653 open nonprofits, rescues and sanctuaries through `ve-giveback` `batch` (25 slugs a call), before Giving Tuesday, Tue Dec 1. Skip ones with `details.support` already. Check a sample by eye each batch. Report counts and failures (`details.support_try`).
- Word target stays as built (400 to 550 where the site supports it, never padded), unless Sean says otherwise.

## Next (Sean)
- Lock the Holiday Guide as the official Guide template when ready (his call only).
- Then: the Oregon chapter (Portland first; `ve_ideas` d60b742c-c06e-45a8-9d25-0499587cc97d) and the Holiday Guide campaign push.
- Kwanzaa lines, once Thanksgiving is done.

## Rules carried
No campaign work in this playbook's build chats. Never the word Friendsgiving in our copy. Times in Eastern. Commit as Sean A. Russell <contact@lesaruss.com>, Claude as co-author. End each reply with one "Next for you" line.
