# Dr. Michael Klaper doctor's tips (Ep 59)

**LOCKED by Sean 2026-11-20** (nine; the dietitian tip dropped: "I don't like the last one"). v2 = the end card with Vegans Explore on its own row:
`klaper-<name>-v2.mp4`. Calendar: `docs/social/spotlight/doctor-tips-calendar-2026.md`.

Ten reels on the locked doctor's tip frame (`scripts/brand-templates/podcast-spotlight-cut.py`, title style A, Guides pink),
cut 2026-11-20 from Drive Ideas 111926 `VEP 0059.mp4`. Reels: `vegan-media/media/podcast/spotlight/doctor-tips/klaper-<name>-v1.mp4`
(tip 1 is `klaper-b12-soil-v1.mp4`).

| # | Spec | Title | Sends people to |
|---|---|---|---|
| 1 | klaper-b12-soil-v1 | Where does B12 come from? | Nutrition Guide |
| 2 | klaper-dose-v1 | How much B12 do you need? | Nutrition Guide |
| 3 | klaper-labels-v1 | Which B12 should you buy? | Nutrition Guide |
| 4 | klaper-iodine-v1 | Where do Vegans get iodine? | Nutrition Guide |
| 5 | klaper-vitd-v1 | Should you take vitamin D? | Nutrition Guide |
| 6 | klaper-protein-v1 | Where do you get your protein? | Nutrition Guide |
| 7 | klaper-batch-v1 | Cook once, eat all week | Directory, Vegan food near you |
| 8 | klaper-fruit-v1 | Make fruit your dessert | Directory, local markets and farms |
| 9 | klaper-outside-v1 | Get outside every day | Communities, Vegan Events Guide |

Left out on purpose: the water-fasting stories (medical claims) and the lockdown lines (recorded during COVID).

How they were made (repeatable for the next expert):
1. Word timings: cut an audio window per tip, `el-media` `upload_url` + `stt` from SQL (pg_net).
2. Parts chosen on word edges, at least 0.25 s clear of the next word (the 0.25 s join dissolve fades both sides).
3. Captions: `<name>.cap`, one phrase per line, timed to the words by `mkspec.py` (fillers and stutters dropped;
   `_` hides a spoken word the caption leaves out, e.g. a repeated "you,"). "Vegan" capitalized.
4. **Split view**: the episode cuts between Klaper solo and a side-by-side with Sean (`ep59-split-view.json`, found at 5 fps from the
   left edge brightness). A Klaper-only copy crops his tile (`crop=596:335:655:193`, scaled to 1280x720) during those stretches, so
   every reel shows him the same way. Tips 2, 3, 7, 8, 10 use it.
5. Proof: a contact sheet per reel, `--guides` safe box, and stt of each finished reel compared caption by caption; about -16.5 LUFS.
