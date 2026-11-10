# Featured-in story frames

One 1080x1920 story per place a Guide features, for the Featured in program's first step (tag them before the DM). Parent: the creator
kit's story (`scripts/creator-kit/`): the picture behind, the white postcard, two rows of type, the white bar with the landscape logo v1.

- `render.js rows.tsv outdir`: rows are `slug|kind|name|handle|picture|logo` (kind `gift`, `menu` or `kosher`; `-` for none). The postcard
  holds the gift's or dish's photo, else the logo on white. The picture behind is the Guide's own illustration for that kind (no faces).
- First run (2026-11-10): 42 frames for Featured in the Holiday Guide, zipped at
  `vegan-media/media/holiday/featured-stories/holiday-guide-featured-stories-v1.zip`.
- A new Guide: add its kinds to `KIND` (its illustration and its line) and its two-row headline.
