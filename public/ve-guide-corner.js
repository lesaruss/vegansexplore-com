/* The Guide in the corner (Sean, 2026-10-30, from the J9 proposal page: "V is in the top left-hand corner... that could be
 * something we could do for our other guides, because sometimes it's too much when they're on the page"; rolled out to every
 * Guide 2026-10-31). Every page with the Guide layout (#dgApp, #dgRail) loads this in <head>.
 *
 * At 900 px and under the rail is one card above the content (the Guide mobile card, LOCKED 2026-11-07): the Guide's picture a
 * third wide on the left (the page's .dg-maya or .dg-guide), the words beside it in a fixed box that scrolls, Play and Talk to
 * <Guide> on one row under the words, Hide me a small tag at the bottom middle of the picture (Sean, 2026-11-08: off the face), the name line hidden, and Back /
 * N of M / Next at the bottom of the content (the page's #dgTourM). Desktop is untouched. A page's .dg-folded and
 * ve-guide-min.js still fold the Guide away, since nothing here forces the picture or the bubble to show. */
(function () {
  if (document.getElementById('ve-guide-corner-css')) return;
  var R = '#dgRail', PIC = R + '>.dg-maya,' + R + '>.dg-guide';
  // Guides on phones (LOCKED by Sean 2026-11-07, canon canon-guide-mobile-card): one card that never grows. The picture a third wide
  // on the left; the words, then one row of buttons (Play, Talk to <Guide>) on the right, Hide me as a small tag at the bottom middle of the picture, the picture's bottom level with the buttons; longer
  // words scroll inside their own box. Rows are fixed (116 px words + 40 px buttons + 10 px gap = the 166 px picture).
  var css =
    '@media (max-width:900px){' +
      R + '{order:-1;display:grid;grid-template-columns:33% minmax(0,1fr) minmax(0,1fr);grid-template-rows:116px 40px;gap:10px 12px;align-items:stretch;min-height:0;}' +
      R + '>*{grid-column:2 / -1;min-width:0;}' +
      PIC + '{grid-column:1;grid-row:1 / span 2;width:100% !important;max-width:none !important;height:100% !important;min-height:0 !important;margin:0 !important;aspect-ratio:auto !important;flex:none !important;border:1px solid var(--gm,#b8ddb9);border-radius:14px;background-position:center top !important;}' +
      R + '>.dg-namebar,' + R + '>.dg-guide-name,' + R + '>.dg-tour{display:none !important;}' +
      R + '>.dg-bubble{grid-row:1;position:relative;font-size:14px;padding:12px 14px;margin:0;height:116px;max-height:116px;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;}' +
      R + '>#dgPlay:not([hidden]):not(:empty){grid-column:2;grid-row:2;margin:0 !important;height:40px;min-height:0;padding:0 6px !important;font-size:12px !important;letter-spacing:0 !important;text-transform:none !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex !important;align-items:center;justify-content:center;box-sizing:border-box;}' +
      R + '>.vepg-talk{grid-column:2 / -1;grid-row:2;margin:0 !important;height:40px;padding:0 8px !important;font-size:12px !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;justify-content:center;align-self:stretch !important;box-sizing:border-box;}' +
      R + '>#dgPlay:not([hidden]):not(:empty)~.vepg-talk{grid-column:3 / -1;}' +
      R + '>.dg-fold{grid-column:1 !important;grid-row:1 / span 2;align-self:end;justify-self:center;z-index:1;margin:0 0 6px !important;width:auto !important;height:auto !important;padding:4px 8px !important;font-size:10px !important;letter-spacing:.04em;border:0 !important;border-radius:6px !important;background:rgba(26,26,26,.82) !important;color:#fff !important;}' +
      R + '.dg-folded{grid-template-rows:auto;}' +
      R + '.dg-folded>.dg-fold{grid-column:1 / -1 !important;grid-row:auto;align-self:auto;margin:6px !important;justify-self:stretch;background:#fff !important;color:inherit !important;border:1.5px solid var(--line,#ddd) !important;padding:8px 10px !important;font-size:11px !important;}' +
    '}' +
    '@media (max-width:480px){' + R + '>.dg-bubble{font-size:13.5px;}}';
  var st = document.createElement('style'); st.id = 've-guide-corner-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
