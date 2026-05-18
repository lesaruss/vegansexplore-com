(function () {
  /* ── Styles ── */
  var css = [
    '.ve-nav{position:sticky;top:0;z-index:400;width:100%;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.09);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:60px;gap:16px;font-family:"Montserrat",sans-serif;}',
    '.ve-wordmark{font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:#1a1a1a;display:flex;align-items:center;gap:8px;text-decoration:none;}',
    '.ve-mark{width:26px;height:26px;object-fit:contain;flex-shrink:0;}',
    '.ve-wordmark-explore{color:#3A9B3E;}',
    '.ve-nav-links{display:flex;align-items:center;gap:24px;}',
    '.ve-nav-links>a{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B6B;text-decoration:none;transition:color 0.15s;}',
    '.ve-nav-links>a:hover,.ve-nav-links>a[aria-current="page"]{color:#3A9B3E;}',
    '.ve-nav-drop{position:relative;}',
    '.ve-nav-drop-btn{background:none;border:none;font-family:"Montserrat",sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6B6B6B;cursor:pointer;display:flex;align-items:center;gap:4px;padding:0;transition:color 0.15s;}',
    '.ve-nav-drop-btn:hover,.ve-nav-drop-btn.open{color:#3A9B3E;}',
    '.ve-nav-drop-arrow{font-size:9px;transition:transform 0.15s;display:inline-block;}',
    '.ve-nav-drop-btn.open .ve-nav-drop-arrow{transform:rotate(180deg);}',
    '.ve-nav-drop-menu{position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%);background:#fff;border:1px solid rgba(0,0,0,0.09);border-radius:10px;padding:8px 0;min-width:230px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:500;display:none;}',
    '.ve-nav-drop-menu.open{display:block;}',
    '.ve-nav-drop-item{display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;transition:background 0.1s;}',
    '.ve-nav-drop-item:hover{background:#f5f5f5;}',
    '.ve-nav-drop-item[aria-current="page"]{background:#e8f5e9;color:#2d7d31;}',
    '.ve-nav-drop-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}',
    '.ve-nav-cta{background:#F69820;color:#fff !important;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:9px 18px;border-radius:4px;text-decoration:none;transition:background 0.15s;white-space:nowrap;}',
    '.ve-nav-cta:hover{background:#d4800f !important;}',
    '@media(max-width:768px){.ve-nav{padding:0 20px;}.ve-nav-links{display:none;}}',
    '@media(max-width:480px){.ve-nav{padding:0 16px;}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Current-page detection ── */
  var p = window.location.pathname.replace(/\/$/, '') || '/';

  function isCurrent(href) {
    var h = href.replace(/\/$/, '') || '/';
    return p === h;
  }

  function cur(href) {
    return isCurrent(href) ? ' aria-current="page"' : '';
  }

  var communityPaths = ['/communities/find', '/communities'];
  var onCommunityPath = communityPaths.some(function (h) { return isCurrent(h); });

  /* ── Nav HTML ── */
  var html =
    '<nav class="ve-nav" role="navigation" aria-label="Main navigation">' +
      '<a href="/" class="ve-wordmark" aria-label="Vegans Explore home"' + cur('/') + '>' +
        '<img class="ve-mark" src="/public/ve-mark.png" alt="" aria-hidden="true">' +
        'Vegans <span class="ve-wordmark-explore">Explore</span>' +
      '</a>' +
      '<div class="ve-nav-links">' +
        '<a href="/guides/ve-guides-roster-v1"' + cur('/guides/ve-guides-roster-v1') + '>Guides</a>' +
        '<a href="/guides/ve-discuss"' + (isCurrent('/guides/ve-discuss') || isCurrent('/guides/ve-guide-chat-v1') ? ' aria-current="page"' : '') + '>Discuss</a>' +
        '<div class="ve-nav-drop">' +
          '<button class="ve-nav-drop-btn' + (onCommunityPath ? ' open' : '') + '" id="ve-community-btn" aria-haspopup="true" aria-expanded="' + onCommunityPath + '">' +
            'Communities <span class="ve-nav-drop-arrow" aria-hidden="true">&#9660;</span>' +
          '</button>' +
          '<div class="ve-nav-drop-menu" id="ve-community-menu" role="menu" aria-labelledby="ve-community-btn">' +
            '<a href="/communities/find" class="ve-nav-drop-item" role="menuitem"' + cur('/communities/find') + '>' +
              '<span class="ve-nav-drop-dot" style="background:#3A9B3E;" aria-hidden="true"></span>' +
              'Find a Community</a>' +
            '<a href="/communities" class="ve-nav-drop-item" role="menuitem"' + cur('/communities') + '>' +
              '<span class="ve-nav-drop-dot" style="background:#F69820;" aria-hidden="true"></span>' +
              'Run a Community</a>' +
          '</div>' +
        '</div>' +
        '<a href="/directory"' + cur('/directory') + '>Directory</a>' +
        '<a href="/passport"' + cur('/passport') + '>Passport</a>' +
      '</div>' +
      '<a href="/passport" class="ve-nav-cta">Get Passport - $11</a>' +
    '</nav>';

  /* ── Inject before this script tag ── */
  document.currentScript.insertAdjacentHTML('beforebegin', html);

  /* ── Community dropdown behaviour ── */
  var communityBtn  = document.getElementById('ve-community-btn');
  var communityMenu = document.getElementById('ve-community-menu');

  communityBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = communityMenu.classList.toggle('open');
    communityBtn.classList.toggle('open', open);
    communityBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', function () {
    communityMenu.classList.remove('open');
    communityBtn.classList.remove('open');
    communityBtn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      communityMenu.classList.remove('open');
      communityBtn.classList.remove('open');
      communityBtn.setAttribute('aria-expanded', 'false');
    }
  });
})();
