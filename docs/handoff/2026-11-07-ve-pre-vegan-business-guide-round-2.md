# ve-pre-vegan-business-guide: round 2, visual Start here and step 2a progress

Date: 2026-11-07. Playbook: `ve-pre-vegan-business-guide`. Live on `main`.

## Sean's feedback after launch, and what changed
1. Dropdown ran into the white: 20px under it (16px on phones), `.dg-menu.dg-dd-on`.
2. Start here was text heavy: now six picture cards moved left and right (tabs, arrows, dots, swipe, arrow keys), never labeled Next. `ovCards()`, `ovGo()`; the 5-step checklist is on Finish line. CTA for members: Start with step 2, Learn it.
3. Pictures on every thumbnail: each Learn it (Why, How to say it) and Add it row and every group tile. 25 illustrated JPGs (640 px, Higgsfield nano_banana_pro, Restaurant Guide style) in `public/guides/pre-vegan-business/`; `pic()`, `WHY_PIC`, `SAY_PIC`, `LINE_PIC`, `ADD_PIC`, `TILE_PIC`. Some tiles reuse Restaurant Guide pictures (`rg:` prefix).
4. Progress: Step 2a of 5 with "Learn it · page 1 of 2" (`posOf`), in the tour bar, the dropdown and its list.

## Checked
- Live, signed out: 1440 and 390 px, no script errors, no sideways scroll.
- Members' views: checked locally with a mocked member at both widths (no live member session).

## Open
- Maya's recorded Overview line still says "follow me with Next". A new line needs Sean's approval, then a `-v3` recording checked with stt.
- Sean to read it through now that it is easier to read, and send the next round.
