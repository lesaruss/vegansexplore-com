# Vegans Explore brand kit: start here

The brand kit is complete and LOCKED (Sean, 2026-11-11). The look is **Color Block**, concept `/mocks/directory-looks/bold`.
Any session designing for Vegans Explore (the Directory navigation, HQ, any page) builds from this file and the pages below,
never from memory or a blank file (CLAUDE.md, template gate).

## The kit, live

| Part | Page | Canon (knowledge_records) |
|---|---|---|
| 1. Foundations: colors, type, buttons, tags, stripe, logo use | https://vegansexplore.com/mocks/brand-kit | `canon-ve-brand-kit-foundations`, `canon-ve-look-color-block` |
| 2. Imagery: illustration style, shapes, faces never cut, asset packs | https://vegansexplore.com/mocks/brand-kit/imagery | `canon-ve-brand-kit-imagery` |
| 3. Templates: posts, stories, thumbnails, video, podcast, email, ads | https://vegansexplore.com/mocks/brand-kit/templates | `canon-ve-brand-kit-templates` |
| 4. The Guide roster: eight Guides, bios, voices, avatars | https://vegansexplore.com/mocks/brand-kit/roster | `canon-ve-guide-roster` |
| Social kit: profile icon, headers, podcast covers, client pack | https://vegansexplore.com/mocks/brand-kit/social | |
| The look on a real page (the homepage) | https://vegansexplore.com/preview | |

Source files: `mocks/brand-kit/*.html`, `preview/index.html`.

## Tokens (copy these exactly)

```css
:root {
  --dk: #2D5C27;    /* brand green (dark): Directory; white type */
  --md: #3A9B3E;    /* mid green: Communities */
  --br: #22C55E;    /* bright green: Daily Pulse */
  --tint: #E8F5E9;  /* mint: Passport */
  --or: #F69820;    /* orange: Events, and THE action button (one per view) */
  --peach: #FFEBD1; /* peach: Media */
  --pink: #FF9EC4;  /* pink: Guides */
  --pinkt: #FFE3EE; /* pink tint */
  --pinkd: #C2185B; /* deep pink, for pink TEXT only */
  --ink: #1a1a1a; --mute: #5c5c5c; --line: #e7e7e7;
  --r: 6px;         /* every button, tab and input: 6px corners, never pills */
}
```

- **Type:** Montserrat (self-hosted; see `preview/index.html` head). Headings 900 weight, tight letter-spacing.
- **Type color on each block is fixed:** white on brand green; ink on everything else. The Foundations page shows each pair.
- **Section colors:** Directory brand green, Events orange, Guides pink, Communities mid green, Daily Pulse bright green, Media peach, Passport mint.
- **One orange action button per view.** Every other button is outlined or white.
- **The stripe** goes on everything we make: seven bands in the order dk, or, pink, peach, br, tint, md (the first band twice as wide). CSS: `.bk-stripe` in `mocks/brand-kit/index.html`.
- **Cards:** ink outline with a solid offset shadow. Headings carry a marker highlight (`.hl.g/.o/.p`).
- **Interface rules** (CLAUDE.md, Interface defaults): full width, never a fixed max-width; more than 5 tabs become a dropdown; select chevron at `right 16px`.

## Logos (always the real file, never redrawn)

- Landscape (headers, nav): `/public/logo-ve-landscape-v2.svg`, plus `-inverted`, `-white` and `-ink`.
- Portrait (stacked): `/public/logo-ve-portrait-v2.svg` plus `-inverted`, `-white` and `-ink` (PNGs beside them).
- The mark alone (small spots, favicons, "Vegans Explore approved"): `/public/logo-ve-mark.svg`, plus `-white`, `-ink` and `-inverted`, and PNGs.
- The logo lives in the color: all-white on dark blocks, full color on white, ink on light colors. Never a white chip dropped on a picture.

## Pictures

- **Guide avatars** (square mid shots, LESARUSS style): `/public/brand-kit/avatars/<slug>-vN.jpg`.
  - Never hard-code a file; ask `VEGuideArt(slug, 'square')` (`/public/footer.js`), which always has the approved version.
- **Hard block:** no head or face cut by a frame or covered by a graphic; words beside pictures, never on them.
- Every picture is made in the shape of its spot.

## Where the site stands

- **Live since 2026-11-11.** The look is on for everyone: `/public/ve-look.js` (loaded by `nav.js`) adds `html.ve-cb` and loads
  `/public/ve-look.css`. Put a page's look rules there under `html.ve-cb` (city hubs: `ve-look-hubs.css`). `?look=off` turns it
  off for one browser while checking; `?look=on` clears that.
- The homepage (`index.html`), the Directory's seven doors (`directory/index.html`, with Near me) and the house ads (`ads/`) are built on the kit.
- Every Guide (the Dairy Guide family, `/business-guide` and `/nominate`) wears the Guides pink rules in `ve-look.css` (`html.ve-cb.ve-cb-s-guides`, 2026-11-12); the Welcome Guide wears Passport mint.
- **Outreach:** paused until Sean lifts it.
