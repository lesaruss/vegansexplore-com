(function () {
  /* ── Styles ── */
  var css = [
    '.ve-footer{background:#1A1A1A;padding:32px 56px;display:flex;align-items:center;justify-content:space-between;font-family:"Montserrat",sans-serif;}',
    '.footer-wordmark{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.7);}',
    '.footer-wordmark .ve-leaf{width:20px;height:20px;background:#3A9B3E;border-radius:50% 3px 50% 3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}',
    '.footer-wordmark .ve-leaf svg{width:10px;height:10px;fill:#fff;display:block;}',
    '.ve-footer .footer-links{display:flex;gap:24px;list-style:none;margin:0;padding:0;}',
    '.ve-footer .footer-links a{font-size:11px;font-weight:600;color:rgba(255,255,255,0.55);text-decoration:none;transition:color 0.15s;}',
    '.ve-footer .footer-links a:hover{color:rgba(255,255,255,0.85);}',
    '.footer-social{display:flex;align-items:center;gap:16px;}',
    '.footer-social .social-icon{display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.55);transition:color 0.15s;text-decoration:none;}',
    '.footer-social .social-icon:hover{color:rgba(255,255,255,0.9);}',
    '.footer-social .social-icon svg{display:block;}',
    '.footer-copy{font-size:11px;color:rgba(255,255,255,0.40);}',
    '@media(max-width:768px){.ve-footer{flex-direction:column;gap:16px;padding:28px 32px;text-align:center;}.ve-footer .footer-links{justify-content:center;flex-wrap:wrap;}}',
    '@media(max-width:480px){.ve-footer{flex-direction:column;gap:14px;padding:28px 20px;text-align:center;}.ve-footer .footer-links{justify-content:center;flex-wrap:wrap;gap:14px;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Footer HTML ── */
  var html =
    '<footer class="ve-footer" role="contentinfo">' +
      '<div class="footer-wordmark">' +
        '<div class="ve-leaf" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 19.34L5.71 21l1-1C8 18 10 17 12 17c3 0 5-2 5-5 0-1-.4-2-1-3z"/></svg>' +
        '</div>' +
        'Vegans Explore' +
      '</div>' +
      '<nav class="footer-links" aria-label="Footer navigation">' +
        '<a href="#">ABOUT</a>' +
        '<a href="/partner">PARTNER WITH US</a>' +
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
    '</footer>';

  /* ── Inject before this script tag ── */
  document.currentScript.insertAdjacentHTML('beforebegin', html);
})();
