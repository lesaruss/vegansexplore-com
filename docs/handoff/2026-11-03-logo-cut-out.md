# 2026-11-03: Logo editor, Cut out

Sean (Lettuce Stain, London: its logo sat inside a menu picture): "crop it so I can just select the section that I want... diagonal
patterns... it automatically will fill the background... part of the logo tool in the depot."

## Built and live (main ae56557)
`public/ve-logo-editor.js` only (no DB, no edge function). New **Cut out the part you want**: Box (drag) or Shape (click points,
close on the green first point, Enter or double click, Backspace takes one back, Shift+drag moves the picture, wheel zooms), then
**Cut it out** crops to the selection; a shape's outside is filled with the most common color along its edge (`ringOf`), which also
becomes Match its edges; a see-through edge stays see-through (white default). **Undo cut** steps back; cuts chain. `toBlob` draws
without the overlay (`exporting`). Every user of the editor has it: Depot > Logos, the listing editor's Replace the logo, New places,
Add a listing. Written up in CLAUDE.md under Logos.

## Checked
Real browser (Playwright) on a synthetic menu photo: diagonal shape cut with clean filled corners, undo, box + Enter, blob export,
no console errors, 1440 and 390 px. Live file confirmed serving the new code.

## Verified on the real logo
Lettuce Stain (London), whose logo sat inside a menu picture: Sean tried Cut out on it on 2026-11-03 and it worked perfectly. No change
to `ve-logo-editor.js` was needed.

## Known limits (unchanged)
A fill on a busy or gradient background is approximate. Not built: freehand lasso, magic-wand background removal. Build them only when
a real logo needs them (a per-edge-pixel blend for busy backgrounds first, then the wand).
