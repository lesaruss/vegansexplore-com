(function () {
  /* ── Styles ── */
  var css = [
    '.ve-footer{background:#1A1A1A;}',
    '.ve-footer-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:32px 56px;font-family:"Montserrat",sans-serif;}',
    '.footer-logo{height:26px;width:auto;display:block;}',
    '.ve-footer .footer-links{display:flex;gap:24px;list-style:none;margin:0;padding:0;}',
    '.ve-footer .footer-links a{font-size:11px;font-weight:600;color:rgba(255,255,255,0.78);text-decoration:none;transition:color 0.15s;}',
    '.ve-footer .footer-links a:hover{color:#fff;}',
    '.footer-social{display:flex;align-items:center;gap:16px;}',
    '.footer-social .social-icon{display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.78);transition:color 0.15s;text-decoration:none;}',
    '.footer-social .social-icon:hover{color:#fff;}',
    '.footer-social .social-icon svg{display:block;}',
    '.footer-copy{font-size:11px;color:rgba(255,255,255,0.72);}',
    '@media(max-width:768px){.ve-footer-inner{flex-direction:column;gap:16px;padding:28px 32px;text-align:center;}.ve-footer .footer-links{justify-content:center;flex-wrap:wrap;}}',
    '@media(max-width:480px){.ve-footer-inner{flex-direction:column;gap:14px;padding:28px 20px;text-align:center;}.ve-footer .footer-links{justify-content:center;flex-wrap:wrap;gap:14px;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Footer HTML ── */
  var html =
    '<footer class="ve-footer" role="contentinfo">' +
      '<div class="ve-footer-inner">' +
      '<a href="/" aria-label="Vegans Explore home">' +
        '<img class="footer-logo" src="/public/logo-ve-landscape-v1-inverted.svg" alt="Vegans Explore">' +
      '</a>' +
      '<nav class="footer-links" aria-label="Footer navigation">' +
        '<a href="#">ABOUT</a>' +
        '<a href="/partners">PARTNER WITH US</a>' +
        '<a href="#">POLICIES</a>' +
        '<a href="#">CONTACT</a>' +
      '</nav>' +
      '<div class="footer-social" aria-label="Social media links">' +
        '<a href="#" aria-label="Instagram" class="social-icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>' +
        '<a href="#" aria-label="TikTok" class="social-icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.35 6.35 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34v-7a8.16 8.16 0 0 0 4.77 1.52V6.39a4.85 4.85 0 0 1-1-.3z" fill="currentColor"/></svg></a>' +
        '<a href="#" aria-label="YouTube" class="social-icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg></a>' +
        '<a href="#" aria-label="Facebook" class="social-icon"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>' +
      '</div>' +
      '<div class="footer-copy">2026 Vegans Explore</div>' +
      '</div>' +
    '</footer>';

  /* ── Inject before this script tag ── */
  document.currentScript.insertAdjacentHTML('beforebegin', html);

  /* ── Guide image helper ──
   * The Guide widget install itself moved OUT of this shared footer on
   * 2026-09-10 (Sean, Group I): the dialogue is now reachable only from the
   * dashboard dock, so dashboard/center-console.html owns the widget script
   * and this file no longer injects it on any page. Group H had already
   * gated it to signed-in members; scoping it to the one surface that has a
   * dock supersedes that gate and makes "no auto-appearing bubble anywhere"
   * true site-wide rather than true for visitors only.
   *
   * What stays here is the slug-to-portrait map, because it is a plain
   * lookup with nothing member-specific in it and both the dock icon and the
   * Choose Your Guide tile resolve through it. One map, not two.
   *
   * Liz is the default when the member has not picked a Guide yet (Sean,
   * 2026-09-10): "default to Liz's image rather than the current green
   * circle." */
  // Each Guide has two pictures (Sean, 2026-10-05): a square mid shot, waist up, for every square
  // or near-square spot (the dock icon, avatars, the picker, tiles), and a 9:16 full body for tall
  // spots only. "I don't want to see a full body shot in a square image." All in the Vegans Explore
  // Tee, drawn in our illustration style. A Guide without new art yet keeps its old picture.
  var ART = 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDGnUNmLloVUBJsrfOxR8cZFdv/';
  var VE_GUIDE_ART = {
    liz:   { square: ART + 'hf_20261005_021226_51fc0dd1-aad1-45ee-ada3-f6cab13ed3a2_min.webp',
             tall:   ART + 'hf_20261005_021230_e7e80a66-1335-48aa-9765-3cb2f90dd979_min.webp' }, // version 2, extended to 9:16
    // Square: the mid shot like Liz's (waving, head to waist). Tall: version 1 of 2 until Sean picks.
    maya:   { square: ART + 'hf_20261005_024302_9c0f4bbf-2a50-4b44-8aa2-b252c337e94c_min.webp',
              tall:   ART + 'hf_20261005_021228_c4d6da03-4abc-477b-886b-7b2fb8427a9f_min.webp' },
    theo:   { square: ART + 'hf_20261005_024302_f6297bbc-32d0-4a4c-8adc-2821b8253f7a_min.webp',
              tall:   ART + 'hf_20261005_021227_af42b1d0-8e0b-42b7-821a-a6ea8e5585f0_min.webp' },
    nori:   { square: ART + 'hf_20261005_024302_0295e562-b710-4312-843b-591739f56439_min.webp',
              tall:   ART + 'hf_20261005_021228_7539346c-a5aa-44a9-8a44-2a6cb463e378_min.webp' },
    // Dani uses a wheelchair; she is always drawn seated in it.
    dani:   { square: ART + 'hf_20261005_024303_76de8533-470a-4b1d-bb44-e5f56174e262_min.webp',
              tall:   ART + 'hf_20261005_024303_762a3532-8e91-4be2-b1bb-0a12465f4c06_min.webp' },
    river:  { square: ART + 'hf_20261005_024303_7f42e72b-fb79-4ee2-8ead-08a2709889ed_min.webp',
              tall:   ART + 'hf_20261005_021227_3462df28-bdbf-44e8-966b-be725c189a21_min.webp' },
    // Pascal, the Cultural Bridge (the guide chat demo and the pitches); not in the member picker.
    pascal: { square: ART + 'hf_20261005_024303_7798f249-b17f-47e7-b7c5-704a8aae5ba5_min.webp',
              tall:   ART + 'hf_20261005_024304_5e1634a6-d9de-43d5-919a-1af4001dbf45_min.webp' }
  };
  var VE_DEFAULT_GUIDE_SLUG = 'liz';

  function veChosenGuideSlug() {
    try {
      var flow = JSON.parse(localStorage.getItem('ve_guide_flow_state') || 'null');
      if (flow && flow.guide_slug && VE_GUIDE_ART[flow.guide_slug]) return flow.guide_slug;
    } catch (e) {}
    return VE_DEFAULT_GUIDE_SLUG;
  }
  // VEGuideArt(slug, 'square' | 'tall'); VEGuideImage(shape) is the member's own Guide. Square by default.
  function veGuideArt(slug, shape) {
    var a = VE_GUIDE_ART[slug] || VE_GUIDE_ART[VE_DEFAULT_GUIDE_SLUG];
    return a[shape === 'tall' ? 'tall' : 'square'];
  }
  function veGuideImage(shape) { return veGuideArt(veChosenGuideSlug(), shape); }
  window.VEGuideArt = veGuideArt;
  window.VEGuideImage = veGuideImage;
  window.VEChosenGuideSlug = veChosenGuideSlug;
})();
