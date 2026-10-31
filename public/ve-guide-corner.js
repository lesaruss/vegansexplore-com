/* The Guide in the corner (Sean, 2026-10-30, from the J9 proposal page: "V is in the top left-hand corner... that could be
 * something we could do for our other guides, because sometimes it's too much when they're on the page"; rolled out to every
 * Guide 2026-10-31). Every page with the Guide layout (#dgApp, #dgRail) loads this in <head>.
 *
 * At 900 px and under the rail is a row above the content: the Guide's picture as a 110 px rounded square on the left (the
 * page's .dg-maya or .dg-guide, the square mid shot with background-size cover), the bubble beside it with its tail pointing at
 * the Guide, the play button and Hide me under the bubble (side by side, stacked under 560 px), the name line hidden, and Back /
 * N of M / Next at the bottom of the content (the page's #dgTourM). Desktop is untouched. A page's .dg-folded and
 * ve-guide-min.js still fold the Guide away, since nothing here forces the picture or the bubble to show. */
(function () {
  if (document.getElementById('ve-guide-corner-css')) return;
  var R = '#dgRail', PIC = R + '>.dg-maya,' + R + '>.dg-guide';
  var css =
    '@media (max-width:900px){' +
      R + '{order:-1;display:grid;grid-template-columns:110px minmax(0,1fr) minmax(0,1fr);gap:10px 12px;align-items:start;min-height:0;}' +
      R + '>*{grid-column:2 / -1;min-width:0;}' +
      PIC + '{grid-column:1;grid-row:1 / span 3;width:110px !important;max-width:none !important;height:auto !important;min-height:0 !important;margin:0 !important;aspect-ratio:1/1 !important;flex:none !important;border:1px solid var(--gm,#b8ddb9);border-radius:14px;}' +
      R + '>.dg-namebar,' + R + '>.dg-guide-name,' + R + '>.dg-tour{display:none !important;}' +
      R + '>.dg-bubble{position:relative;font-size:14px;padding:12px 14px;margin:0;}' +
      R + '>.dg-bubble::before{content:"";position:absolute;top:18px;left:-7px;width:12px;height:12px;background:var(--gl,#e8f5e9);border-left:1px solid var(--gm,#b8ddb9);border-bottom:1px solid var(--gm,#b8ddb9);transform:rotate(45deg);}' +
      R + '>#dgPlay:not([hidden]):not(:empty){grid-column:2;}' +
      R + '>#dgPlay:not([hidden]):not(:empty)~.dg-fold{grid-column:3;}' +
      R + '>.dg-fold{margin-top:0 !important;}' +
    '}' +
    '@media (max-width:560px){' +
      R + '{grid-template-columns:110px minmax(0,1fr);}' +
      R + '>#dgPlay:not([hidden]):not(:empty),' + R + '>#dgPlay:not([hidden]):not(:empty)~.dg-fold{grid-column:2;}' +
    '}';
  var st = document.createElement('style'); st.id = 've-guide-corner-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
