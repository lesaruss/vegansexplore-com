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
 * and body data-gf-lead / data-gf-join for the join line's words. A Guide whose menu is groups of sections (its dropdown lists each
 * group with its sections in small type, the Vegan Events Guide) adds "_kids": {"<section label>": "<section key>"}: Contents then
 * lists each group's sections under it as links, the Contents button names the section too, and Next walks section by section. A Guide whose
 * recording is a video in its rail (the Welcome Guide) adds body data-gf-video: the video opens big when it starts. The Holiday Guide
 * (body.ve-gf without gf-hb) never runs this. A Finder Guide (body.gf-fd, the venue, Supermarket and Dairy Guides) names its Finder parts
 * in gf-parts "_finder" (see the Finder section below); without gf-fd none of it runs. */
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
  var KIDS = LINES._kids || null;
  var guideName = txt(top.querySelector('.dg-title')) || D.title;
  var gName = rail ? txt(rail.querySelector('.dg-maya-name b')) : '';
  var gFirst = gName.split(' ')[0];
  var gSlug = rail ? rail.getAttribute('data-guide') || '' : '';
  // Option C (Sean, 2026-11-18: "I love C... The real thing first, that's the winner for me"; mock /mocks/guide-panel2/c/). Opt-in, piloted on
  // two Guides: body.gf-c. The bar shows who the Guide is for (body data-gf-for) and every part as one visible tab row (sliding on phones), the
  // Contents button and panel are not shown; each view is the title, one short line, the Guide as a small card (data-gf-who names it), ONE
  // orange action with one plain price line beside it (data-gf-price, for visitors), then the real content. The How to use this page and
  // Getting started boxes are hidden (their button becomes the orange action). gf-parts "_c": { "go": { "<part>": [label, href] } } gives a
  // part its orange action when its own content has none to lend (the Airport Guide's airports), and "tiles": ["<part>"] lays that part's
  // rows out as tiles four across (the Nutrition Guide's nutrients). Without gf-c none of this runs and nothing changes.
  var CM = B.classList.contains('gf-c'), CC = CM && LINES._c && typeof LINES._c === 'object' ? LINES._c : {};
  var LOCKI = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';

  // ---------- the Guide bar ----------
  var bar = D.createElement('header');
  bar.className = 'gf-bar'; bar.id = 'gfBar'; bar.setAttribute('data-k-section', 'guides');
  bar.innerHTML = '<div class="gf-name"><h1 class="gf-h"><a href="' + esc(location.pathname) + '#/">' + esc(guideName) + '</a></h1>' +
    (CM && B.getAttribute('data-gf-for') ? '<span class="gf-for">' + esc(B.getAttribute('data-gf-for')) + '</span>' : '') + '<span class="gf-join" id="gfJoin"></span>' +
    '<span class="dg-status gf-status" role="status"></span></div>' +
    (CM ? '<div class="gf-tabwrap"><div class="gf-tabscroll"><nav class="gf-tabs" id="gfTabs" aria-label="' + esc(guideName) + ', parts"></nav></div></div>' : '') +
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
  // Option C (Sean, 2026-11-18: "if you put the search in it, it throws the layout off... make the search box a little smaller so it fits...
  // part of the scroll"): members' search sits small at the end of the tab row and slides with it on phones, so the bar stays slim.
  if (sform) { if (CM) bar.querySelector('.gf-tabscroll').appendChild(sform); else bar.querySelector('.gf-tools').insertBefore(sform, btn); }
  // C: the join and sign-in stay reachable, quietly, at the end of the bar (the price is said once, beside the orange action).
  if (CM) bar.querySelector('.gf-tools').insertBefore(joinEl, btn);
  var tabsEl = CM ? D.getElementById('gfTabs') : null;

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
    if (lead) { var ls = D.createElement('span'); ls.className = 'gf-jlead'; ls.textContent = lead + ' '; joinEl.appendChild(ls); }
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
    var opts = [].filter.call(sel.options, function (o) { return o.value !== 'search'; });
    // A Guide whose members' menu is a group dropdown it draws without redrawing the select (the Pre-Vegan Business and Vegan
    // Restaurant Guides): Contents is read from the dropdown's own links, and choosing one follows its link.
    var dd = menu ? menu.querySelectorAll('.dg-dd-list > a') : [];
    if (dd.length && (dd.length !== opts.length || menu.classList.contains('dg-dd-on'))) return [].map.call(dd, function (a) {
      var h = a.getAttribute('href') || '#/', m = h.match(/^#\/g\/([^/?]+)/), b = a.querySelector('b');
      return { k: m ? m[1] : 'start', label: txt(b || a), locked: false, on: a.getAttribute('aria-current') === 'page', href: h, kids: kidsIn(a), link: true };
    });
    return opts.map(function (o, i) {
      var raw = txt(o);
      var a = links[i], k = o.value;
      return { k: k, label: raw.replace(/^\d+\.\s*/, '').replace(/\s*\(locked\)$/i, ''), locked: /\(locked\)$/i.test(raw), on: o.selected && sel.value === k,
        href: a && a.getAttribute('href') ? a.getAttribute('href') : '#/' + (k === 'overview' ? '' : k), kids: kidsIn(a) };
    });
  }
  // A group's sections, from the small type under it in the Guide's own dropdown (only with "_kids" in gf-parts).
  function kidsIn(a) {
    var sm = KIDS && a ? a.querySelector('small') : null; if (!sm) return [];
    return sm.innerHTML.split(/&middot;|\u00b7/).map(function (h) {
      var t = D.createElement('span'); t.innerHTML = h; var raw = txt(t), label = raw.replace(/^\d+[a-z]\s+/, ''), k = KIDS[raw] || KIDS[label];
      return k ? { k: k, label: label, locked: !!t.querySelector('svg'), href: '#/' + k } : null;
    }).filter(Boolean);
  }
  function curKid() { var s = menu ? menu.querySelector('.dg-dd-sec') : null; return s ? txt(s).replace(/^\u203a\s*/, '') : ''; }
  function current() { var P = parts(); for (var i = 0; i < P.length; i++) if (P[i].on) return { i: i, p: P[i], all: P }; return { i: -1, p: null, all: P }; }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function drawToc() {
    var c = current(), P = c.all;
    var ck = c.p && c.p.kids.length ? curKid() : '';
    // A section inside a group: "Plan it > Kinds" (on phones the section alone, .gf-cur-g is hidden there)
    if (ck) curEl.innerHTML = '<span class="gf-cur-g">' + esc(c.p.label) + ' &rsaquo; </span>' + esc(ck);
    else curEl.textContent = c.p ? c.p.label : 'Search results';
    toc.innerHTML = '<div class="gf-toc-h"><span class="k-label">' + esc(guideName) + ', contents</span><small>' + P.length + ' parts. Press Escape or Contents to close.</small></div><ol>' +
      P.map(function (p, i) {
        var line = LINES[p.k] || '';
        var bits = [line, p.locked ? 'In the full Guide' : '', p.on ? 'You are here' : ''].filter(Boolean).join(' &middot; ');
        var here = p.on && !ck;
        if (p.kids.length) bits = [line, here ? 'You are here' : ''].filter(Boolean).join(' &middot; ');
        var pt = progPart(p.k); if (pt) bits = [bits, '<span class="gf-tst' + (pt.done ? ' on' : '') + '">' + esc(pt.tag) + '</span>'].filter(Boolean).join(' &middot; ');
        return '<li><a href="' + esc(p.href) + '" data-gf-part="' + esc(p.k) + '"' + (p.link ? ' data-gf-link' : '') + (p.on && (here || !p.kids.length) ? ' aria-current="page"' : '') + '><i>' + two(i + 1) + '</i><b>' + esc(p.label) + '</b><small>' + bits + '</small></a>' +
          (p.kids.length ? '<p class="gf-kids">' + p.kids.map(function (x) {
            var on = p.on && x.label === ck;
            return '<a href="' + esc(x.href) + '" data-gf-kid="' + esc(x.k) + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(x.label) + (x.locked ? ' <span class="gf-lk">Locked</span>' : '') + '</a>';
          }).join('') + '</p>' : '') + '</li>';
      }).join('') + '</ol>';
    if (tabsEl) drawTabs(c);
  }
  // C: every part as one visible tab row, the current one marked, a small lock on the parts that open with the full Guide.
  function drawTabs(c) {
    var h = c.all.map(function (p) {
      return '<a href="' + esc(p.href) + '" data-gf-part="' + esc(p.k) + '"' + (p.link ? ' data-gf-link' : '') + (p.on ? ' aria-current="page"' : '') + (p.k === 'join' ? ' class="gf-tjoin"' : '') +
        (p.locked ? ' aria-label="' + esc(p.label) + ', in the full Guide"' : '') + '>' + esc(p.label) + (p.locked ? LOCKI : '') + '</a>';
    }).join('');
    if (tabsEl.getAttribute('data-h') === h) return;
    tabsEl.setAttribute('data-h', h); tabsEl.innerHTML = h;
    // On phones the row slides: the current part is brought into view.
    var on = tabsEl.querySelector('[aria-current]');
    if (on && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollLeft = Math.max(0, on.offsetLeft - 16);
  }
  // Choosing a part does exactly what the old dropdown did: set it and fire change; fall back to the tab's own link.
  function goPart(a) {
    var k = a.getAttribute('data-gf-part'), before = location.hash, h = a.getAttribute('href');
    if (a.hasAttribute('data-gf-link')) { if (h && h !== before) location.hash = h; return; }
    sel.value = k; sel.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(function () { if (location.hash === before && h && h.charAt(0) === '#' && h !== before) location.hash = h; }, 0);
  }
  if (tabsEl) tabsEl.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-gf-part]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); goPart(a);
  });
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
    if (e.target.closest('a[data-gf-kid]')) { setToc(false, false); return; }
    var a = e.target.closest('a[data-gf-part]'); if (!a) return;
    e.preventDefault();
    setToc(false, false);
    goPart(a);
  });
  new MutationObserver(function () { drawToc(); queueDress(); }).observe(sel, { childList: true, subtree: true, attributes: true });
  if (KIDS && menu) new MutationObserver(function () { drawToc(); queueDress(); }).observe(menu, { childList: true });
  sel.addEventListener('change', drawToc);
  window.addEventListener('hashchange', function () { setTimeout(drawToc, 0); });

  // ---------- the Guide, once: a row under the page head ----------
  var maya = D.getElementById('dgMaya'), bubble = D.getElementById('dgBubble'), dgPlay = D.getElementById('dgPlay');
  var row = D.createElement('div');
  row.className = 'gf-guide'; row.id = 'gfGuide';
  var gWho = CM ? B.getAttribute('data-gf-who') || gFirst : '';
  row.innerHTML = '<span class="gf-gpic" role="img" aria-label="' + esc(gFirst || 'Your Guide') + ', your Guide"></span>' +
    (CM ? '<p><b class="gf-who">' + esc(gWho) + '</b><span class="gf-say"></span></p>' : '<p><b>' + esc(gFirst) + (gFirst ? ':' : '') + '</b> <span class="gf-say"></span></p>') +
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
    var ps = playSrc(), on = !!ps && !ps.hidden && (k ? true : !(dgPlay && dgPlay.hidden)) && !!txt(ps);
    // C: a view whose line has no recording may show the mock's shorter line (gf-parts "_c.say"); a recorded line stays word for word.
    if (CM && !on && say && CC.say) { var cc = current(); if (cc.p && !sub() && CC.say[cc.p.k]) say = CC.say[cc.p.k]; }
    if (gSay.textContent !== say) gSay.textContent = say;
    if (row.hidden !== !say) row.hidden = !say;
    if (gPlay.hidden !== !on) gPlay.hidden = !on;
    var lab = on && /pause|stop/i.test(txt(ps)) ? 'Pause' : 'Play';
    if (gPlay.getAttribute('data-l') !== lab) { gPlay.setAttribute('data-l', lab); gPlay.innerHTML = lab === 'Pause' ? '&#10073;&#10073; Pause' : '&#9654; Play'; }
    var t = rail ? rail.querySelector('[data-vepg-talk]') : null;
    if (gTalk.hidden !== !t) gTalk.hidden = !t;
    if (t && gTalk.textContent !== txt(t)) gTalk.textContent = txt(t);
  }
  gPlay.addEventListener('click', function () { var ps = playSrc(); if (ps) ps.click(); setTimeout(drawGuide, 60); });
  gTalk.addEventListener('click', function () { var t = rail && rail.querySelector('[data-vepg-talk]'); if (t) t.click(); });
  // Opt-in (body data-gf-video, the Welcome Guide): the Guide's recording is a video in its rail box (#dgMaya), and the rail is hidden.
  // When that video starts, it opens big instead, through the page's own Expand (.hg-expand: a lightbox with controls and captions that
  // picks up where the frame was), so Play still plays only when pressed and the video is seen. Guides without the attribute are unchanged.
  if (B.hasAttribute('data-gf-video')) D.addEventListener('play', function (e) {
    var v = e.target, ex = maya && maya.querySelector('.hg-expand');
    if (!v || v.tagName !== 'VIDEO' || !rail || !rail.contains(v) || !ex) return;
    v.pause(); ex.click();
  }, true);
  var gq = 0;
  function queueGuide() { if (gq) return; gq = requestAnimationFrame(function () { gq = 0; drawGuide(); }); }
  [bubble, maya, dgPlay, rail, main].forEach(function (el) { if (el) new MutationObserver(queueGuide).observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] }); });

  // ---------- each view: the head, the Guide row, one orange action, Read, Next part ----------
  function sub() { return (location.hash || '').replace(/^#\/?/, '').split('/').slice(1).join('/'); }
  function firstVisible(list) { for (var i = 0; i < list.length; i++) { if (list[i].classList.contains('gf-dup')) return list[i]; var r = list[i].getClientRects(); if (r.length && r[0].width) return list[i]; } return list[0] || null; }
  // Opt-in (body data-gf-head-go, the Vegan Events Guide): when the view's main action is a button in its page head, the stand-in under
  // the Guide row is the only copy shown (the original is hidden with .gf-dup and still clicked), so the action is not shown twice.
  var HEADGO = B.hasAttribute('data-gf-head-go');
  function dress() {
    var c = current();
    if (CM) cPrep(c);
    // Page head: "Part N of M" on a part's own page (not on a piece inside it, whose crumb says where it is). C shows the parts in the bar instead.
    var head = main.querySelector('.dg-head');
    var pn = main.querySelector('.gf-pn');
    // A group's own page (#/g/<group>, grouped Guides only) is a part's page too.
    if (!CM && head && c.p && (!sub() || (KIDS && /^#\/g\/[^/]+$/.test(location.hash)))) {
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
    // Finder Guides (body.gf-fd): a view whose title is not in a .dg-head (the venue Guides' Overview hero) gets the row under its title and line.
    if (!anchor && FD) { var oh = main.querySelector('.ov-hero > .dg-h1, .ov-hero > .gf-ch > .dg-h1'); if (oh) anchor = oh.nextElementSibling && oh.nextElementSibling.classList.contains('dg-lede') ? oh.nextElementSibling : oh; }
    if (anchor) { if (anchor.nextElementSibling !== row) anchor.parentNode.insertBefore(row, anchor.nextElementSibling); }
    else {
      var crumb = main.firstElementChild && main.firstElementChild.classList.contains('dg-crumb') ? main.firstElementChild : null;
      var ref = crumb ? crumb.nextElementSibling : main.firstElementChild;
      if (row.parentNode !== main || row.previousElementSibling !== crumb) main.insertBefore(row, ref === row ? row.nextElementSibling : ref);
    }
    // Rows that open but carry no button get one Read button on the right (the same link as their title).
    [].forEach.call(main.querySelectorAll('.dg-srow'), function (r) {
      // C: a piece that is free to try says so in the tag's place, on the right (its own "Free to try" tag, moved there).
      var fr = CM ? r.querySelector(':scope > .dg-srow-b > .dg-free') : null;
      if (fr && !r.querySelector(':scope > .dg-acts')) { fr.classList.add('gf-tag', 'gf-free'); r.appendChild(fr); }
      if (r.querySelector(':scope > .dg-acts, :scope > .gf-read, :scope > .gf-tag, :scope > .dg-free')) return;
      var h = r.getAttribute('data-href'), t = r.querySelector('h3');
      if (h) r.insertAdjacentHTML('beforeend', '<a class="gf-read" href="' + esc(h) + '" aria-label="Read: ' + esc(txt(t)) + '">Read</a>');
      // A locked piece says so with a tag in the same place (a status in plain words, never an action).
      else if (/in the full guide/i.test(txt(r))) r.insertAdjacentHTML('beforeend', CM ? '<span class="gf-tag gf-lock">' + LOCKI + ' Full Guide</span>' : '<span class="gf-tag">Locked</span>');
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
    // C: the How to use this page box is hidden, so its button is lent to the stand-in like any other view's main action.
    var gsIn = CM ? null : gs;
    var src = gsIn || pb || inForm ? null : (cand || (jb && shown(jb) ? jb : null));
    // C: a part named in gf-parts "_c.go" has its own orange action (a link), when its content has none to lend.
    var cgo = CM && c.p && !sub() && CC.go && CC.go[c.p.k] ? CC.go[c.p.k] : null;
    if (cgo) src = null;
    var cont = drawProg(c, outer(row.hidden || !main.contains(row) ? anchor : row));
    if (cont) src = null;
    // A Finder part (opt-in, body.gf-fd): its Search is the view's one orange action, drawn after the Guide row.
    var fdGo = FD ? fdDraw(c, outer(!row.hidden && main.contains(row) ? row : anchor)) : null;
    if (fdGo) src = null;
    if (cgo) fdGo = null;
    var go = main.querySelector('.gf-go:not(.gf-cont)'), pick = cont || fdGo || gsIn || pb || (inForm ? cand : null);
    if (HEADGO || FD) [].forEach.call(main.querySelectorAll('.gf-dup'), function (o) { if (o !== src) o.classList.remove('gf-dup'); });
    if ((HEADGO || FD) && src && src.closest('.dg-head') && !src.classList.contains('gf-dup')) src.classList.add('gf-dup');
    // Finder Guides: the Overview hero's own copy of its main action is hidden; the orange stand-in under the Guide row clicks it.
    if (FD && src && src.closest('.ov-hero') && !src.classList.contains('gf-dup')) src.classList.add('gf-dup');
    if ((src || cgo) && main.firstElementChild && !main.querySelector(':scope > .dg-loading')) {
      var label = cgo ? cgo[0] : txt(src);
      if (!go) { go = D.createElement('div'); go.className = 'gf-go'; }
      if (cgo) {
        if (go.getAttribute('data-l') !== label + '|' + cgo[1]) { go._src = null; go.setAttribute('data-l', label + '|' + cgo[1]); go.innerHTML = '<a class="dg-btn gf-go-a" href="' + esc(cgo[1]) + '">' + esc(label) + '</a>'; }
      } else if (go._src !== src || go.getAttribute('data-l') !== label) {
        go._src = src; go.setAttribute('data-l', label);
        var h0 = src.getAttribute('href');
        go.innerHTML = '<a class="dg-btn gf-go-a" href="' + esc(h0 && h0 !== '#' ? h0 : '#') + '">' + esc(label) + '</a>';
        go.firstChild.addEventListener('click', function (e) { e.preventDefault(); if (go._src) go._src.click(); });
      }
      // After the Guide row; with no Guide line, after the head; in a view with no Guide head (the Gig Board's walkthrough), after its
      // first title and the line under it.
      var after = !row.hidden && main.contains(row) ? row : anchor;
      // With progress (opt-in), the stand-in follows the meter, as in the mock.
      if (after && after.nextElementSibling && after.nextElementSibling.classList.contains('gf-prog')) after = after.nextElementSibling;
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
    // Grouped: a group's page goes to its first section, a section to the next one, the last section to the next group.
    if (c.p && c.p.kids.length) {
      var ck2 = curKid(), ki = -1; c.p.kids.forEach(function (x, n) { if (x.label === ck2) ki = n; });
      if (ki < c.p.kids.length - 1) next = c.p.kids[ki + 1];
    }
    var said = next && [].some.call(main.querySelectorAll('.vxc-go'), function (a) { return a.getAttribute('href') === next.href; });
    if (said || !next || !main.firstElementChild || main.querySelector(':scope > .dg-loading')) { if (nx) nx.remove(); }
    else {
      var html = '<a href="' + esc(next.href) + '" data-gf-part="' + esc(next.k) + '">Next part: ' + esc(next.label) + ' &rsaquo;</a>' + esc(typeof LINES[next.k] === 'string' ? LINES[next.k] : '');
      if (!nx) { nx = D.createElement('p'); nx.className = 'gf-next'; }
      if (nx.getAttribute('data-k') !== next.k) { nx.setAttribute('data-k', next.k); nx.innerHTML = html; }
      if (main.lastElementChild !== nx) main.appendChild(nx);
    }
    // Finder cards read like the mock's (Sean, 2026-11-17: "This doesn't feel like the style I approved"): the access tag moves off
    // the picture into the tags (words never on the picture), and each card ends in one button on the right.
    if (B.classList.contains('gf-fd') && !CM) [].forEach.call(main.querySelectorAll('.sa-vcard'), function (c) {
      var b = c.querySelector('.sa-vbadge'), t = c.querySelector('.sa-vtags');
      if (b && t) { while (b.lastChild) t.insertBefore(b.lastChild, t.firstChild); b.remove(); }
      if (!c.querySelector('.fd-open')) { var s = D.createElement('span'); s.className = 'fd-open'; s.textContent = 'Open'; c.appendChild(s); }
    });
    if (CM) { cFinish(c, go, pick); cOverview(c); }
    drawGuide();
  }

  // ---------- Option C (opt-in: body.gf-c) ----------
  // A Handbook Guide's Overview in C: the real content first. Its article rows (.wg-arts) become the mock's "Also in this Guide": one
  // numbered tile per part, the whole tile the same link the row had, one tag on the right (Open, or Full Guide), no buttons. With
  // gf-parts "_c.hero" (the Nutrition Guide's nutrients) a hero of tiles comes first, read from the page's own public JSON:
  //   { "label", "json": "<script id>", "list": "titles", "free": "example", "abbr": { id: "B12" }, "href": "#/nutrients/", "part": "#/nutrients" }
  // and that part's row is left out of the list (the hero is it). The old rows stay in the page, hidden.
  function cOverview(c) {
    var arts = c.p && c.p.k === 'overview' && !sub() ? main.querySelector(':scope > .wg-arts') : null;
    if (!arts || arts.hasAttribute('data-gf-c')) return;
    arts.setAttribute('data-gf-c', '');
    var jb = box && shown(box) ? box.querySelector('.dg-btn') : null, visitor = !!(jb && shown(jb));
    var tagOpen = '<span class="gf-tag gf-free gf-open">Open</span>', tagLock = '<span class="gf-tag gf-lock">' + LOCKI + ' Full Guide</span>';
    var h = '', H = CC.hero, data = null;
    try { data = H && JSON.parse(D.getElementById(H.json).textContent); } catch (e) { data = null; }
    if (H && data && data[H.list || 'titles']) {
      var ex = data[H.free || 'example'] || {};
      h += '<section class="gf-cov gf-cov-hero"><span class="k-label">' + esc(H.label || '') + '</span><div class="gf-ntiles">' + data[H.list || 'titles'].map(function (t) {
        var id = t[0], free = id === ex.id, open = free || !visitor;
        return '<a class="gf-ntile' + (free ? ' gf-nfree' : '') + '" href="' + esc((H.href || '#/') + id) + '"><span class="gf-nab">' + esc((H.abbr || {})[id] || t[1].slice(0, 2)) + '</span>' +
          '<span class="gf-nt"><b>' + esc(t[1]) + '</b>' + (free && ex.short ? '<small>' + esc(ex.short) + '</small>' : '') + '</span>' +
          (free && visitor ? '<span class="gf-tag gf-free">Free</span>' : open ? tagOpen : tagLock) + '</a>';
      }).join('') + '</div></section>';
    }
    var rows = [].map.call(arts.querySelectorAll('.wg-art'), function (r) {
      var a = r.querySelector('.wg-art-t'), p = r.querySelector('p'), more = r.querySelector('.wg-art-more');
      var href = a ? a.getAttribute('href') : '', words = p ? txt(p) : '';
      var locked = /in the full guide\.?$/i.test(words) || (!!more && !/^open/i.test(txt(more)));
      var n = 0; c.all.forEach(function (x, i) { if (x.href === href || '#/' + x.k === href) n = i; });
      return { href: href, title: txt(a), words: words.replace(/\s*In the full Guide\.?$/i, ''), locked: locked, n: n };
    }).filter(function (r) { return r.href && !(H && H.part && r.href === H.part); });
    if (rows.length) h += '<section class="gf-cov"><span class="k-label">Also in this Guide</span><div class="gf-ptiles">' + rows.map(function (r, i) {
      return '<a class="k-row gf-ptile" href="' + esc(r.href) + '"><span class="k-num pk">' + (r.n || i + 1) + '</span><span class="gf-ptt"><b>' + esc(r.title) + '</b>' +
        (r.words ? '<small class="k-clamp">' + esc(r.words) + '</small>' : '') + '</span>' + (r.locked ? tagLock : tagOpen) + '</a>';
    }).join('') + '</div></section>';
    if (!h) return;
    arts.insertAdjacentHTML('beforebegin', h);
    arts.classList.add('gf-c-hidden');
  }
  // The element a placement should follow: the C head block when the element sits inside it.
  function outer(el) { return el && el.parentNode && el.parentNode.classList && el.parentNode.classList.contains('gf-ch') ? el.parentNode : el; }
  // Before placing: one short line under the title. A view whose only words sat in its hidden How to use box lends that box's first
  // sentence; a long line shows its first sentence (the rest stays in the page, not shown). Never new words.
  function firstSentence(t) { var m = t.match(/^[\s\S]{30,}?[.!?](?=\s)/); return m && m[0].length < t.length - 1 ? m[0] : ''; }
  function cPrep(c) {
    var head = main.querySelector(':scope > .dg-head, :scope > .gf-ch > .dg-head');
    if (head && !(head.nextElementSibling && head.nextElementSibling.classList.contains('dg-lede'))) {
      var gp = main.querySelector('.wg-gs .wg-gs-b > p');
      var f = gp ? txt(gp) : '';
      if (f) { var fs = firstSentence(f) || f; var lp = D.createElement('p'); lp.className = 'dg-lede gf-c-lede'; lp.textContent = fs; head.parentNode.insertBefore(lp, head.nextElementSibling); }
    }
    [].forEach.call(main.querySelectorAll(':scope > .dg-head + .dg-lede:not([data-gf-c]), :scope > .gf-ch > .dg-head + .dg-lede:not([data-gf-c]), .ov-hero > .dg-h1 + .dg-lede:not([data-gf-c]), .gf-ch > .dg-h1 + .dg-lede:not([data-gf-c])'), function (ld) {
      ld.setAttribute('data-gf-c', '');
      if (ld.children.length || ld.classList.contains('gf-c-lede')) return;
      var t = ld.textContent, f = t.length > 110 ? firstSentence(t) : '';
      if (f) { ld.textContent = f; var more = D.createElement('span'); more.className = 'gf-c-more'; more.hidden = true; more.textContent = t.slice(f.length); ld.appendChild(more); }
    });
    // A part named in "_c.tiles" lays its rows out as tiles (the mock's nutrients).
    var tl = !!(c.p && !sub() && (CC.tiles || []).indexOf(c.p.k) >= 0);
    if (main.classList.contains('gf-tiles') !== tl) main.classList.toggle('gf-tiles', tl);
  }
  // After placing: the head block (title, line, the Guide's card beside it, the one orange action with its price line), and the Finder
  // cards as the mock's (code, name, one tag on the right).
  var PRICE = B.getAttribute('data-gf-price') || '';
  function cFinish(c, go, pick) {
    var t = main.querySelector('.dg-head') || main.querySelector('.ov-hero > .dg-h1, .ov-hero > .gf-ch > .dg-h1');
    if (t && main.contains(t)) {
      var par = t.parentNode, wrap = par.classList.contains('gf-ch') ? par : null;
      var grp = [t], n = t.nextElementSibling;
      if (wrap) n = t.nextElementSibling;
      while (n && (n.classList.contains('dg-lede') || n === row || n.classList.contains('gf-go') || n.classList.contains('gf-prog'))) { grp.push(n); n = n.nextElementSibling; }
      if (!wrap) { wrap = D.createElement('div'); wrap.className = 'gf-ch'; par.insertBefore(wrap, t); grp.forEach(function (e) { wrap.appendChild(e); }); }
      var top = wrap.parentNode === main;
      if (wrap.classList.contains('gf-ch-top') !== top) wrap.classList.toggle('gf-ch-top', top);
      var g = !row.hidden && wrap.contains(row);
      if (wrap.classList.contains('gf-ch-g') !== g) wrap.classList.toggle('gf-ch-g', g);
    }
    // The one plain price line beside the orange action, for visitors (while the bar's join is offered).
    var jb = box && shown(box) ? box.querySelector('.dg-btn') : null;
    var pr = go && go.parentNode ? go.querySelector('.gf-price') : null;
    var want = !!(PRICE && go && go.parentNode && pick === go.firstChild && jb && shown(jb));
    if (want && !pr) { pr = D.createElement('p'); pr.className = 'gf-price'; pr.innerHTML = esc(PRICE).replace(/(\$\d+ once, or [\d,]+ points)/, '<b>$1</b>'); go.appendChild(pr); }
    else if (!want && pr) pr.remove();
    // Finder cards: the airport's code big over its name, the access tag on the right (locked reads Full Guide), nothing on the picture.
    if (FD) {
      var items = fdItems() || [];
      [].forEach.call(main.querySelectorAll('.sa-vcard'), function (a) {
        if (a.hasAttribute('data-gf-c')) return;
        a.setAttribute('data-gf-c', '');
        var slug = (a.getAttribute('href') || '').split('/').pop(), v = items.filter(function (x) { return x.slug === slug; })[0];
        var code = v && v.teams && v.teams.length === 1 && /^[A-Z0-9]{3,4}$/.test(v.teams[0]) ? v.teams[0] : '';
        var body = a.querySelector('.sa-vbody');
        if (code && body) body.insertAdjacentHTML('afterbegin', '<span class="fd-code">' + esc(code) + '</span>');
        var bd = a.querySelector('.sa-vbadge'), tag = bd ? bd.querySelector('.dg-tag') : null;
        if (tag) {
          if (tag.classList.contains('sa-tag-lock')) tag.innerHTML = LOCKI + ' Full Guide';
          tag.classList.add('fd-acc'); a.appendChild(tag);
          if (tag.classList.contains('sa-tag-free')) a.classList.add('fd-free');
        }
        if (bd) bd.remove();
      });
    }
  }
  var dq = 0;
  function queueDress() { if (dq) return; dq = requestAnimationFrame(function () { dq = 0; dress(); }); }
  new MutationObserver(queueDress).observe(main, { childList: true, subtree: true });

  // ---------- progress (opt-in: body data-gf-progress; the business Guides, mock /mocks/guide-templates/handbook/?v=progress) ----------
  // The page names what counts with window.gfProgress(ctx), which returns (or resolves to) { path, contents, here }:
  //   contents  { "<part key>": { done, tag } }, a part's status in Contents ("Done", "Opened", "Not yet");
  //   here      the view's own track { title, unit, note, cont, steps: [{ k, label, href, done, tag }] }: the meter
  //             "Your progress: N of M", a Done / Not yet tag on each row that links to a step, and "Continue: <next>" as the view's
  //             one orange action (cont: false keeps the view's own action). Nothing is drawn until at least one step is done.
  // Progress is only ever what the Guide really tracks (read through the calls the Guide already makes), or, where it tracks nothing,
  // the views this browser opened: a view counts as opened once the visitor has been on it for a moment and moved on (never on landing).
  var PG = B.hasAttribute('data-gf-progress') ? { res: null, seq: 0, path: '' } : null;
  function hpath() { return (location.hash || '').replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '') || 'overview'; }
  var OPK = 'gf-opened:' + location.pathname.replace(/\.html$/, '');
  function openedAll() { try { return JSON.parse(localStorage.getItem(OPK) || '{}') || {}; } catch (e) { return {}; } }
  function progPart(k) { var r = PG && PG.res; return r && r.contents && r.path === hpath() && r.any ? r.contents[k] || null : null; }
  function ctxNow() {
    var c = current();
    return { path: hpath(), part: c.p ? c.p.k : '', member: B.classList.contains('dg-member'), opened: function (k) { return !!openedAll()[k]; },
      token: function () { var a = window.VEAuth; try { return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; } catch (e) { return null; } },
      json: function (id) { try { return JSON.parse(D.getElementById(id).textContent); } catch (e) { return null; } } };
  }
  function queueProg() {
    if (!PG || typeof window.gfProgress !== 'function') return;
    var my = ++PG.seq, x = ctxNow();
    Promise.resolve().then(function () { return window.gfProgress(x); }).then(function (r) {
      if (my !== PG.seq) return;
      if (r) { r.path = x.path; r.any = !!r.any || Object.keys(r.contents || {}).some(function (k) { return r.contents[k].done; }); }
      PG.res = r || null; drawToc(); queueDress();
    }).catch(function () {});
  }
  // The row a step's link sits in (a kit row, a gate card, a group tile), never the frame's own links.
  function stepRows(href) {
    var out = [];
    [].forEach.call(main.querySelectorAll('[data-href="' + href + '"], a[href="' + href + '"]'), function (a) {
      if (a.closest('.gf-next, .gf-go, .gf-prog, .dg-crumb, .dg-btns, .dg-start, .rg-fixnav, .gf-guide')) return;
      var r = a.matches('.dg-srow, .pv-gate, .rg-gtile, .wg-art, .dg-tile') ? a : a.closest('.dg-srow, .pv-gate, .rg-gtile, .wg-art, .dg-tile');
      if (r && out.indexOf(r) < 0) out.push(r);
    });
    return out;
  }
  function drawProg(c, after) {
    if (!PG) return null;
    var r = PG.res, here = r && r.path === hpath() ? r.here : null, box = main.querySelector('.gf-prog'), ct = main.querySelector('.gf-cont');
    var steps = here && here.steps || [], n = steps.filter(function (s) { return s.done; }).length;
    [].forEach.call(main.querySelectorAll('.gf-st'), function (t) { if (!steps.length || !n) { var rr = t.closest('.gf-has-st'); if (rr) rr.classList.remove('gf-has-st'); t.remove(); } });
    if (!steps.length || !n || main.querySelector(':scope > .dg-loading')) { if (box) box.remove(); if (ct) ct.remove(); return null; }
    var t = '<p class="gf-prog-t">' + esc(here.title || 'Your progress') + ': <b>' + n + ' of ' + steps.length + '</b>' + (here.unit ? ' ' + esc(here.unit) : '') +
      (here.note ? '<small>' + esc(here.note) + '</small>' : '') + '</p><div class="gf-meter" aria-hidden="true" style="grid-template-columns:repeat(' + steps.length + ',minmax(0,1fr))">' +
      steps.map(function (s) { return '<i' + (s.done ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
    if (!box) { box = D.createElement('div'); box.className = 'gf-prog'; box.setAttribute('role', 'status'); }
    if (box.getAttribute('data-t') !== t) { box.setAttribute('data-t', t); box.innerHTML = t; }
    if (after && after.parentNode) { if (after.nextElementSibling !== box) after.parentNode.insertBefore(box, after.nextElementSibling); }
    else if (box.parentNode !== main) main.insertBefore(box, main.firstChild);
    // A tag on each row that links to a step: Done (or Opened) and Not yet, on the right where Read was.
    steps.forEach(function (s) {
      if (!s.href) return;
      stepRows(s.href).forEach(function (row) {
        var tag = row.querySelector('.gf-st[data-k="' + s.k + '"]'), lab = s.done ? s.tag || 'Done' : 'Not yet';
        if (!tag) {
          tag = D.createElement('span'); tag.className = 'gf-tag gf-st'; tag.setAttribute('data-k', s.k);
          var acts = row.querySelector(':scope > .dg-acts');
          if (acts) acts.insertBefore(tag, acts.firstChild); else row.appendChild(tag);
          row.classList.add('gf-has-st');
        }
        if (tag.getAttribute('data-l') !== lab) { tag.setAttribute('data-l', lab); tag.classList.toggle('on', !!s.done); tag.innerHTML = (s.done ? '&#10003; ' : '') + esc(lab); }
      });
    });
    // Continue: the first step not done yet, unless the view keeps its own action or that step is this view.
    var nx = null; steps.some(function (s) { if (!s.done) { nx = s; return true; } return false; });
    var here0 = '#/' + (hpath() === 'overview' ? '' : hpath());
    if (here.cont === false || !nx || !nx.href || nx.href === here0 || (nx.href === '#/' && hpath() === 'overview')) { if (ct) ct.remove(); return null; }
    var lab = 'Continue: ' + nx.label;
    if (!ct) { ct = D.createElement('div'); ct.className = 'gf-go gf-cont'; }
    if (ct.getAttribute('data-l') !== lab + nx.href) { ct.setAttribute('data-l', lab + nx.href); ct.innerHTML = '<a class="dg-btn gf-cta" href="' + esc(nx.href) + '">' + esc(lab) + '</a>'; }
    if (box.nextElementSibling !== ct) box.parentNode.insertBefore(ct, box.nextElementSibling);
    return ct.firstChild;
  }
  if (PG) {
    var vStart = Date.now(), vKey = hpath(), wasMember = B.classList.contains('dg-member');
    var markOpened = function () {
      if (Date.now() - vStart < 1500 || main.querySelector(':scope > .dg-loading')) return;
      var o = openedAll(); if (o[vKey]) return; o[vKey] = Date.now();
      try { localStorage.setItem(OPK, JSON.stringify(o)); } catch (e) {}
    };
    window.addEventListener('hashchange', function () { markOpened(); vKey = hpath(); vStart = Date.now(); queueProg(); });
    window.addEventListener('pagehide', markOpened);
    D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') markOpened(); });
    new MutationObserver(function () { var m = B.classList.contains('dg-member'); if (m !== wasMember) { wasMember = m; queueProg(); } }).observe(B, { attributes: true, attributeFilter: ['class'] });
    // A Guide's own ticks (Mark done) change what counts: read again after a click inside the view.
    main.addEventListener('click', function (e) { if (e.target.closest('[data-tick], [data-step], [data-save]')) setTimeout(queueProg, 900); });
    window.gfProgressRefresh = queueProg;
  }

  // ---------- Finder (opt-in: body.gf-fd and "_finder" in gf-parts; the Finder Guides, mock /mocks/guide-templates/finder/) ----------
  // A part named in "_finder" opens as the Finder: the search block (City or ZIP, Near me, Search as the view's one orange action), one
  // sentence that says what is there (worked out from the Guide's own list, never written by hand), answer chips that filter it, the one
  // list the Guide already draws, "That is every ... so far", and the doorway after it. The Guide's own city dropdown is set to every city
  // and hidden: the search replaces it. Near me, a ZIP and a typed city use the Directory's own Near me (VERegionDirectory.near); the
  // places are matched by their city, read the way universal search reads a place. The address carries ?q= and ?show=.
  // Config per part: { list, card, reset, noun: [one, many], unit: [one, many], count, free, chips: [[label, test, phrase|noun]],
  //   placeholder, radius, empty: [title, line, button, href], after: { label, title, line, btn: [text, href] } }.
  //   A chip's test is a field of the item ("free", "last": shown when truthy) or a route ("#/venues/stadiums", the Guide's own filter).
  var FD = B.classList.contains('gf-fd') && LINES._finder ? LINES._finder : null;
  var FDS = { q: '', mode: '', origin: null, label: '', show: '', pts: null, ptsP: null, matches: null, wantNear: false, seq: 0 };
  var FD_SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var FD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  function fdNear() { return window.VERegionDirectory && VERegionDirectory.near; }
  function fdCfg(c) {
    if (!FD || !c.p) return null;
    var f = FD[c.p.k]; if (!f) return null;
    var s = sub(); if (s && (f.subs || []).indexOf(s) < 0) return null;
    return f;
  }
  function fdParams() { return new URLSearchParams(location.search); }
  function fdSetUrl(k, v) {
    var P = fdParams(); if (v) P.set(k, v); else P.delete(k);
    var q = P.toString(); history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + location.hash);
  }
  function fdN(n, w) { return n + ' ' + (n === 1 ? w[0] : w[1]); }
  // How far, said honestly: a point read from the item's city is "in <city>" when close, else "about N mi" (rounded to 5).
  function fdFar(v, d) {
    var pt = FDS.pts && FDS.pts[v.slug];
    if (pt && pt.approx) return d < 15 ? 'in ' + pt.city : 'about ' + (Math.max(5, Math.round(d / 5) * 5)).toLocaleString('en-US') + ' mi away';
    return fdMiles(d) + ' away';
  }
  function fdMiles(mi) { return (mi < 10 ? Math.max(0.1, Math.round(mi * 10) / 10).toFixed(1) : Math.round(mi).toLocaleString('en-US')) + ' mi'; }
  function fdHav(a, b) {
    var R = 3958.7613, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  // A place's point, read the way universal search reads it (ve_search_core's place), kept for the visit.
  function fdPlace(text) {
    return fetch(FD_SB + '/rest/v1/rpc/ve_search_core', { method: 'POST', headers: { apikey: FD_ANON, Authorization: 'Bearer ' + FD_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_q: String(text).toLowerCase(), p_limit: 1 }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { var it = d && d.interpretation, pl = it && it.place; return pl && isFinite(pl.lat) && isFinite(pl.lng) && !String(it.terms || '').trim() ? { lat: +pl.lat, lng: +pl.lng } : null; })
      .catch(function () { return null; });
  }
  // Every item's point, from its city: one lookup per city, kept in this tab.
  function fdPoints(items) {
    if (FDS.ptsP) return FDS.ptsP;
    var KEY = 'gf_fd_pts', cache = {}; try { cache = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    var cities = {};
    items.forEach(function (v) { if (v.city) cities[v.city + (v.state ? ', ' + v.state : '')] = 1; });
    FDS.ptsP = Promise.all(Object.keys(cities).map(function (k) {
      if (cache[k] !== undefined || items.every(function (v) { return (v.city + (v.state ? ', ' + v.state : '')) !== k || isFinite(parseFloat(v.lat)); })) return null;
      return fdPlace(k).then(function (pt) { return pt || fdPlace(k.split(',')[0]); }).then(function (pt) { cache[k] = pt || null; });
    })).then(function () {
      try { sessionStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
      // An item's own point when the Guide has it (the parks); else its city's, marked approximate (said as "in <city>" or "about N mi").
      var out = {}; items.forEach(function (v) {
        if (isFinite(parseFloat(v.lat)) && isFinite(parseFloat(v.lng))) { out[v.slug] = { lat: +v.lat, lng: +v.lng }; return; }
        var pt = cache[v.city + (v.state ? ', ' + v.state : '')]; if (pt) out[v.slug] = { lat: pt.lat, lng: pt.lng, city: v.city, approx: 1 };
      });
      return (FDS.pts = out);
    });
    return FDS.ptsP;
  }
  function fdItems() { try { return (window.gfFinderData && window.gfFinderData()) || null; } catch (e) { return null; } }
  function fdText(v) { return [v.name, v.city, v.state, (v.teams || []).join(' '), v.hub ? String(v.hub).replace(/-/g, ' ') : '', v.hub && window.VE_HUBS ? (VE_HUBS.filter(function (h) { return h.slug === v.hub; })[0] || {}).name : ''].join(' ').toLowerCase(); }
  // Search: a ZIP or Near me through the Directory's Near me, a city through its place, else the words in the names.
  function fdSearch(f, q) {
    q = String(q || '').trim(); var my = ++FDS.seq, items = fdItems() || [], NM = fdNear();
    FDS.q = q; FDS.matches = null;
    if (!q) { FDS.mode = ''; FDS.origin = null; fdSetUrl('q', ''); queueDress(); return; }
    fdSetUrl('q', q === 'near' ? 'near' : q);
    if (q === 'near') {
      FDS.wantNear = true; FDS.mode = 'busy'; queueDress();
      if (NM) { var st0 = NM.state(); if (st0.on && !st0.zip && !st0.place) return fdOrigin(st0.origin, 'you', my); NM.start(main.querySelector('.fd-near')); }
      else FDS.mode = '';
      return;
    }
    FDS.mode = 'busy'; queueDress();
    if (/^\d{5}$/.test(q) && NM) {
      NM.zip(q).then(function (ok) { if (my !== FDS.seq) return; if (ok) fdOrigin(NM.state().origin, q, my); else { FDS.mode = 'none'; queueDress(); } });
      return;
    }
    var words = items.filter(function (v) { return fdText(v).indexOf(q.toLowerCase()) >= 0; });
    var exact = items.filter(function (v) { return (v.teams || []).some(function (t) { return String(t).toLowerCase() === q.toLowerCase(); }) || String(v.name).toLowerCase() === q.toLowerCase(); });
    if (exact.length) { FDS.mode = 'text'; FDS.matches = exact.map(function (v) { return v.slug; }); queueDress(); return; }
    var placeP = NM && NM.city ? NM.city(q).then(function (ok) { return ok ? NM.state().origin : null; }) : fdPlace(q);
    placeP.then(function (o) {
      if (my !== FDS.seq) return;
      if (o) return fdOrigin(o, q.replace(/(^|\s)\S/g, function (x) { return x.toUpperCase(); }), my);
      FDS.mode = words.length ? 'text' : 'none'; FDS.matches = words.map(function (v) { return v.slug; }); queueDress();
    });
  }
  function fdOrigin(o, label, my) {
    if (!o) { FDS.mode = 'none'; queueDress(); return; }
    FDS.origin = o; FDS.label = label;
    fdPoints(fdItems() || []).then(function () { if (my !== FDS.seq) return; FDS.mode = 'near'; queueDress(); });
  }
  var fdNearHooked = false;
  function fdHookNear() {
    var NM = fdNear(); if (fdNearHooked || !NM) return; fdNearHooked = true;
    NM.onChange(function (st) {
      if (!FDS.wantNear || !st.on) return;
      FDS.wantNear = false;
      fdOrigin(st.origin, st.zip ? st.zip : st.place ? st.place : 'you', FDS.seq);
    });
  }
  // Back and Forward: the chips and the search follow the address.
  // Chrome skips hashchange on Back when the query (?q= ?show=) differs too, and the Guide would keep the old view: a Finder page
  // sends it once itself when the browser did not.
  var fdHash = location.hash, fdHC = 0;
  window.addEventListener('popstate', function () {
    if (!FD) return; var n = fdHC, was = fdHash;
    setTimeout(function () {
      if (fdHC === n && location.hash !== was) window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: '', newURL: location.href }));
      var q = fdParams().get('q') || '';
      if (FDS.started && q !== FDS.q) { var f = fdCfg(current()); if (f) fdSearch(f, q); }
      queueDress();
    }, 0);
  });
  window.addEventListener('hashchange', function () { fdHC++; fdHash = location.hash; if (FD) queueDress(); });
  function fdChipOn(ch, f) {
    var t = ch[1];
    if (t && t.charAt(0) === '#') return location.hash.replace(/\?.*$/, '') === t || (!sub() && t === '#/' + (location.hash.replace(/^#\/?/, '').split('/')[0]));
    return FDS.show === t;
  }
  function fdDraw(c, after) {
    var f = fdCfg(c);
    if (!f) { [].forEach.call(main.querySelectorAll('.gf-fdx'), function (n) { n.remove(); }); return null; }
    if (main.querySelector(':scope > .dg-loading')) return null;
    // A part that draws its own Finder (the Supermarket Guide's Stores): nothing is added, its Search is the one orange action.
    if (f.own) { [].forEach.call(main.querySelectorAll('.gf-fdx'), function (n) { n.remove(); }); return main.querySelector('.fd-search .fd-go'); }
    fdHookNear();
    // The Guide's own city dropdown: every city, hidden; the search does its job.
    var rs = f.reset ? main.querySelector(f.reset) : null;
    if (rs && rs.value !== 'all' && [].some.call(rs.options, function (o) { return o.value === 'all'; })) { setTimeout(function () { if (rs.value !== 'all' && D.contains(rs)) { rs.value = 'all'; rs.dispatchEvent(new Event('change', { bubbles: true })); } }, 0); }
    FDS.show = fdParams().get('show') || '';
    if (!FDS.started) { FDS.started = true; var q0 = fdParams().get('q'); if (q0) setTimeout(function () { fdSearch(f, q0); }, 0); }
    // The part's line under its title, when the page gives one that fits the search (the Guide's old line named its dropdown).
    var ld = f.lede ? main.querySelector('.dg-head + .dg-lede') : null;
    if (ld && ld.textContent !== f.lede) ld.textContent = f.lede;
    // The search block, right after the Guide row (or the page head).
    var form = main.querySelector('.fd-search');
    if (!form) {
      form = D.createElement('form'); form.className = 'fd-search gf-fdx'; form.setAttribute('role', 'search'); form.setAttribute('aria-label', 'Find ' + (f.noun ? f.noun[1] : 'it') + ' near you');
      form.innerHTML = '<div class="fd-q"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="#1a1a1a" stroke-width="3"/><path d="M16 16l6 6" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/></svg>' +
        '<input type="text" name="q" placeholder="' + esc(f.placeholder || 'City or ZIP') + '" aria-label="' + esc(f.placeholder || 'City or ZIP') + '" autocomplete="off" data-dictate="off"></div>' +
        '<button type="button" class="dg-btn fd-near">&#9737; Near me</button><button type="submit" class="dg-btn fd-go">Search</button>';
      form.addEventListener('submit', function (e) { e.preventDefault(); var v = form.querySelector('input').value.trim(); if (!v) { form.querySelector('input').focus(); return; } fdSearch(f, v); });
      form.querySelector('.fd-near').addEventListener('click', function () { form.querySelector('input').value = ''; fdSearch(f, 'near'); });
      var ans0 = D.createElement('p'); ans0.className = 'fd-answer gf-fdx'; ans0.setAttribute('aria-live', 'polite');
      ans0.addEventListener('click', function (e) { if (e.target.closest('.fd-clear')) { e.preventDefault(); form.querySelector('input').value = ''; fdSearch(f, ''); } });
      form._ans = ans0;
    }
    var inp = form.querySelector('input');
    if (D.activeElement !== inp && inp.value !== (FDS.q === 'near' ? '' : FDS.q)) inp.value = FDS.q === 'near' ? '' : FDS.q;
    var ans = form._ans;
    var at = after && after.parentNode === main ? after : null;
    if (at) { if (at.nextElementSibling !== form) main.insertBefore(form, at.nextElementSibling); }
    else if (form.parentNode !== main) main.insertBefore(form, main.firstChild);
    if (form.nextElementSibling !== ans) main.insertBefore(ans, form.nextElementSibling);
    // The Guide's own filter switches (in the head) become the chips; the head's copy is hidden.
    var list = main.querySelector(f.list), emptyG = main.querySelector(':scope > .dg-empty');
    var items = fdItems(), cards = {};
    [].forEach.call(main.querySelectorAll(f.card), function (a) { var k = (a.getAttribute('href') || '').split('/').pop(); if (k) cards[k] = a; });
    var base = items ? items.filter(function (v) { return cards[v.slug]; }) : [];
    // Chips
    var chips = main.querySelector('.fd-chips');
    var CH = (f.chips || []).filter(function (ch) { return (ch[1] && ch[1].charAt(0) === '#') || base.length; });
    // An unknown ?show= is Everything.
    if (FDS.show && !CH.some(function (x) { return x[1] === FDS.show; })) FDS.show = '';
    if (CH.length > 1) {
      if (!chips) {
        chips = D.createElement('div'); chips.className = 'fd-chips gf-fdx'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Show');
        chips.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-show]'); if (!b) return;
          FDS.show = b.getAttribute('data-show'); fdSetUrl('show', FDS.show); queueDress();
        });
      }
      var ch = '<span>Show</span>' + CH.map(function (x) {
        var on = fdChipOn(x, f);
        return x[1] && x[1].charAt(0) === '#' ? '<a href="' + esc(x[1]) + '" aria-pressed="' + on + '">' + esc(x[0]) + '</a>'
          : '<button type="button" data-show="' + esc(x[1]) + '" aria-pressed="' + on + '">' + esc(x[0]) + '</button>';
      }).join('');
      if (chips.getAttribute('data-h') !== ch) { chips.setAttribute('data-h', ch); chips.innerHTML = ch; }
      var ref = list || emptyG || ans.nextElementSibling;
      if (ref && chips.nextElementSibling !== ref) main.insertBefore(chips, ref);
      else if (!ref && chips.parentNode !== main) main.appendChild(chips);
    } else if (chips) chips.remove();
    // What shows: the chip's filter, then the search.
    var dataChip = FDS.show ? CH.filter(function (x) { return x[1] && x[1].charAt(0) !== '#' && x[1] === FDS.show; })[0] : null;
    var routeChip = CH.filter(function (x) { return x[1] && x[1].charAt(0) === '#' && fdChipOn(x, f) && x[1] !== CH[0][1]; })[0];
    var set = base.filter(function (v) { return !dataChip || !!v[dataChip[1]]; });
    var R = f.radius || 100, D2 = {};
    if (FDS.mode === 'near' && FDS.origin && FDS.pts) set.forEach(function (v) { var pt = FDS.pts[v.slug]; D2[v.slug] = pt ? fdHav(FDS.origin, pt) : null; });
    var shown = set, within = [];
    if (FDS.mode === 'near') {
      shown = set.slice().sort(function (a, b) { return (D2[a.slug] == null ? 1e9 : D2[a.slug]) - (D2[b.slug] == null ? 1e9 : D2[b.slug]); });
      within = shown.filter(function (v) { return D2[v.slug] != null && D2[v.slug] <= R; });
      if (within.length) shown = within;
    } else if (FDS.mode === 'text' || FDS.mode === 'none') shown = set.filter(function (v) { return (FDS.matches || []).indexOf(v.slug) >= 0; });
    // Draw: hide what does not show, order by distance, the distance as a tag.
    var keep = {}; shown.forEach(function (v) { keep[v.slug] = 1; });
    Object.keys(cards).forEach(function (k) {
      var a = cards[k], hide = !!items && !keep[k];
      if (a.hidden !== hide) a.hidden = hide;
      var vk = items ? items.filter(function (v) { return v.slug === k; })[0] : null;
      var dt = a.querySelector('.fd-dist'), want = FDS.mode === 'near' && D2[k] != null && vk ? fdFar(vk, D2[k]).replace(/^./, function (x) { return x.toUpperCase(); }) : '';
      if (want && !dt) { var tg = a.querySelector(f.tags || '.sa-vtags'); if (tg) { dt = D.createElement('span'); dt.className = 'dg-tag fd-dist'; tg.insertBefore(dt, tg.firstChild); } }
      if (dt && !want) dt.remove(); else if (dt && dt.textContent !== want) dt.textContent = want;
    });
    if (list && FDS.mode === 'near') {
      var order = shown.map(function (v) { return cards[v.slug]; }).filter(Boolean), cur = [].filter.call(list.children, function (x) { return !x.hidden; });
      if (order.some(function (el, i) { return cur[i] !== el; })) order.forEach(function (el) { list.appendChild(el); });
    }
    // The answer, in one sentence, from the list.
    var noun = routeChip && routeChip[2] ? routeChip[2].split('|') : f.noun, unit = f.unit || ['Vegan item', 'Vegan items'];
    var cnt = function (v) { return +v[f.count || 'items'] || 0; }, sum = function (L) { return L.reduce(function (n, v) { return n + cnt(v); }, 0); };
    var phrase = dataChip ? ' ' + dataChip[2] : '';
    var freeV = set.filter(function (v) { return v[f.free || 'free']; })[0];
    var h = '', clear = FDS.mode && FDS.mode !== 'busy' ? ' <a href="#" class="fd-clear">Show everything</a>' : '';
    if (!items) h = 'Loading the ' + esc(f.noun[1]) + '...';
    else if (FDS.mode === 'busy') h = 'Looking...';
    else if (FDS.mode === 'near') {
      var near = FDS.label === 'you' ? 'you' : FDS.label;
      if (within.length) {
        var v0 = within[0];
        h = 'Near ' + esc(near) + ': <b>' + esc(v0.name) + '</b> is the closest, ' + esc(fdFar(v0, D2[v0.slug])) + ', with <b>' + fdN(cnt(v0), unit) + '</b>.' +
          (within.length > 1 ? ' <b>' + fdN(within.length - 1, ['more ' + noun[0], 'more ' + noun[1]]) + '</b> within ' + R + ' miles.' : ' No other ' + esc(noun[1]) + phrase + ' within ' + R + ' miles yet.');
      } else if (shown.length && D2[shown[0].slug] != null) h = 'No ' + esc(noun[1]) + phrase + ' in the Guide within ' + R + ' miles of ' + esc(near) + ' yet. The closest is <b>' + esc(shown[0].name) + '</b>, ' + esc(fdFar(shown[0], D2[shown[0].slug])) + '.';
      else h = 'No ' + esc(noun[1]) + phrase + ' in the Guide near ' + esc(near) + ' yet.';
    } else if (FDS.mode === 'text' || FDS.mode === 'none') {
      h = !shown.length ? 'Nothing in the Guide matches &ldquo;' + esc(FDS.q) + '&rdquo;' + phrase + ' yet.'
        : shown.length === 1 ? '<b>' + esc(shown[0].name) + '</b> matches &ldquo;' + esc(FDS.q) + '&rdquo;, with <b>' + fdN(cnt(shown[0]), unit) + '</b>.'
        : '<b>' + fdN(shown.length, noun) + '</b> match &ldquo;' + esc(FDS.q) + '&rdquo;, with <b>' + fdN(sum(shown), unit) + '</b> between them.';
    } else if (!shown.length) h = 'No ' + esc(noun[1]) + phrase + ' yet.';
    else if (shown.length === 1) h = '<b>' + esc(shown[0].name) + '</b> is the one ' + esc(noun[0]) + (phrase || ' in the Guide') + ' so far, with <b>' + fdN(cnt(shown[0]), unit) + '</b>' + (!dataChip && shown[0][f.free || 'free'] ? ', and it is free to try.' : '.');
    else h = '<b>' + fdN(shown.length, noun) + '</b> ' + (phrase ? 'are' + phrase : 'are in the Guide') + ' so far, with <b>' + fdN(sum(shown), unit) + '</b> between them.' +
      (!dataChip && freeV ? ' <b>' + esc(freeV.name) + '</b> is free to try.' : '');
    h += clear;
    if (ans.getAttribute('data-h') !== h) { ans.setAttribute('data-h', h); ans.innerHTML = h; }
    // The honest empty state, then "That is every ... so far", then the doorway.
    var tail = list || emptyG || chips || ans;
    var em = main.querySelector('.fd-empty');
    if (items && !shown.length && f.empty) {
      if (!em) { em = D.createElement('div'); em.className = 'fd-empty gf-fdx'; }
      var eh = '<span class="fd-ico" aria-hidden="true">+</span><div><b>' + esc(f.empty[0]) + '</b><p>' + esc(f.empty[1]) + '</p></div>' +
        (f.empty[2] ? '<div class="fd-btns"><a class="dg-btn" href="' + esc(f.empty[3]) + '">' + esc(f.empty[2]) + '</a></div>' : '');
      if (em.getAttribute('data-h') !== eh) { em.setAttribute('data-h', eh); em.innerHTML = eh; }
      if (tail.nextElementSibling !== em) main.insertBefore(em, tail.nextElementSibling);
      tail = em;
    } else if (em) em.remove();
    var end = main.querySelector('.fd-end');
    if (items && shown.length) {
      if (!end) { end = D.createElement('p'); end.className = 'fd-end gf-fdx'; }
      var et = FDS.mode === 'near' ? (within.length ? 'That is every ' + noun[0] + phrase + ' within ' + R + ' miles of ' + (FDS.label === 'you' ? 'you' : FDS.label) + ' so far.' : 'That is every ' + noun[0] + phrase + ' in the Guide so far, closest first.')
        : FDS.mode === 'text' ? 'That is everything in the Guide that matches “' + FDS.q + '” so far.'
        : 'That is every ' + noun[0] + phrase + ' in the Guide so far.';
      if (end.textContent !== et) end.textContent = et;
      if (tail.nextElementSibling !== end) main.insertBefore(end, tail.nextElementSibling);
      tail = end;
    } else if (end) end.remove();
    var low = main.querySelector('.fd-lower');
    if (f.after) {
      if (!low) {
        low = D.createElement('section'); low.className = 'fd-lower gf-fdx'; low.setAttribute('aria-label', f.after.label);
        low.innerHTML = '<span class="fd-lk">' + esc(f.after.label) + '</span><b>' + esc(f.after.title) + '</b><p>' + esc(f.after.line) + '</p>' +
          '<div class="fd-btns"><a class="dg-btn" href="' + esc(f.after.btn[1]) + '">' + esc(f.after.btn[0]) + '</a></div>';
      }
      if (tail.nextElementSibling !== low) main.insertBefore(low, tail.nextElementSibling);
    }
    return form.querySelector('.fd-go');
  }

  drawJoin(); drawToc(); dress(); queueProg();
})();
