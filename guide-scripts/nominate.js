/* Nominate Someone (Sean, 2026-11-09, approved; playbook ve-nominate-someone; proposal docs/proposals/nominate-someone.md).
 * The page is a copy of passport.html (the Explorer Guide, the template for Guides); this file follows guide-scripts/welcome-guide.js
 * (head, crumb, the Getting started card, artRow, the .vxc call to action, the rail's Back / N of M / Next) and the approved mock
 * /mocks/nominate/ (guide.js, nominate mode). The recorder is comment.html's. Server: the ve-nominations edge function.
 *
 *   #/        Overview: how to nominate, where their story could go, how it works
 *   #/who     Who: their name, their email, their area (the Explorer survey's chapters), what they do (pick any), This is me
 *   #/why     Why them: record (2:00, the time left shown), speak (the site's dictation mic) or write
 *   #/you     About you: your name and email (filled in when signed in), may we say it was you
 *   #/send    Read it over, the release, Send; then Thank you (#/sent)
 * ?city=<chapter> picks the area, ?source=hub|pulse|show|listing tells us where it came from.
 * Kai hosts; her lines are text (approved with the mock), in a different outfit on every page.
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-nominations';
  var PIC = '/public/guides/';
  var KAI = PIC + 'nominate/kai-';
  var MAX = 120;
  var MIC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var CSS = [
    '.nm-mock{margin:0;background:#FFF7EC;color:#5a3a00;border-bottom:1px solid #f5d9b0;font-size:12px;font-weight:600;padding:8px 40px;}',
    '.nm-mock b{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;border:2px solid #b45309;border-radius:6px;padding:1px 7px;margin-right:8px;}',
    '.dg-joinbox a.dg-btn{text-decoration:none;}',
    '.nm-quote{border-left:4px solid #F69820;background:var(--warm);border-radius:0 12px 12px 0;padding:12px 16px;margin:12px 0 4px;font-size:15px;line-height:1.55;}',
    '.nm-quote small{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;font-weight:800;color:#8a5a00;flex-wrap:wrap;}',
    '.nm-play{display:inline-flex;align-items:center;gap:6px;color:var(--g);font-weight:800;}',
    '.nm-play i{width:22px;height:22px;border-radius:50%;background:var(--g);display:grid;place-items:center;}',
    '.nm-play i::after{content:"";border-left:7px solid #fff;border-top:4px solid transparent;border-bottom:4px solid transparent;margin-left:2px;}',
    '.nm-f{display:block;font-size:12px;font-weight:800;margin:10px 0 4px;color:var(--ink);}',
    '.nm-f small{font-weight:600;color:var(--ink55);}',
    '.nm-in{width:100%;border:1px solid #cfcfcf;border-radius:6px;padding:11px 12px;font:inherit;font-size:14px;background:#fff;color:var(--ink);}',
    '.nm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px;}',
    '.nm-chips{display:flex;flex-wrap:wrap;gap:6px;}',
    '.nm-chip{border:1px solid #cfcfcf;border-radius:6px;padding:8px 12px;font-size:13px;font-weight:700;background:#fff;cursor:pointer;font-family:inherit;}',
    '.nm-chip[aria-pressed=true]{background:var(--g);border-color:var(--g);color:#fff;}',
    '.nm-modes{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:8px;margin:4px 0 12px;}',
    '.nm-mode{border:1px solid #cfcfcf;border-radius:8px;padding:10px 12px;font-size:12.5px;line-height:1.4;color:var(--ink75);background:#fff;text-align:left;font-family:inherit;cursor:pointer;}',
    '.nm-mode b{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--ink);margin-bottom:2px;}',
    '.nm-mode[aria-pressed=true]{border:2px solid var(--g);background:var(--gl);}',
    '.nm-best{margin-left:auto;font-size:9.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;background:#F69820;color:#1a1a1a;border-radius:5px;padding:2px 6px;}',
    '.nm-rec{display:flex;align-items:center;gap:12px;border:1px dashed var(--gm);border-radius:12px;padding:12px;background:#f6fbf6;flex-wrap:wrap;}',
    '.nm-dot{width:44px;height:44px;border-radius:50%;background:#dc2626;display:grid;place-items:center;flex:none;box-shadow:0 0 0 6px rgba(220,38,38,.12);border:0;cursor:pointer;}',
    '.nm-dot i{width:14px;height:14px;border-radius:3px;background:#fff;}',
    '.nm-wave{flex:1 1 140px;height:26px;border-radius:4px;background:repeating-linear-gradient(90deg,var(--g) 0 3px,transparent 3px 7px);-webkit-mask:linear-gradient(90deg,#000 0 58%,rgba(0,0,0,.18) 58%);mask:linear-gradient(90deg,#000 0 58%,rgba(0,0,0,.18) 58%);}',
    '.nm-rec small{flex:1 1 260px;font-size:12.5px;font-weight:700;color:var(--ink75);}',
    '.nm-check{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.5;margin:10px 0;color:var(--ink75);}',
    '.nm-check input{margin-top:4px;accent-color:var(--g);}',
    '.nm-check b{color:var(--ink);}',
    '.nm-rv{display:grid;grid-template-columns:150px minmax(0,1fr);gap:6px 14px;font-size:14px;margin:6px 0 10px;}',
    '.nm-rv dt{font-weight:800;color:var(--ink55);font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding-top:2px;}',
    '.nm-prog{height:6px;border-radius:3px;background:#eee;margin:6px 0 4px;overflow:hidden;}',
    '.nm-prog i{display:block;height:100%;background:var(--g);}',
    '.nm-form .wg-gs-b{height:auto !important;overflow:visible !important;}',
    '.nm-steps{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 0;}.nm-steps span{font-size:12px;font-weight:800;border-radius:6px;padding:6px 11px;border:1px solid #cfcfcf;color:var(--ink55);}.nm-steps span.on{background:var(--g);border-color:var(--g);color:#fff;}.nm-steps span.dn{background:var(--gl);border-color:var(--gm);color:var(--g);}',
    '.nm-google{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border:1px solid #dadce0;border-radius:6px;background:#fff;font:700 14px Montserrat,sans-serif;cursor:pointer;color:var(--ink);}.nm-google span{font-weight:900;color:#4285F4;font-size:16px;}',
    '.nm-apple{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;border:0;border-radius:6px;background:#000;color:#fff;font:700 14px Montserrat,sans-serif;cursor:pointer;margin-bottom:8px;}.nm-apple svg{width:16px;height:16px;fill:#fff;}',
    '.dg-maya.nm-vid::after{content:"\\25B6  Play Kai\'s welcome for you";position:absolute;left:12px;bottom:12px;background:rgba(0,0,0,.72);color:#fff;font:800 12px Montserrat,sans-serif;letter-spacing:.04em;padding:9px 12px;border-radius:6px;}',
    '.nm-gfx{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin:8px 0 18px;}',
    '.nm-g{position:relative;border-radius:12px;overflow:hidden;background:#14301c;color:#fff;display:flex;flex-direction:column;}',
    '.nm-g.sq{width:min(340px,100%);aspect-ratio:1;}.nm-g.st{width:min(220px,100%);aspect-ratio:9/16;}',
    '.nm-g-pic{flex:1 1 auto;min-height:0;background:#fff center bottom/contain no-repeat;}',
    '.nm-g-t{padding:12px 14px 40px;background:#14301c;position:relative;}',
    '.nm-g-t small{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c5f2c7;}',
    '.nm-g-t b{display:block;font-size:19px;font-weight:900;line-height:1.15;margin:4px 0;}',
    '.nm-g.st .nm-g-t b{font-size:17px;}',
    '.nm-g-t span{font-size:12px;font-weight:600;color:#e8f5e9;}',
    '.nm-g-logo{position:absolute;right:12px;bottom:10px;height:20px;}',
    '.nm-stamp{position:absolute;top:10px;right:10px;z-index:2;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#b45309;background:#fff;border:2px solid #b45309;border-radius:6px;padding:1px 7px;}',
    '.nm-me{position:relative;width:min(260px,100%);aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid var(--line);}.nm-me img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.nm-me-b{flex:1 1 280px;min-width:0;font-size:15px;line-height:1.55;color:var(--ink75);}.nm-me-b b{display:block;font-size:20px;font-weight:900;color:var(--ink);margin-bottom:4px;}',
    '.nm-q .wg-gs-pic{position:relative;}',
    '.nm-kq-btn{position:absolute;left:10px;bottom:16px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:6px;background:rgba(0,0,0,.78);color:#fff;font:800 12px Montserrat,sans-serif;letter-spacing:.04em;padding:9px 12px;cursor:pointer;}',
    '.nm-kq-ic{width:0;height:0;border-left:9px solid #fff;border-top:6px solid transparent;border-bottom:6px solid transparent;}',
    '.nm-kq.on .nm-kq-ic{width:10px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;}',
    '.nm-kq-bar{position:absolute;left:0;right:0;bottom:0;height:6px;background:rgba(0,0,0,.25);}',
    '.nm-kq-bar b{display:block;height:100%;width:0;background:#22C55E;}',
    '.nm-kq video{display:block;width:100%;height:100%;object-fit:cover;}',
    '.nm-hint{font-size:12.5px;color:var(--ink55);margin:8px 0 0;}',
    '.nm-sel{appearance:none;-webkit-appearance:none;padding-right:44px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%231a1a1a%27 stroke-width=%272%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 16px center;}',
    '.nm-spots{list-style:none;padding:0;margin:0;display:grid;gap:8px;}',
    '.nm-spots li{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;}',
    '.nm-spots li>b{font-size:14px;}',
    '.nm-spots li.done{background:var(--gl);border-color:var(--gm);}',
    '.nm-spots li.done a{margin-left:auto;font-size:12px;font-weight:800;color:var(--g);}',
    '.nm-spots li.now{display:block;}.nm-spots li.now>b{display:block;margin-bottom:6px;}.nm-spots li.now .dg-btn{margin-top:8px;}',
    '@media (max-width:900px){.nm-form.nm-q .wg-gs-pic{display:block;width:100%;height:auto;aspect-ratio:1;max-width:240px;flex:none;}}',
    '.nm-or{text-align:center;font-size:12px;font-weight:700;color:var(--ink55);margin:12px 0 2px;}',
    '@media (max-width:900px){.nm-mock{padding:8px 16px;}.nm-form .wg-gs-pic{display:none;}.nm-grid,.nm-modes{grid-template-columns:1fr;}.nm-rv{grid-template-columns:1fr;gap:2px;}.nm-rv dd{margin-bottom:8px;}}',
    '.dg-maya .nm-kv-btn{top:10px;bottom:auto;}@media (max-width:900px){.dg-maya .nm-kv-btn{top:6px;left:6px;padding:6px 8px;font-size:11px;}}',
    '.dg-maya .nm-kv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}.dg-maya.on .nm-kq-ic{width:10px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;}',
    '.nm-msg{min-height:20px;font-size:13.5px;font-weight:700;color:var(--g);margin:8px 0 0;}.nm-msg.bad{color:#b42318;}',
    '.nm-dot.live{animation:nmPulse 1.2s infinite;}@keyframes nmPulse{0%,100%{box-shadow:0 0 0 6px rgba(220,38,38,.12)}50%{box-shadow:0 0 0 12px rgba(220,38,38,.06)}}',
    '.nm-dot.idle{background:#fff;border:2px solid #dc2626;}.nm-dot.idle i{border-radius:50%;background:#dc2626;}',
    '.nm-rec audio{width:100%;margin-top:6px;}',
    '.nm-file{font-size:12.5px;color:var(--ink55);margin:8px 0 0;}.nm-file label{color:var(--g);font-weight:800;cursor:pointer;text-decoration:underline;}',
    '.nm-signed{font-size:14px;background:var(--gl);border:1px solid var(--gm);border-radius:10px;padding:10px 12px;margin:4px 0 6px;}'
  ].join('');
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  var ROLES = [['business_owner', 'Business owner'], ['content_creator', 'Content creator'], ['nonprofit', 'Works for a nonprofit'], ['activist', 'Activist']];
  var TABS = [
    // Kai's lines, approved by Sean 2026-11-09 ("lines are good, record them"); each say matches its recording word for word.
    { k: 'overview', label: 'Overview', art: 'flowers', say: 'Hi, I\'m Kai. Somebody in your community deserves their flowers, and this is how you give them. Tell us who they are: a business owner, a creator, someone at a nonprofit, or an activist making Vegan life better near you. Then tell us why, in your own words. Record it if you can, because your voice might be what we play when we tell their story, on our podcast, on your city\'s page, and in the Daily Pulse. Our team reviews every nomination, and if we agree, I invite them to a short interview with me. It takes about two minutes. Let\'s give someone their flowers.' },
    { k: 'who', label: 'Who', art: 'welcome', say: 'Who deserves their flowers? Give me their name and their email, so we can reach them. Then pick where they are and what they do. Pick as many as fit.' },
    { k: 'why', label: 'Why Them', art: 'listen', say: 'Now tell me why. Record it if you can. You have up to two minutes, and you can listen back before you send. Prefer to type? That works too.' },
    { k: 'you', label: 'About You', art: 'phone', say: 'Just so we know who to thank. Add your name and email, and tell us if it\'s okay to say it was you.' },
    { k: 'send', label: 'Send', art: 'cheer', say: 'Read it over. If it looks right, tick the boxes and send it. Our team reviews every nomination, and we\'ll let you know when we reach out.' }
  ];
  var qs = new URLSearchParams(location.search);
  var SOURCE = /^(hub|pulse|show|listing)$/.test(qs.get('source') || '') ? qs.get('source') : 'direct';
  // ?preview=1 walks every page with sample answers filled in; nothing is sent (Sean, 2026-11-09: "I need the preview journey so I don't have to enter the information").
  var PREVIEW = qs.get('preview') === '1';
  var CHAPTERS = [], ME = null;
  var S = { name: '', email: '', city: (qs.get('city') || '').toLowerCase(), other: '', roles: [], self: false, mode: 'rec', written: '',
            blob: null, type: '', seconds: 0, url: '', you: '', youEmail: '', credit: true, release: false, adult: false, sent: false };
  var rec = null, chunks = [], t0 = 0, tick = null;
  if (PREVIEW) S = { name: 'Sample: Maria Rodriguez', email: 'maria@example.com', city: 'south-florida', other: '', roles: ['business_owner', 'activist'], self: false, mode: 'write',
    written: 'She feeds the whole block every Thursday and never asks for anything back. Half of us tried Vegan food for the first time at her table.',
    blob: null, type: '', seconds: 0, url: '', you: 'Sample: Dana P.', youEmail: 'dana@example.com', credit: true, release: true, adult: true, sent: false };

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour'), tourM = document.getElementById('dgTourM');
  var foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  var curTab = 'overview';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pic(p) { return PIC + p; }
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function tok() { try { return localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function api(body) {
    var h = { 'Content-Type': 'application/json' }, t = tok(); if (t) h.Authorization = 'Bearer ' + t;
    return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function idx(k) { return TABS.indexOf(tab(k)); }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function head(k, h, lede) { return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + esc(h) + '</h2></div></div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : ''); }
  function crumb(label) { return '<div class="dg-crumb"><a href="#/">Nominate Someone</a> &rsaquo; ' + esc(label) + '</div>'; }
  function card(kicker, title, picUrl, body, btns, cls) {
    return '<section class="wg-gs' + (cls ? ' ' + cls : '') + '"><span class="wg-gs-pic"><img src="' + esc(picUrl) + '" alt="" decoding="async" width="640" height="640"></span>' +
      '<div class="wg-gs-b"><div class="vgi-k">' + esc(kicker) + '</div><h3 class="wg-gs-t">' + esc(title) + '</h3>' + body +
      '<p class="nm-msg" id="nmMsg" role="status"></p>' + (btns ? '<div class="wg-gs-btns">' + btns + '</div>' : '') + '</div></section>';
  }
  function lines(ps) { return ps.map(function (x) { return '<p>' + x + '</p>'; }).join(''); }
  function artRow(picUrl, title, txt) { return '<li class="wg-art"><span class="wg-art-img" style="background-image:url(&quot;' + esc(picUrl) + '&quot;)"></span><div><span class="wg-art-t">' + esc(title) + '</span><p>' + esc(txt) + '</p></div></li>'; }
  function group(label, rows) { return '<div class="wg-grp"><h5>' + esc(label) + '</h5><ol>' + rows.join('') + '</ol></div>'; }
  function cta(k, title, text, go) {
    if (window.VEExplorerCard) VEExplorerCard.html({});
    return '<section class="vxc" aria-label="' + esc(go[0]) + '"><div class="vxc-b"><div class="vxc-k">' + esc(k) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>' +
      '<a class="vxc-go" href="' + esc(go[1]) + '">' + esc(go[0]) + '</a></section>';
  }
  function say(t, bad) { var m = $('nmMsg'); if (m) { m.textContent = t || ''; m.className = 'nm-msg' + (bad ? ' bad' : ''); } }
  function isEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }
  function areaName() { if (S.city === 'other') return S.other || 'Somewhere else'; for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].slug === S.city) return CHAPTERS[i].name; return ''; }

  // ---------- the steps ----------
  function checkWho() {
    if (!S.name.trim()) return 'Their name, please.';
    if (!isEmail(S.email.trim())) return 'Their email, so we can reach them.';
    if (!S.city) return 'Where are they? Pick their area.';
    if (S.city === 'other' && !S.other.trim()) return 'Tell us their city or area.';
    return '';
  }
  function checkWhy() {
    if (rec) return 'Stop the recording first.';
    if (S.mode === 'rec' && !S.blob) return 'Record why, or switch to Speak or Write.';
    if (S.mode !== 'rec' && S.written.trim().length < 3) return 'Tell us why in a few words, or switch to Record.';
    return '';
  }
  function checkYou() {
    if (!S.you.trim()) return 'Your name, please.';
    if (S.youEmail.trim() && !isEmail(S.youEmail.trim())) return 'Your email does not look right.';
    return '';
  }
  var CHECKS = { why: checkWho, you: function () { return checkWho() || checkWhy(); }, send: function () { return checkWho() || checkWhy() || checkYou(); } };
  var FIRST_BAD = function () { return checkWho() ? 'who' : checkWhy() ? 'why' : checkYou() ? 'you' : ''; };

  function modes() {
    var m = [['rec', 'Record your voice', 'Up to 2 minutes. Listen back first.', true], ['say', 'Speak, we type', 'Tap the mic in the box and talk.'], ['write', 'Write it out', 'Prefer typing? We can read it for you.']];
    return '<div class="nm-modes" role="group" aria-label="How to answer">' + m.map(function (x) {
      return '<button type="button" class="nm-mode" data-mode="' + x[0] + '" aria-pressed="' + (x[0] === S.mode) + '"><b>' + (x[0] === 'rec' ? MIC : '') + esc(x[1]) + (x[3] ? '<span class="nm-best">Best</span>' : '') + '</b>' + esc(x[2]) + '</button>';
    }).join('') + '</div><div class="nm-ans" id="nmAns">' + answer() + '</div>';
  }
  function answer() {
    if (S.mode === 'rec') {
      return '<div class="nm-rec"><button type="button" class="nm-dot ' + (rec ? 'live' : 'idle') + '" id="nmRec" aria-label="' + (rec ? 'Stop recording' : 'Start recording') + '"><i></i></button>' +
        '<span id="nmRecTxt" style="flex:1 1 220px;font-size:13.5px;font-weight:700;color:var(--ink75)">' + recText() + '</span>' +
        (S.url && !rec ? '<audio controls src="' + esc(S.url) + '"></audio>' : '') + '</div>' +
        '<p class="nm-file">No microphone handy? <label for="nmFile">Attach a voice memo</label> instead.<input type="file" id="nmFile" accept="audio/*" hidden></p>';
    }
    return '<textarea class="nm-in" id="nmText" rows="6" maxlength="4000" placeholder="' + (S.mode === 'say' ? 'Tap the mic at the right of this box and talk; your words appear here.' : 'Write it in your own words.') + '">' + esc(S.written) + '</textarea>';
  }
  function recText() {
    if (rec) { var s = (Date.now() - t0) / 1000; return '<b>' + fmt(s) + '</b> recorded &middot; <b>' + fmt(MAX - s) + ' left</b> of 2:00 &middot; tap to stop'; }
    if (S.blob) return 'Your recording: <b>' + fmt(S.seconds) + '</b>. Listen back, or tap the button to record again.';
    return 'Tap the red button and start talking. You have up to 2:00, and you can listen back before you send.';
  }

  var VIEWS = {
    overview: function () {
      return head('Free for everyone', 'Give Someone Their Flowers', '') +
        // One short paragraph, 250 characters or less, so the card never scrolls (Sean, 2026-11-09).
        card('Getting started', 'How to nominate someone', pic('thumb-community.jpg'), lines([
          'Think of someone who makes Vegan life better near you: a business owner, a creator, someone at a nonprofit or an activist. Tell us why, by voice if you can. If we agree, Kai invites them to an interview.']),
          '<a class="dg-btn" href="#/who">Nominate someone</a>') +
        '<div class="wg-arts">' +
        group('Where their story could go', [
          artRow(pic('holiday/p-listen.jpg'), 'The Podcast', 'Our city shows feature a Local voice: the nomination, then their story in their own words.'),
          artRow(pic('partner-community-manager.jpg'), 'Your City\'s Page', 'Community Voices on the city hubs, where their answer plays in their own voice.'),
          artRow(pic('restaurant-guide/t-pulse.jpg'), 'The Daily Pulse', 'A story in your city\'s morning briefing the week they are featured.')]) +
        group('How it works', [
          artRow(pic('holiday/w-say.jpg'), 'You Nominate', 'Their name, their email so we can reach them, and why, in about two minutes.'),
          artRow(pic('thumb-passport.jpg'), 'We Review', 'Our team reads and listens to every one. Nothing goes to them until we agree.'),
          artRow(pic('creator-guide.jpg'), 'Kai Interviews Them', 'They get an invitation and a short interview with Kai. It is an audition: every nominee is considered.')]) +
        '</div>' + cta('Know someone?', 'Nominate them today.', 'It takes about two minutes, and it could be the best news they get all week.', ['Nominate someone', '#/who']);
    },
    who: function () {
      var opts = '<option value="">Pick their area</option>' + CHAPTERS.map(function (c) { return '<option value="' + esc(c.slug) + '"' + (c.slug === S.city ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') +
        '<option value="other"' + (S.city === 'other' ? ' selected' : '') + '>Somewhere else</option>';
      return crumb('Who') + head('Step 1 of 4', 'Who Are You Nominating?', '') +
        card('Who', 'Tell us who deserves their flowers', pic('thumb-community.jpg'),
          '<div class="nm-grid"><div><label class="nm-f" for="nmName">Their name</label><input class="nm-in" id="nmName" data-k="name" autocomplete="off" data-dictate="off" value="' + esc(S.name) + '"></div>' +
          '<div><label class="nm-f" for="nmEmail">Their email <small>(so we can reach them)</small></label><input class="nm-in" type="email" id="nmEmail" data-k="email" autocomplete="off" value="' + esc(S.email) + '"></div></div>' +
          '<div class="nm-grid"><div><label class="nm-f" for="nmCity">Where they are</label><select class="nm-in nm-sel" id="nmCity" data-k="city">' + opts + '</select></div>' +
          '<div' + (S.city === 'other' ? '' : ' hidden') + ' id="nmOtherWrap"><label class="nm-f" for="nmOther">Their city or area</label><input class="nm-in" id="nmOther" data-k="other" data-dictate="off" value="' + esc(S.other) + '"></div></div>' +
          '<span class="nm-f">What they do <small>(pick any that fit)</small></span><div class="nm-chips">' + ROLES.map(function (r) { return '<button type="button" class="nm-chip" data-role="' + r[0] + '" aria-pressed="' + (S.roles.indexOf(r[0]) > -1) + '">' + esc(r[1]) + '</button>'; }).join('') + '</div>' +
          '<label class="nm-check"><input type="checkbox" id="nmSelf"' + (S.self ? ' checked' : '') + '> <span><b>This is me.</b> Self-nominations are welcome.</span></label>',
          '<button type="button" class="dg-btn" data-go="why">Next: Why them</button>', 'nm-form');
    },
    why: function () {
      return crumb('Why Them') + head('Step 2 of 4', 'Why Do They Deserve Their Flowers?', 'In your own words. If you record it, we may play it on the show when we tell their story.') +
        card('Why them', 'Say it however is easiest', pic('holiday/w-say.jpg'), modes(),
          '<a class="dg-btn dg-ghost" href="#/who">Back</a><button type="button" class="dg-btn" data-go="you">Next: About you</button>', 'nm-form');
    },
    you: function () {
      return crumb('About You') + head('Step 3 of 4', 'Who Is Nominating Them?', '') +
        card('About you', 'So we know who to thank', pic('welcome-ensemble.jpg'),
          (ME ? '<p class="nm-signed">You are signed in as <b>' + esc(ME.name || ME.email) + '</b>. We filled in your details.</p>' : '') +
          '<div class="nm-grid"><div><label class="nm-f" for="nmYou">Your name</label><input class="nm-in" id="nmYou" data-k="you" autocomplete="name" data-dictate="off" value="' + esc(S.you) + '"></div>' +
          '<div><label class="nm-f" for="nmYouEmail">Your email <small>(so we can tell you when we reach out)</small></label><input class="nm-in" type="email" id="nmYouEmail" data-k="youEmail" autocomplete="email" value="' + esc(S.youEmail) + '"></div></div>' +
          '<label class="nm-check"><input type="checkbox" id="nmCredit"' + (S.credit ? ' checked' : '') + '> <span><b>You may say I nominated them.</b> We tell them who put their name forward, and we may say it on the show.</span></label>',
          '<a class="dg-btn dg-ghost" href="#/why">Back</a><button type="button" class="dg-btn" data-go="send">Next: Send</button>', 'nm-form');
    },
    send: function () {
      var rl = S.roles.map(function (k) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i][0] === k) return ROLES[i][1]; return k; }).join(', ');
      return crumb('Send') + head('Step 4 of 4', 'Read It Over, Then Send', '') +
        card('Your nomination', S.name + (areaName() ? ', ' + areaName() : ''), pic('partner-community-manager.jpg'),
          '<dl class="nm-rv"><dt>Who</dt><dd>' + esc(S.name) + ' (' + esc(S.email) + ')' + (rl ? '<br>' + esc(rl) : '') + (S.self ? '<br>Self-nominated' : '') + ' <a href="#/who" style="color:var(--g);font-weight:800;font-size:12px">Edit</a></dd>' +
          '<dt>Why</dt><dd>' + (S.mode === 'rec' ? 'Your ' + fmt(S.seconds) + ' recording' + (S.url ? '<br><audio controls src="' + esc(S.url) + '" style="width:100%;margin-top:4px"></audio>' : '') : esc(S.written)) + ' <a href="#/why" style="color:var(--g);font-weight:800;font-size:12px">Edit</a></dd>' +
          '<dt>From</dt><dd>' + esc(S.you) + (S.credit ? ', you may say so' : ', keep my name private') + ' <a href="#/you" style="color:var(--g);font-weight:800;font-size:12px">Edit</a></dd></dl>' +
          '<label class="nm-check"><input type="checkbox" id="nmRelease"' + (S.release ? ' checked' : '') + '> <span><b>You may use my nomination.</b> Vegans Explore may play or read it, and edit it for length, on our shows, in the Daily Pulse, on social and on city pages. I can ask for it to come down at any time at contact@lesaruss.com.</span></label>' +
          '<label class="nm-check"><input type="checkbox" id="nmAdult"' + (S.adult ? ' checked' : '') + '> <span>I am 18 or over.</span></label>',
          '<a class="dg-btn dg-ghost" href="#/you">Back</a><button type="button" class="dg-btn" id="nmSend">Send my nomination</button>', 'nm-form');
    },
    sent: function () {
      return crumb('Sent') + head('Thank you', 'Your Nomination Is In', '') +
        card('What happens next', 'We review every one', pic('thumb-passport.jpg'), lines([
          '<b>We look at it.</b> Our team reads and listens to every nomination.',
          '<b>If we agree,</b> Kai invites ' + esc(S.name.replace(/^Sample:\s*/, '').split(' ')[0] || 'them') + ' to a short interview' + (S.youEmail ? ', and we email you when we reach out.' : '.'),
          '<b>If they are featured,</b> you hear about it, with a link to share.']),
          '<button type="button" class="dg-btn" id="nmAgain">Nominate someone else</button>') +
        (ME ? '' : cta('Not a member yet?', 'Become a Founder.', 'Free, about two minutes, with 250 points.', ['Become a Founder', '/passport#/founder']));
    }
  };

  // ---------- recording (comment.html's recorder) ----------
  function paintRec() { var a = $('nmAns'); if (a && S.mode === 'rec') a.innerHTML = answer(); }
  function startRec() {
    if (!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { say('This browser cannot record here. Attach a voice memo, or switch to Write it out.', true); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); })[0];
      rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined); chunks = []; t0 = Date.now();
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: (rec.mimeType || 'audio/webm').split(';')[0] });
        var secs = (Date.now() - t0) / 1000; rec = null; clearInterval(tick); setAudio(blob, Math.min(secs, MAX)); paintRec();
      };
      rec.start(1000); say(''); paintRec();
      tick = setInterval(function () { var s = (Date.now() - t0) / 1000; var el = $('nmRecTxt'); if (el) el.innerHTML = recText(); if (s >= MAX) stopRec(); }, 250);
    }).catch(function () { say('We could not use your microphone. Allow it in your browser, or attach a voice memo instead.', true); });
  }
  function stopRec() { if (rec && rec.state !== 'inactive') rec.stop(); }
  function setAudio(blob, secs) {
    if (S.url) URL.revokeObjectURL(S.url);
    S.blob = blob; S.type = blob.type || 'audio/webm'; S.seconds = secs; S.url = URL.createObjectURL(blob); say('');
  }

  // ---------- send ----------
  function send(btn) {
    var bad = FIRST_BAD(); if (bad) { location.hash = '#/' + bad; return; }
    S.release = $('nmRelease').checked; S.adult = $('nmAdult').checked;
    if (!S.release) { say('Tick the box to let us use your nomination.', true); return; }
    if (!S.adult) { say('Tick the box to say you are 18 or over.', true); return; }
    btn.disabled = true; btn.textContent = 'Sending...'; say('');
    if (PREVIEW) { S.sent = true; location.hash = '#/sent'; return; }
    var base = { action: 'submit', nominee_name: S.name.trim(), nominee_email: S.email.trim(), community_slug: S.city === 'other' ? '' : S.city,
      community_other: S.city === 'other' ? S.other.trim() : '', roles: S.roles, self_nominated: S.self, written: S.mode === 'rec' ? '' : S.written.trim(),
      nominator_name: S.you.trim(), nominator_email: S.youEmail.trim(), credit_ok: S.credit, release: true, adult: true, source: SOURCE };
    var up = S.mode === 'rec' && S.blob ? api({ action: 'upload', type: S.type, size: S.blob.size }).then(function (d) {
      if (!d || !d.ok) throw d || {};
      return fetch(d.url, { method: 'PUT', headers: { 'Content-Type': S.type, 'x-upsert': 'true' }, body: S.blob }).then(function (r) {
        if (!r.ok) throw { message: 'Your recording did not upload. Try again.' };
        base.audio = { path: d.path, key: d.key, seconds: Math.round(S.seconds) };
      });
    }) : Promise.resolve();
    up.then(function () { return api(base); }).then(function (d) {
      if (!d || !d.ok) throw d || {};
      S.sent = true; location.hash = '#/sent';
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'Send my nomination'; say((e && e.message) || 'That did not send. Try again in a minute.', true); });
  }
  function reset() {
    var keep = { you: S.you, youEmail: S.youEmail, credit: S.credit };
    if (S.url) URL.revokeObjectURL(S.url);
    S = { name: '', email: '', city: '', other: '', roles: [], self: false, mode: 'rec', written: '', blob: null, type: '', seconds: 0, url: '',
          you: keep.you, youEmail: keep.youEmail, credit: keep.credit, release: false, adult: false, sent: false };
    location.hash = '#/who';
  }

  // ---------- menu and Kai (welcome-guide.js) ----------
  function drawMenu(cur) {
    menuEl.innerHTML = TABS.map(function (t) { return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + '>' + esc(t.label) + '</a>'; }).join('');
    menuSel.innerHTML = TABS.map(function (t, n) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(t.label) + '</option>'; }).join('');
  }
  document.documentElement.classList.toggle('dg-dd', TABS.length > 5);
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });
  foldBtn.addEventListener('click', function () {
    var f = !railEl.classList.contains('dg-folded'); railEl.classList.toggle('dg-folded', f);
    foldBtn.textContent = f ? 'Show Kai' : 'Hide Kai'; foldBtn.setAttribute('aria-expanded', String(!f));
  });
  // Kai speaks on every page (Sean, 2026-11-09: "this page should have narration of Kai on it, on each page"). The Overview is her video
  // (the Welcome Guide's section-video recipe, captions on); Who, Why Them, About You and Send are lip-synced clips in that page's outfit.
  // Nothing plays until pressed. Pressing Play lets the next page's clip play on its own; Pause stops that (the interview's rule).
  var VID = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/kai/nominate/';
  function auto() { try { return sessionStorage.getItem('nm_kai_auto') === '1'; } catch (e) { return false; } }
  function setAuto(on) { try { sessionStorage.setItem('nm_kai_auto', on ? '1' : '0'); } catch (e) {} }
  function drawVideo(t, noClip) {
    var box = $('dgMaya'); box.style.backgroundImage = "url('" + KAI + t.art + ".jpg')";
    var old = box.querySelector('video'); if (old) { old.pause(); }
    if (noClip) { box.innerHTML = ''; $('dgPlay').hidden = true; return; }
    var ov = t.k === 'overview';
    box.innerHTML = '<video class="nm-kv" playsinline preload="metadata" crossorigin="anonymous" poster="' + (ov ? VID + 'overview-v1-poster.jpg' : KAI + t.art + '.jpg') + '" src="' + VID + t.k + '-v1.mp4?v=1">' +
      (ov ? '<track kind="captions" srclang="en" label="English" src="' + VID + 'overview-v1.vtt?v=1" default>' : '') + '</video>' +
      '<i class="nm-kq-bar"><b></b></i>';
    // The template's own Play button (#dgPlay, under Kai's name; in the phone card's button row), never on her picture (nothing covers a face).
    var v = box.querySelector('video'), btn = $('dgPlay'), bar = box.querySelector('.nm-kq-bar b');
    btn.hidden = false; btn.innerHTML = '&#9654; Play Kai';
    var lbl = { set textContent(x) { btn.innerHTML = (x === 'Pause' ? '&#10074;&#10074; ' : '&#9654; ') + x; } };
    v.addEventListener('timeupdate', function () { bar.style.width = (v.duration ? v.currentTime / v.duration * 100 : 0) + '%'; });
    v.addEventListener('play', function () { box.classList.add('on'); lbl.textContent = 'Pause'; });
    v.addEventListener('pause', function () { box.classList.remove('on'); lbl.textContent = v.ended ? 'Play again' : 'Play Kai'; });
    btn.onclick = function () {
      if (v.paused) { if (v.ended) v.currentTime = 0; setAuto(true); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else { setAuto(false); v.pause(); }
    };
    if (auto()) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
  }
  function drawKai(sayOverride) {
    var t = tab(curTab), i = TABS.indexOf(t);
    bubble.textContent = sayOverride || t.say;
    drawVideo(t, !!sayOverride);
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(TABS[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + TABS.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(TABS[Math.min(TABS.length - 1, i + 1)].k) + '"' + (i < TABS.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }
  function route() {
    var k = (location.hash.replace(/^#\/?/, '') || 'overview').split(/[?\/]/)[0] || 'overview';
    if (k === 'sent' && !S.sent) k = 'overview';
    if (!VIEWS[k]) k = 'overview';
    if (CHECKS[k] && CHECKS[k]()) { var bad = FIRST_BAD(); if (bad && idx(bad) < idx(k)) { location.replace('#/' + bad); return; } }
    if (rec && k !== 'why') stopRec();
    curTab = k === 'sent' ? 'send' : k;
    main.innerHTML = (PREVIEW ? '<p class="dg-note"><b>Preview.</b> Sample answers are filled in so you can see every page. Nothing is sent.</p>' : '') + VIEWS[k]();
    drawMenu(curTab); drawKai(k === 'sent' ? 'Thank you! You just made someone\'s week, even if they don\'t know it yet.' : '');
    window.scrollTo(0, 0);
  }

  // ---------- inputs ----------
  document.addEventListener('input', function (e) {
    var el = e.target; if (el.closest && el.closest('.nm-form')) say('');
    if (el.id === 'nmText') { S.written = el.value; return; }
    var k = el.getAttribute && el.getAttribute('data-k'); if (k) S[k] = el.value;
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'nmCity') { S.city = el.value; var w = $('nmOtherWrap'); if (w) w.hidden = el.value !== 'other'; }
    if (el.id === 'nmSelf') S.self = el.checked;
    if (el.id === 'nmCredit') S.credit = el.checked;
    if (el.id === 'nmRelease') S.release = el.checked;
    if (el.id === 'nmAdult') S.adult = el.checked;
    if (el.id === 'nmFile') {
      var f = el.files && el.files[0]; if (!f) return;
      if (!/^audio\//.test(f.type)) { say('That file is not a recording.', true); return; }
      if (f.size > 25 * 1024 * 1024) { say('That recording is over 25 MB. Try a shorter one.', true); return; }
      var a = new Audio(); a.preload = 'metadata';
      a.onloadedmetadata = function () { var d = isFinite(a.duration) ? a.duration : 0; if (d > MAX + 10) { say('That one runs ' + fmt(d) + '. Keep it under 2:00.', true); return; } setAudio(f, d); paintRec(); };
      a.onerror = function () { setAudio(f, 0); paintRec(); };
      a.src = URL.createObjectURL(f);
    }
  });
  document.addEventListener('click', function (e) {
    var m = e.target.closest('.nm-mode');
    if (m) { if (rec) stopRec(); S.mode = m.getAttribute('data-mode'); m.parentNode.querySelectorAll('.nm-mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b === m)); }); $('nmAns').innerHTML = answer(); say(''); return; }
    var c = e.target.closest('.nm-chip');
    if (c) { var r = c.getAttribute('data-role'), on = S.roles.indexOf(r) > -1; S.roles = on ? S.roles.filter(function (x) { return x !== r; }) : S.roles.concat(r); c.setAttribute('aria-pressed', String(!on)); return; }
    if (e.target.closest('#nmRec')) { if (rec) stopRec(); else startRec(); return; }
    var g = e.target.closest('[data-go]');
    if (g) { var to = g.getAttribute('data-go'), err = CHECKS[to] && CHECKS[to](); if (err) { say(err, true); return; } location.hash = '#/' + to; return; }
    if (e.target.closest('#nmSend')) { send(e.target.closest('#nmSend')); return; }
    if (e.target.closest('#nmAgain')) { reset(); return; }
  });
  window.addEventListener('beforeunload', function (e) { if (!PREVIEW && (S.blob || S.written) && !S.sent) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('hashchange', route);
  tourM.addEventListener('click', function (e) { if (e.target.closest('.dg-tnav')) setTimeout(function () { railEl.scrollIntoView({ block: 'start' }); }, 0); });

  route();
  api({ action: 'chapters' }).then(function (d) {
    CHAPTERS = (d && d.chapters) || [];
    if (S.city && S.city !== 'other' && !CHAPTERS.some(function (c) { return c.slug === S.city; })) S.city = '';
    if (d && d.me) { ME = d.me; if (!S.you) S.you = ME.name || ''; if (!S.youEmail) S.youEmail = ME.email || ''; }
    if (curTab === 'who' || curTab === 'you') route();
  }).catch(function () {});
})();
