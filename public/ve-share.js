/* ve-share.js: Share on every page (Sean, 2026-11-01: "I want to be able to copy any page that I see, any configuration that I see.
   I want to be able to have a unique URL that I can share... even if we had a link, a button somewhere on every page that you can
   copy. I want this platform to be shareable... We need everybody to share it, even if they're not signed in").

   VEShare.button(cls)  the button's markup (an icon, and Share where there is room)
   VEShare.wire(el)     makes an element share the page
   VEShare.url()        the link: the page as anyone can open it (a dashboard address becomes its public page), without tracking
                        or sign-in bits (vl, utm_*, t, view_as), and a signed-in member's own ?ref= so the visit and a sign-up
                        are credited to them
   VEShare.open()       the phone's own share sheet where there is one, else copy the link, with a note

   Loaded by nav.js (every page) and the dashboard's top bar (center-console). */
(function () {
  if (window.VEShare) return;

  // A dashboard address and its public page. The member-only parts (the dashboard itself, My Saves, the Depot) share the home page.
  var DASH = [[/^\/dashboard\/directory\/([^/]+)\/?$/, '/directory/$1'], [/^\/dashboard\/directory\/?$/, '/directory'],
    [/^\/dashboard\/events\/?$/, '/events'], [/^\/dashboard\/media\/?$/, '/media'], [/^\/dashboard\/guides\/?$/, '/guides'],
    [/^\/dashboard\/pulse\/?$/, '/pulse'], [/^\/dashboard\/communities\/?$/, '/communities'],
    [/^\/(dashboard|admin|account|secret-shopper|survey|levels|guide)(\/.*)?$/, '/']];
  var DROP = ['vl', 't', 'view_as', 'unsub', 'token', 'fbclid', 'gclid', 'paid', 'status', 'session_id', 'welcome', 'stripe', 'hub', 'embed', 'preview'];

  // The dashboard shows some pages in a frame (a Guide, the Daily Pulse, Bounties). Share sends the page in the frame, as its own
  // address carries it (the Pulse's chapter and tab, a Guide's tab), not the dashboard's.
  function framed() {
    try {
      var f = document.querySelector('#dash-content.detail-open #dash-console-host iframe') ||
        Array.prototype.filter.call(document.querySelectorAll('#dash-pulse-host iframe'), function (x) { return x.offsetParent; })[0];
      if (!f || !f.contentWindow) return null;
      var l = f.contentWindow.location;
      if (l.origin !== location.origin || !l.pathname || l.pathname === 'blank') return null;
      return f;
    } catch (e) { return null; }
  }

  function member() {
    try { var m = window.VEAuth && VEAuth.getMember && VEAuth.isLoggedIn && VEAuth.isLoggedIn() ? VEAuth.getMember() : null; return m || null; }
    catch (e) { return null; }
  }
  function url() {
    var fr = framed(), at = fr ? fr.contentWindow.location : location;
    var path = at.pathname, hash = at.hash, keep = true;
    for (var i = 0; i < DASH.length; i++) {
      if (DASH[i][0].test(path)) { var to = path.replace(DASH[i][0], DASH[i][1]); keep = to !== '/'; path = to; break; }
    }
    var q = new URLSearchParams(keep ? at.search : '');
    DROP.forEach(function (k) { q.delete(k); });
    Array.from(q.keys()).forEach(function (k) { if (/^utm_/.test(k)) q.delete(k); });
    if (!keep) hash = '';
    var m = member();
    if (m && m.referral_code && !q.get('ref')) q.set('ref', String(m.referral_code));
    var s = q.toString();
    return location.origin + path + (s ? '?' + s : '') + (hash && hash !== '#' ? hash : '');
  }
  function title() {
    var fr = framed(), d = document;
    try { if (fr) d = fr.contentDocument || document; } catch (e) {}
    var t = ((d && d.title) || document.title || '').replace(/\s*[—|-]\s*Vegans Explore\s*$/, '').trim();
    return t ? t + ' on Vegans Explore' : 'Vegans Explore';
  }

  function css() {
    if (document.getElementById('ve-share-css')) return;
    var st = document.createElement('style'); st.id = 've-share-css';
    st.textContent = [
      '.ve-share-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 13px;margin-right:6px;border-radius:6px;border:1.5px solid rgba(0,0,0,0.12);background:#fff;font-family:"Montserrat",sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;cursor:pointer;flex-shrink:0;}',
      '.ve-share-btn:hover{border-color:var(--vb-go,#2d7d31);color:var(--vb-go,#2d7d31);}',
      '.ve-share-btn:focus-visible{outline:3px solid #22C55E;outline-offset:2px;}',
      '.ve-share-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}',
      '@media(max-width:1060px){.ve-share-btn{width:38px;padding:0;font-size:0;gap:0;}}',
      '@media(max-width:380px){.ve-share-btn{width:36px;height:36px;margin-right:4px;}}',
      '.ve-share-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;max-width:min(520px,calc(100vw - 32px));background:#1a1a1a;color:#fff;font-family:"Montserrat",sans-serif;font-size:13px;font-weight:600;line-height:1.45;padding:14px 18px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.25);}',
      '.ve-share-toast b{color:#5EC47A;}',
      '.ve-share-toast .u{display:block;margin-top:6px;font-size:11px;font-weight:500;color:rgba(255,255,255,.7);word-break:break-all;}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/></svg>';
  function button(cls) {
    css();
    return '<button type="button" class="ve-share-btn' + (cls ? ' ' + cls : '') + '" data-ve-share aria-label="Share this page" title="Share this page">' + ICON + 'Share</button>';
  }

  var tt;
  function toast(html) {
    css();
    var el = document.getElementById('ve-share-toast');
    if (!el) { el = document.createElement('div'); el.id = 've-share-toast'; el.className = 've-share-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = html; el.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, 4200);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } finally { ta.remove(); }
    });
  }
  function track(how) {
    try { if (window.gtag) gtag('event', 'share', { method: how, content_type: 'page', item_id: location.pathname }); } catch (e) {}
  }
  function open() {
    var u = url(), touch = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    if (touch && navigator.share) {
      navigator.share({ title: title(), url: u }).then(function () { track('share_sheet'); }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        copy(u).then(function () { toast('<b>Link copied.</b> Anyone can open it.<span class="u">' + esc(u) + '</span>'); track('copy'); });
      });
      return;
    }
    copy(u).then(function () {
      toast('<b>Link copied.</b> Anyone can open it, signed in or not' + (/[?&]ref=/.test(u) ? ', and people who join through it count as yours' : '') + '.<span class="u">' + esc(u) + '</span>');
      track('copy');
    }).catch(function () { window.prompt('Copy this link:', u); });
  }
  function wire(el) {
    if (!el || el._veShare) return; el._veShare = true;
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  }
  // Any element with data-ve-share shares the page, wherever it is drawn.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ve-share]');
    if (b && !b._veShare) { e.preventDefault(); open(); }
  });

  css();
  window.VEShare = { button: button, wire: wire, url: url, open: open };
})();
