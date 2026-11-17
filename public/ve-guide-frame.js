/* ve-guide-frame.js: the locked Guide frame (Sean, 2026-11-17: "Yes, I want to lock it in... they all need to be uniformed";
 * canon canon-ve-guide-templates; mocks /mocks/guide-templates/handbook/ and /finder/). Loaded by a moved Guide AFTER its own
 * script, on pages with <body class="ve-gf gf-hb">. Its CSS is Part 3 of /public/ve-guide-frame.css.
 *
 * Strangler move: the Guide's own script keeps drawing everything it drew (routes, gates, joins, sign-in, member search, My list,
 * recordings, Talk to the Guide). This file only turns the old frame into the mock's frame:
 *   - the pink Guide bar: the Guide's name, the join line as one line of text (built from the page's own .dg-joinbox, every link and
 *     button in it a stand-in that clicks the original, so the page's handlers run), members keep their search (the form is moved);
 *   - ONE Contents button and its numbered panel, built from the Guide's own menu (#dgMenuSelect / #dgMenu, kept in the DOM, hidden);
 *     choosing a part does what the dropdown did (sets it and fires change); Escape or the button closes it;
 *   - the Guide once, as a row under the page head: the rail's picture, the bubble's line, a quiet Play that clicks #dgPlay, Talk;
 *   - the page head's "Part N of M", one orange action per view (.gf-cta), Read on rows that open, and "Next part" at the bottom.
 * Optional page data: <script type="application/json" id="gf-parts">{"<tab key>": "one line"}</script> for the Contents lines,
 * and body data-gf-lead / data-gf-join for the join line's words. The Holiday Guide (body.ve-gf without gf-hb) never runs this. */
(function () {
  var D = document, B = D.body;
  if (!B || !B.classList.contains('gf-hb') || D.getElementById('gfBar')) return;
  var top = D.querySelector('.dg-top'), sel = D.getElementById('dgMenuSelect'), menu = D.getElementById('dgMenu');
  var main = D.getElementById('dgMain'), rail = D.getElementById('dgRail');
  if (!top || !main || !sel) return;

  // The one-screen desktop mode (content scrolling inside its own box) is gone: the page scrolls as a page.
  var H = D.documentElement;
  function noFit() { if (H.classList.contains('dg-fit')) H.classList.remove('dg-fit'); if (H.classList.contains('dg-min-on')) H.classList.remove('dg-min-on'); }
  noFit(); new MutationObserver(noFit).observe(H, { attributes: true, attributeFilter: ['class'] });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  // Words with a space between elements and at line breaks ("Free" "for" <br> "everyone" reads "Free for everyone").
  function words(el) {
    if (!el) return ''; var out = [], w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) out.push(n.textContent); else if (n.nodeName === 'BR' || /^(B|SMALL|DIV|SPAN|P)$/.test(n.nodeName)) out.push(' '); }
    return out.join('').replace(/\s+/g, ' ').trim();
  }
  var LINES = {}; try { var lj = D.getElementById('gf-parts'); if (lj) LINES = JSON.parse(lj.textContent) || {}; } catch (e) {}
  var guideName = txt(top.querySelector('.dg-title')) || D.title;
  var gName = rail ? txt(rail.querySelector('.dg-maya-name b')) : '';
  var gFirst = gName.split(' ')[0];
  var gSlug = rail ? rail.getAttribute('data-guide') || '' : '';

  // ---------- the Guide bar ----------
  var bar = D.createElement('header');
  bar.className = 'gf-bar'; bar.id = 'gfBar'; bar.setAttribute('data-k-section', 'guides');
  bar.innerHTML = '<div class="gf-name"><h1 class="gf-h"><a href="' + esc(location.pathname) + '#/">' + esc(guideName) + '</a></h1><span class="gf-join" id="gfJoin"></span>' +
    '<span class="dg-status gf-status" role="status"></span></div>' +
    '<div class="gf-tools"><button type="button" class="gf-cbtn" id="gfCbtn" aria-expanded="false" aria-controls="gfToc"><b>Contents</b><span id="gfCur"></span><i aria-hidden="true"></i></button></div>';
  var stripe = D.createElement('div');
  stripe.className = 'k-stripe gf-stripe'; stripe.setAttribute('aria-hidden', 'true'); stripe.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
  var toc = D.createElement('nav');
  toc.className = 'gf-toc'; toc.id = 'gfToc'; toc.hidden = true; toc.setAttribute('aria-label', guideName + ', contents');
  top.parentNode.insertBefore(bar, top.nextSibling);
  bar.parentNode.insertBefore(stripe, bar.nextSibling);
  stripe.parentNode.insertBefore(toc, stripe.nextSibling);
  var joinEl = D.getElementById('gfJoin'), btn = D.getElementById('gfCbtn'), curEl = D.getElementById('gfCur');
  // Members keep their search: the page's own form, moved (its listeners come with it).
  var sform = D.getElementById('dgSearchForm');
  if (sform) bar.querySelector('.gf-tools').insertBefore(sform, btn);

  // The join line, mirrored from the page's own join box. Every action is a stand-in that clicks the original.
  var box = top.querySelector('.dg-joinbox'), joinBtn0 = box ? box.querySelector('.dg-btn') : null, joinTxt0 = joinBtn0 ? txt(joinBtn0) : '';
  function proxy(orig, label, cls) {
    var a = D.createElement('a');
    a.href = orig.getAttribute('href') && orig.getAttribute('href') !== '#' ? orig.getAttribute('href') : '#';
    a.textContent = label; if (cls) a.className = cls;
    a.addEventListener('click', function (e) { e.preventDefault(); orig.click(); });
    return a;
  }
  function shown(el) { return !!el && getComputedStyle(el).display !== 'none'; }
  function drawJoin() {
    joinEl.textContent = '';
    if (!box || !shown(box)) { joinEl.hidden = true; return; }
    joinEl.hidden = false;
    var price = box.querySelector('.dg-jb-price');
    var lead = B.getAttribute('data-gf-lead') || (price ? words(price).replace(/\.$/, '') + '.' : '');
    if (lead) joinEl.appendChild(D.createTextNode(lead + ' '));
    var jb = box.querySelector('.dg-btn');
    if (jb && shown(jb)) {
      var lab = txt(jb), cfg = B.getAttribute('data-gf-join');
      joinEl.appendChild(proxy(jb, cfg && lab === joinTxt0 ? cfg : lab, 'gf-jgo'));
    }
    var jin = box.querySelector('.dg-jb-in');
    if (jin && shown(jin) && txt(jin)) {
      var s = D.createElement('span'); s.className = 'gf-jin';
      [].forEach.call(jin.childNodes, function (n) {
        if (n.nodeType === 3) s.appendChild(D.createTextNode(n.textContent.replace(/\s+/g, ' ')));
        else if (n.nodeName === 'BR') s.appendChild(D.createTextNode(' '));
        else if (n.nodeName === 'A') s.appendChild(proxy(n, txt(n)));
        else s.appendChild(D.createTextNode(txt(n)));
      });
      joinEl.appendChild(s);
    }
  }
  var joinQ = 0;
  function queueJoin() { if (joinQ) return; joinQ = requestAnimationFrame(function () { joinQ = 0; drawJoin(); }); }
  if (box) new MutationObserver(function (ms) {
    if (ms.every(function (m) { return m.target.closest && m.target.closest('.dg-status') || (m.target.parentNode && m.target.parentNode.closest && m.target.parentNode.closest('.dg-status')); })) return;
    queueJoin();
  }).observe(box, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  new MutationObserver(queueJoin).observe(B, { attributes: true, attributeFilter: ['class'] });

  // ---------- Contents: built from the Guide's own menu ----------
  function parts() {
    var links = menu ? menu.querySelectorAll('a') : [];
    return [].filter.call(sel.options, function (o) { return o.value !== 'search'; }).map(function (o, i) {
      var raw = txt(o);
      var a = links[i], k = o.value;
      return { k: k, label: raw.replace(/^\d+\.\s*/, '').replace(/\s*\(locked\)$/i, ''), locked: /\(locked\)$/i.test(raw), on: o.selected && sel.value === k,
        href: a && a.getAttribute('href') ? a.getAttribute('href') : '#/' + (k === 'overview' ? '' : k) };
    });
  }
  function current() { var P = parts(); for (var i = 0; i < P.length; i++) if (P[i].on) return { i: i, p: P[i], all: P }; return { i: -1, p: null, all: P }; }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function drawToc() {
    var c = current(), P = c.all;
    curEl.textContent = c.p ? c.p.label : 'Search results';
    toc.innerHTML = '<div class="gf-toc-h"><span class="k-label">' + esc(guideName) + ', contents</span><small>' + P.length + ' parts. Press Escape or Contents to close.</small></div><ol>' +
      P.map(function (p, i) {
        var line = LINES[p.k] || '';
        var bits = [line, p.locked ? 'In the full Guide' : '', p.on ? 'You are here' : ''].filter(Boolean).join(' &middot; ');
        return '<li><a href="' + esc(p.href) + '" data-gf-part="' + esc(p.k) + '"' + (p.on ? ' aria-current="page"' : '') + '><i>' + two(i + 1) + '</i><b>' + esc(p.label) + '</b><small>' + bits + '</small></a></li>';
      }).join('') + '</ol>';
  }
  function setToc(open, focusBack) {
    toc.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    if (open) {
      var nav = D.querySelector('.ve-nav'), navB = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0, t = bar.getBoundingClientRect().top;
      if (t < navB) window.scrollTo(0, t + window.scrollY - navB - 8);
      var cur = toc.querySelector('[aria-current]'); if (cur) cur.focus({ preventScroll: true });
    } else if (focusBack) btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', function () { setToc(toc.hidden, false); });
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !toc.hidden) setToc(false, true); });
  toc.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-gf-part]'); if (!a) return;
    e.preventDefault();
    var k = a.getAttribute('data-gf-part'), before = location.hash, h = a.getAttribute('href');
    setToc(false, false);
    // Exactly what the old dropdown did: set it and fire change; fall back to the tab's own link.
    sel.value = k; sel.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(function () { if (location.hash === before && h && h.charAt(0) === '#' && h !== before) location.hash = h; }, 0);
  });
  new MutationObserver(function () { drawToc(); queueDress(); }).observe(sel, { childList: true, subtree: true, attributes: true });
  sel.addEventListener('change', drawToc);
  window.addEventListener('hashchange', function () { setTimeout(drawToc, 0); });

  // ---------- the Guide, once: a row under the page head ----------
  var maya = D.getElementById('dgMaya'), bubble = D.getElementById('dgBubble'), dgPlay = D.getElementById('dgPlay');
  var row = D.createElement('div');
  row.className = 'gf-guide'; row.id = 'gfGuide';
  row.innerHTML = '<span class="gf-gpic" role="img" aria-label="' + esc(gFirst || 'Your Guide') + ', your Guide"></span><p><b>' + esc(gFirst) + (gFirst ? ':' : '') + '</b> <span class="gf-say"></span></p>' +
    '<span class="gf-gacts"><button type="button" class="gf-play" hidden>&#9654; Play</button><button type="button" class="gf-talk" hidden></button></span>';
  var gPic = row.querySelector('.gf-gpic'), gSay = row.querySelector('.gf-say'), gPlay = row.querySelector('.gf-play'), gTalk = row.querySelector('.gf-talk');
  // A view that draws its own Guide panel (the Creator Guide's landing, from ve-gigs.js) lends its line and Play to the row,
  // and its own panel is hidden, so the Guide still appears once.
  function inner() { return txt(bubble) ? null : main.querySelector('.vg-kai-say'); }
  function playSrc() { var k = inner(); if (k) return k.querySelector('button'); if (!dgPlay) return null; return dgPlay.tagName === 'BUTTON' ? dgPlay : dgPlay.querySelector('button'); }
  function drawGuide() {
    var bg = maya ? maya.style.backgroundImage || getComputedStyle(maya).backgroundImage : '';
    if ((!bg || bg === 'none') && window.VEGuideArt && gSlug) bg = "url('" + VEGuideArt(gSlug, 'square') + "')";
    if (bg && bg !== 'none' && gPic.getAttribute('data-bg') !== bg) { gPic.setAttribute('data-bg', bg); gPic.style.backgroundImage = bg; }
    var k = inner(), say = k ? txt(k.querySelector('p')) : txt(bubble);
    if (gSay.textContent !== say) gSay.textContent = say;
    if (row.hidden !== !say) row.hidden = !say;
    var ps = playSrc(), on = !!ps && !ps.hidden && (k ? true : !(dgPlay && dgPlay.hidden)) && !!txt(ps);
    if (gPlay.hidden !== !on) gPlay.hidden = !on;
    var lab = on && /pause|stop/i.test(txt(ps)) ? 'Pause' : 'Play';
    if (gPlay.getAttribute('data-l') !== lab) { gPlay.setAttribute('data-l', lab); gPlay.innerHTML = lab === 'Pause' ? '&#10073;&#10073; Pause' : '&#9654; Play'; }
    var t = rail ? rail.querySelector('[data-vepg-talk]') : null;
    if (gTalk.hidden !== !t) gTalk.hidden = !t;
    if (t && gTalk.textContent !== txt(t)) gTalk.textContent = txt(t);
  }
  gPlay.addEventListener('click', function () { var ps = playSrc(); if (ps) ps.click(); setTimeout(drawGuide, 60); });
  gTalk.addEventListener('click', function () { var t = rail && rail.querySelector('[data-vepg-talk]'); if (t) t.click(); });
  var gq = 0;
  function queueGuide() { if (gq) return; gq = requestAnimationFrame(function () { gq = 0; drawGuide(); }); }
  [bubble, maya, dgPlay, rail, main].forEach(function (el) { if (el) new MutationObserver(queueGuide).observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] }); });

  // ---------- each view: the head, the Guide row, one orange action, Read, Next part ----------
  function sub() { return (location.hash || '').replace(/^#\/?/, '').split('/').slice(1).join('/'); }
  function firstVisible(list) { for (var i = 0; i < list.length; i++) { var r = list[i].getClientRects(); if (r.length && r[0].width) return list[i]; } return list[0] || null; }
  function dress() {
    var c = current();
    // Page head: "Part N of M" on a part's own page (not on a piece inside it, whose crumb says where it is).
    var head = main.querySelector('.dg-head');
    var pn = main.querySelector('.gf-pn');
    if (head && c.p && !sub()) {
      var want = 'Part ' + (c.i + 1) + ' of ' + c.all.length;
      if (!pn || pn.nextElementSibling !== head) { if (pn) pn.remove(); pn = D.createElement('span'); pn.className = 'k-eb pk gf-pn'; head.parentNode.insertBefore(pn, head); }
      if (pn.textContent !== want) pn.textContent = want;
      var k = head.querySelector('.dg-k');
      var dup = !!k && txt(k).toLowerCase() === c.p.label.toLowerCase();
      if (k && k.classList.contains('gf-k-dup') !== dup) k.classList.toggle('gf-k-dup', dup);
    } else if (pn) pn.remove();
    // The Guide row, after the head and its line (or at the top of a view with no head).
    var anchor = head ? (head.nextElementSibling && head.nextElementSibling.classList.contains('dg-lede') ? head.nextElementSibling : head) : null;
    // A landing with its own heading (the Creator Guide's, from ve-gigs.js): the row goes under its title and first line.
    if (!anchor) { var lh = main.querySelector('.vg-land-l > .vg-h'); if (lh) anchor = lh.nextElementSibling && lh.nextElementSibling.tagName === 'P' ? lh.nextElementSibling : lh; }
    if (anchor) { if (anchor.nextElementSibling !== row) anchor.parentNode.insertBefore(row, anchor.nextElementSibling); }
    else {
      var crumb = main.firstElementChild && main.firstElementChild.classList.contains('dg-crumb') ? main.firstElementChild : null;
      var ref = crumb ? crumb.nextElementSibling : main.firstElementChild;
      if (row.parentNode !== main || row.previousElementSibling !== crumb) main.insertBefore(row, ref === row ? row.nextElementSibling : ref);
    }
    // Rows that open but carry no button get one Read button on the right (the same link as their title).
    [].forEach.call(main.querySelectorAll('.dg-srow'), function (r) {
      if (r.querySelector(':scope > .dg-acts, :scope > .gf-read, :scope > .gf-tag')) return;
      var h = r.getAttribute('data-href'), t = r.querySelector('h3');
      if (h) r.insertAdjacentHTML('beforeend', '<a class="gf-read" href="' + esc(h) + '" aria-label="Read: ' + esc(txt(t)) + '">Read</a>');
      // A locked piece says so with a tag in the same place (a status in plain words, never an action).
      else if (/in the full guide/i.test(txt(r))) r.insertAdjacentHTML('beforeend', '<span class="gf-tag">Locked</span>');
    });
    // One orange action per view. A "How to use this page" block's first button is it (it already sits under the head). Otherwise the
    // view's main action (the price box, the gate's join or survey, its first button; with none, the bar's join) gets a stand-in right
    // under the Guide row, the mock's "Start here", that clicks the original; the original stays where it was, white. A form's step
    // button and the price box (first on phones) stay in place.
    var q = function (s) { return firstVisible(main.querySelectorAll(s)); };
    var gs = q('.wg-gs .wg-gs-btns > .dg-btn:not(.dg-ghost)'), pb = q('.dg-pricebox .dg-btn:not(.dg-ghost)');
    var cand = gs || pb || q('.dg-gate .dg-btn:not(.dg-ghost)') || q('.dg-btn:not(.dg-ghost):not(.dg-save):not(.dg-vote):not(.gf-go-a), .vg-btn:not(.ghost)') || q('.vxc-go');
    var inForm = cand && !gs && !pb && cand.closest('form, .vg-form, .vg-field, [data-step]');
    var jb = box && shown(box) ? box.querySelector('.dg-btn') : null;
    var src = gs || pb || inForm ? null : (cand || (jb && shown(jb) ? jb : null));
    var go = main.querySelector('.gf-go'), pick = gs || pb || (inForm ? cand : null);
    if (src && main.firstElementChild && !main.querySelector(':scope > .dg-loading')) {
      var label = txt(src);
      if (!go) { go = D.createElement('div'); go.className = 'gf-go'; }
      if (go._src !== src || go.getAttribute('data-l') !== label) {
        go._src = src; go.setAttribute('data-l', label);
        var h0 = src.getAttribute('href');
        go.innerHTML = '<a class="dg-btn gf-go-a" href="' + esc(h0 && h0 !== '#' ? h0 : '#') + '">' + esc(label) + '</a>';
        go.firstChild.addEventListener('click', function (e) { e.preventDefault(); if (go._src) go._src.click(); });
      }
      // After the Guide row; with no Guide line, after the head; in a view with no Guide head (the Gig Board's walkthrough), after its
      // first title and the line under it.
      var after = !row.hidden && main.contains(row) ? row : anchor;
      if (!after) {
        var t1 = q('h1, h2');
        if (t1) { after = t1; var nx1 = t1.nextElementSibling; if (nx1 && nx1.tagName === 'P') after = nx1; }
      }
      if (after) { if (after.nextElementSibling !== go) after.parentNode.insertBefore(go, after.nextElementSibling); }
      else if (go.parentNode !== main) main.insertBefore(go, main.firstChild);
      pick = go.firstChild;
    } else if (go) go.remove();
    [].forEach.call(main.querySelectorAll('.gf-cta'), function (o) { if (o !== pick) o.classList.remove('gf-cta'); });
    if (pick && !pick.classList.contains('gf-cta')) pick.classList.add('gf-cta');
    // Next part at the bottom (the pager is gone), unless the section's own "See it for yourself" already goes there.
    var nx = main.querySelector(':scope > .gf-next'), next = c.i >= 0 ? c.all[c.i + 1] : null;
    var said = next && [].some.call(main.querySelectorAll('.vxc-go'), function (a) { return a.getAttribute('href') === next.href; });
    if (said || !next || !main.firstElementChild || main.querySelector(':scope > .dg-loading')) { if (nx) nx.remove(); }
    else {
      var html = '<a href="' + esc(next.href) + '" data-gf-part="' + esc(next.k) + '">Next part: ' + esc(next.label) + ' &rsaquo;</a>' + esc(LINES[next.k] || '');
      if (!nx) { nx = D.createElement('p'); nx.className = 'gf-next'; }
      if (nx.getAttribute('data-k') !== next.k) { nx.setAttribute('data-k', next.k); nx.innerHTML = html; }
      if (main.lastElementChild !== nx) main.appendChild(nx);
    }
    drawGuide();
  }
  var dq = 0;
  function queueDress() { if (dq) return; dq = requestAnimationFrame(function () { dq = 0; dress(); }); }
  new MutationObserver(queueDress).observe(main, { childList: true, subtree: true });

  drawJoin(); drawToc(); dress();
})();
