# Episode promotion pack renderer

Locked by Sean 2026-11-12 (canon `canon-ve-brand-kit-templates` v2, reference `/mocks/podcast-pack`, playbook `ve-podcast-marketing`).
One spec file per episode holds the words, the pictures and who is cleared; the frames never change.

    # from the repo root, serve it, then render
    python3 -m http.server 8765
    node scripts/brand-templates/podcast-pack/render.js soflo-112 /tmp/pack112

- `specs/<show>-<number>.json`: `show` (name, short name, day, its community backdrop pack, platforms), `episode`, `cleared` (only people Sean cleared get a kit),
  `never` (people we never feature or contact), `assets` (post, end, story, cover, thumb, share).
- Kinds: `post` 1080x1350, `end` (the last carousel slide: where to listen, Link in bio), `story` 1080x1920, `cover` 3000x3000, `thumb` 1280x720, `share` 1200x630.
- Colors: `green` the show or a business, `orange` an event, `pink` a person, a Guide or a commercial, `bright` a bounty or news.
- Pictures: a business's real logo (`logo`, on white), a person's own photo (`photo`), our drawn art (`img`), a date or points tile (`tile`). Copy every logo and photo into vegan-media first.
- No buttons or QR codes on feed pictures. No face cut off or covered. Check every file by eye before it goes anywhere.
- `pack.css` is the mock's styles plus export mode; if the locked frames change, copy them from the mock again.
